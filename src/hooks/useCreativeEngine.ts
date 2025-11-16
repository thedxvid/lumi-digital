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
  creative_type?: string;
  format?: string;
  objective?: string;
  market?: string;
  target_audience?: string;
  visual_style?: string;
  color_palette?: string;
  typography?: string;
  main_text?: string;
  secondary_text?: string;
  call_to_action?: string;
  tone?: string;
  config?: any;
  is_favorite?: boolean;
  tags?: string[];
}

export interface CreativeConfig {
  creativeType: string;
  format: string;
  objective: string;
  market?: string;
  targetAudience?: string;
  visualStyle: string;
  colorPalette?: string;
  typography: string;
  mainText: string;
  secondaryText: string;
  callToAction: string;
  tone: string;
}

export function useCreativeEngine() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<CreativeHistoryItem[]>([]);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [suggestedCopy, setSuggestedCopy] = useState<any>(null);
  const { session } = useAuth();

  const generateCreative = async (images: string[], prompt: string, config?: CreativeConfig): Promise<string | null> => {
    if (!session?.access_token) {
      toast.error('Você precisa estar logado para usar a Máquina de Criativos');
      return null;
    }

    if (!prompt.trim()) {
      toast.error('Descreva o que você deseja criar');
      return null;
    }

    setLoading(true);
    
    try {
      console.log('Sending to Creative Engine:', { 
        imageCount: images.length,
        promptLength: prompt.length,
        mode: images.length > 0 ? 'with-images' : 'prompt-only'
      });

      const { data, error } = await supabase.functions.invoke('creative-engine', {
        body: { 
          images,
          prompt,
          config
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

      // The new response structure returns baseImage + suggestedCopy
      if (!data?.baseImage) {
        throw new Error('Nenhuma imagem foi gerada');
      }

      // Store suggested copy for later use
      if (data.suggestedCopy) {
        setSuggestedCopy(data.suggestedCopy);
      }

      // Save to history (base image without text)
      const { error: insertError } = await supabase
        .from('creative_history')
        .insert({
          user_id: session.user.id,
          original_images: images,
          prompt,
          generated_image: data.baseImage,
          creative_type: config?.creativeType,
          format: config?.format,
          objective: config?.objective,
          market: config?.market,
          target_audience: config?.targetAudience,
          visual_style: config?.visualStyle,
          color_palette: config?.colorPalette,
          typography: config?.typography,
          main_text: config?.mainText,
          secondary_text: config?.secondaryText,
          call_to_action: config?.callToAction,
          tone: config?.tone,
          config: config || {}
        });

      if (insertError) {
        console.error('Error saving to history:', insertError);
        // Don't throw, still return the image
      } else {
        // Increment creative images usage counter
        const { error: limitError } = await supabase.functions.invoke('check-limits', {
          body: {
            feature: 'creative_images',
            increment: true
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (limitError) {
          console.error('Error incrementing usage:', limitError);
        }
      }

      toast.success('Criativo base gerado com sucesso! 🎨');
      
      // Set result for modal (base image)
      setGeneratedImageUrl(data.baseImage);
      setResultModalOpen(true);
      
      // Refresh history
      await loadHistory();
      
      // Trigger a custom event to refresh usage limits across components
      window.dispatchEvent(new CustomEvent('usage-limits-updated'));

      return data.baseImage;

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

  const toggleFavorite = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('creative_history')
        .update({ is_favorite: !currentValue })
        .eq('id', id);

      if (error) throw error;

      setHistory(prev => prev.map(item => 
        item.id === id ? { ...item, is_favorite: !currentValue } : item
      ));
      
      toast.success(!currentValue ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Erro ao atualizar favorito');
    }
  };

  const applyTextToCreative = async (baseImage: string, textConfig: any): Promise<string | null> => {
    if (!session?.access_token) {
      toast.error('Você precisa estar logado');
      return null;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('compose-creative', {
        body: { 
          baseImage,
          copy: {
            headline: textConfig.headline,
            secondary: textConfig.secondary,
            cta: textConfig.cta
          },
          config: {
            textPosition: textConfig.textPosition,
            textColor: textConfig.textColor,
            fontSize: textConfig.fontSize,
            shadowIntensity: textConfig.shadowIntensity
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error applying text:', error);
        throw error;
      }

      if (data?.error) {
        console.error('Error from compose-creative:', data.error);
        toast.error(data.error);
        return null;
      }

      if (!data?.image) {
        throw new Error('Falha ao compor criativo com texto');
      }

      // Save the final version to history
      const { error: insertError } = await supabase
        .from('creative_history')
        .insert({
          user_id: session.user.id,
          original_images: [],
          prompt: 'Criativo com texto aplicado',
          generated_image: data.image,
          main_text: textConfig.headline,
          secondary_text: textConfig.secondary,
          call_to_action: textConfig.cta
        });

      if (insertError) {
        console.error('Error saving to history:', insertError);
      }

      toast.success('Texto aplicado com sucesso! 🎉');
      
      // Update the displayed image
      setGeneratedImageUrl(data.image);
      
      // Refresh history
      await loadHistory();

      return data.image;

    } catch (error) {
      console.error('Error applying text to creative:', error);
      toast.error('Erro ao aplicar texto. Tente novamente.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    history,
    generateCreative,
    applyTextToCreative,
    loadHistory,
    deleteHistoryItem,
    toggleFavorite,
    resultModalOpen,
    setResultModalOpen,
    generatedImageUrl,
    suggestedCopy,
  };
}