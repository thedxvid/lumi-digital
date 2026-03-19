import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActivity } from '@/hooks/useActivity';
import { toast } from 'sonner';
import { classifyError } from '@/utils/errorClassifier';

export type CreativeErrorType = 'limit' | 'policy' | 'network' | 'unknown' | null;

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
  customPrompt?: string;
  mainText?: string;
  secondaryText?: string;
  callToAction?: string;
}

export function useCreativeEngine() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<CreativeHistoryItem[]>([]);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [suggestedCopy, setSuggestedCopy] = useState<any>(null);
  const [errorType, setErrorType] = useState<CreativeErrorType>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { session } = useAuth();
  const { logActivity } = useActivity();

  const generateCreative = async (images: string[], prompt: string, config?: CreativeConfig): Promise<string | null> => {
    // Reset error state
    setErrorType(null);
    setErrorMessage(null);
    
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
        const classified = classifyError(error, 'gerar criativo');
        setErrorType(classified.errorType);
        setErrorMessage(classified.errorMessage);
        throw error;
      }

      if (data?.error) {
        console.error('Error from creative-engine:', data.error);
        const classified = classifyError({ message: data.error }, 'gerar criativo');
        setErrorType(classified.errorType);
        setErrorMessage(classified.errorMessage);
        toast.error(classified.errorMessage);
        return null;
      }

      // The new response structure returns baseImage + suggestedCopy
      if (!data?.baseImage) {
        throw new Error('Nenhuma imagem foi gerada');
      }

      // Resize image to exact dimensions if config provided
      let finalImage = data.baseImage;
      if (config?.format) {
        const { resizeImage, getFormatDimensions } = await import('@/utils/imageResizer');
        const dimensions = getFormatDimensions(config.format);
        
        try {
          console.log(`Resizing image to ${dimensions.width}x${dimensions.height}...`);
          finalImage = await resizeImage(data.baseImage, dimensions.width, dimensions.height);
          console.log('Image resized successfully');
        } catch (resizeError) {
          console.error('Error resizing image, using original:', resizeError);
          // Continue with original image if resize fails
        }
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
          generated_image: finalImage,
          creative_type: config?.creativeType,
          format: config?.format,
          config: config || {}
        });

      if (insertError) {
        console.error('Error saving to history:', insertError);
        toast.warning('Criativo gerado, mas houve um erro ao salvar no histórico.');
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

        // Log activity
        await logActivity('result');

        if (limitError) {
          console.error('Error incrementing usage:', limitError);
        }
      }

      toast.success('Criativo base gerado com sucesso! 🎨');
      
      // Set result for modal (resized base image)
      setGeneratedImageUrl(finalImage);
      setResultModalOpen(true);
      
      // Refresh history
      await loadHistory();
      
      // Trigger a custom event to refresh usage limits across components
      window.dispatchEvent(new CustomEvent('usage-limits-updated'));

      return finalImage;

    } catch (error) {
      console.error('Error generating creative:', error);
      // Only set generic error if not already set
      if (!errorType) {
        setErrorType('unknown');
        setErrorMessage('Erro ao gerar criativo. Tente novamente.');
      }
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
      // Import the canvas composer utility
      const { composeTextOnImage } = await import('@/utils/canvasTextComposer');
      
      // Compose text on image using frontend Canvas API (zero cost!)
      const composedImage = await composeTextOnImage(baseImage, textConfig);

      // Save the final version to history
      const { error: insertError } = await supabase
        .from('creative_history')
        .insert({
          user_id: session.user.id,
          original_images: [],
          prompt: 'Criativo com texto aplicado',
          generated_image: composedImage,
          main_text: textConfig.headline,
          secondary_text: textConfig.secondary,
          call_to_action: textConfig.cta
        });

      if (insertError) {
        console.error('Error saving to history:', insertError);
      }

      toast.success('Texto aplicado com sucesso! 🎉');
      
      // Update the displayed image
      setGeneratedImageUrl(composedImage);
      
      // Refresh history
      await loadHistory();

      return composedImage;

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
    errorType,
    errorMessage,
    generateCreative,
    applyTextToCreative,
    loadHistory,
    deleteHistoryItem,
    toggleFavorite,
    resultModalOpen,
    setResultModalOpen,
    generatedImageUrl,
    suggestedCopy,
    clearError: () => {
      setErrorType(null);
      setErrorMessage(null);
    }
  };
}