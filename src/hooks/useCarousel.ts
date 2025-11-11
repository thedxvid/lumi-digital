import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CarouselImage {
  url: string;
  description: string;
}

export interface CarouselHistoryItem {
  id: string;
  user_id: string;
  prompt: string;
  image_count: number;
  images: CarouselImage[];
  created_at: string;
}

export function useCarousel() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<CarouselHistoryItem[]>([]);

  const generateCarousel = async (prompt: string, imageCount: number): Promise<CarouselHistoryItem | null> => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Você precisa estar autenticado');
        return null;
      }

      if (!prompt.trim()) {
        toast.error('Por favor, descreva o que deseja no carrossel');
        return null;
      }

      if (imageCount < 2 || imageCount > 10) {
        toast.error('O carrossel deve ter entre 2 e 10 imagens');
        return null;
      }

      toast.info(`Gerando ${imageCount} imagens para seu carrossel...`);

      const { data, error } = await supabase.functions.invoke('generate-carousel', {
        body: { prompt, imageCount }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao gerar carrossel');
      }

      toast.success('Carrossel gerado com sucesso! 🎨');
      await loadHistory();
      
      return data.carousel;
    } catch (error: any) {
      console.error('Error generating carousel:', error);
      
      if (error.message?.includes('429')) {
        toast.error('Limite de requisições atingido. Tente novamente em alguns instantes.');
      } else if (error.message?.includes('402')) {
        toast.error('Créditos insuficientes. Por favor, adicione créditos.');
      } else {
        toast.error('Erro ao gerar carrossel: ' + (error.message || 'Erro desconhecido'));
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('carousel_history' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setHistory((data as any) || []);
    } catch (error: any) {
      console.error('Error loading carousel history:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const deleteCarousel = async (id: string) => {
    try {
      const { error } = await supabase
        .from('carousel_history' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHistory(prev => prev.filter(item => item.id !== id));
      toast.success('Carrossel excluído');
    } catch (error: any) {
      console.error('Error deleting carousel:', error);
      toast.error('Erro ao excluir carrossel');
    }
  };

  return {
    generateCarousel,
    loadHistory,
    deleteCarousel,
    loading,
    history,
  };
}
