import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CreativeHistoryItem {
  id: string;
  original_images: string[];
  prompt: string;
  generated_image: string;
  created_at: string;
}

export function useCreativeEngine() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<CreativeHistoryItem[]>([]);
  const { session } = useAuth();

  const generateCreative = async (images: string[], prompt: string): Promise<string | null> => {
    if (!session?.access_token) {
      toast.error('Você precisa estar logado para usar a Máquina de Criativos');
      return null;
    }

    if (!images || images.length === 0) {
      toast.error('Adicione pelo menos uma imagem');
      return null;
    }

    if (!prompt.trim()) {
      toast.error('Descreva o que você deseja fazer com as imagens');
      return null;
    }

    setLoading(true);
    
    try {
      console.log('Sending images to Creative Engine:', { 
        imageCount: images.length,
        promptLength: prompt.length 
      });

      const { data, error } = await supabase.functions.invoke('creative-engine', {
        body: { 
          images,
          prompt
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error calling creative-engine:', error);
        throw error;
      }

      if (data?.error) {
        console.error('Error from creative-engine:', data.error);
        toast.error(data.error);
        return null;
      }

      if (!data?.generatedImage) {
        throw new Error('Nenhuma imagem foi gerada');
      }

      // Save to history
      const { error: insertError } = await supabase
        .from('creative_history')
        .insert({
          user_id: session.user.id,
          original_images: images,
          prompt,
          generated_image: data.generatedImage
        });

      if (insertError) {
        console.error('Error saving to history:', insertError);
        // Don't throw, still return the image
      }

      toast.success('Criativo gerado com sucesso! 🎨');
      
      // Refresh history
      await loadHistory();

      return data.generatedImage;

    } catch (error) {
      console.error('Error generating creative:', error);
      toast.error('Erro ao gerar criativo. Tente novamente.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('creative_history')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface
      const transformedData = (data || []).map(item => ({
        ...item,
        original_images: Array.isArray(item.original_images) 
          ? item.original_images as string[] 
          : []
      }));

      setHistory(transformedData);
    } catch (error) {
      console.error('Error loading creative history:', error);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('creative_history')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHistory(prev => prev.filter(item => item.id !== id));
      toast.success('Criativo removido do histórico');
    } catch (error) {
      console.error('Error deleting history item:', error);
      toast.error('Erro ao remover criativo');
    }
  };

  return {
    loading,
    history,
    generateCreative,
    loadHistory,
    deleteHistoryItem,
  };
}