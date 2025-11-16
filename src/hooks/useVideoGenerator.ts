import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { VideoHistoryItem, VideoConfig } from '@/types/video';

export const useVideoGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<VideoHistoryItem[]>([]);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [currentConfig, setCurrentConfig] = useState<VideoConfig | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const generateVideo = async (config: VideoConfig): Promise<string | null> => {
    setLoading(true);
    setCurrentConfig(config);

    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-video', {
        body: config
      });

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(functionError.message);
      }

      if (functionData?.error) {
        // Verificar se é erro de violação de política de conteúdo
        if (functionData.error.includes('filtros de segurança') || 
            functionData.error.includes('conteúdo do prompt foi bloqueado')) {
          console.log('🚫 CONTENT POLICY VIOLATION DETECTED 🚫');
          console.log('Error details:', functionData.error);
          console.log('Prompt:', config.prompt?.substring(0, 100) + '...');
          console.log('API Provider:', config.api_provider);
          
          // Disparar evento customizado para o componente capturar
          window.dispatchEvent(new CustomEvent('video-policy-violation', {
            detail: {
              error: functionData.error,
              prompt: config.prompt,
              apiProvider: config.api_provider
            }
          }));
          
          toast.error('Prompt bloqueado pelos filtros de segurança', {
            description: 'Use "Prompt Seguro" ou "Melhorar Prompt" para reformular',
            duration: 8000
          });
          return null;
        }
        throw new Error(functionData.error);
      }

      const videoUrl = functionData?.video?.url;
      
      if (!videoUrl) {
        throw new Error('URL do vídeo não retornada pela API');
      }

      // Save to history
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('Saving to history with config:', {
        api_provider: config.api_provider,
        api_used_value: config.api_provider || 'fal_veo3_fast'
      });
      
      if (user) {
        const { error: insertError } = await supabase
          .from('video_history')
          .insert({
            user_id: user.id,
            prompt: config.prompt,
            video_url: videoUrl,
            aspect_ratio: config.aspect_ratio,
            duration: config.duration,
            resolution: config.resolution,
            has_audio: config.generate_audio,
            api_used: config.api_provider || 'fal_kling_v25_turbo',
          });

        if (insertError) {
          console.error('Error saving to history:', insertError);
        } else {
          console.log('Successfully saved to history');
          
          // Increment video usage counter
          const { error: limitError } = await supabase.functions.invoke('check-limits', {
            body: {
              feature: 'videos',
              increment: true
            }
          });

          if (limitError) {
            console.error('Error incrementing usage:', limitError);
          }
          
          await loadHistory();
          
          // Trigger a custom event to refresh usage limits across components
          window.dispatchEvent(new CustomEvent('usage-limits-updated'));
        }
      }

      setGeneratedVideoUrl(videoUrl);
      setResultModalOpen(true);
      toast.success('Vídeo gerado com sucesso!');
      
      return videoUrl;
    } catch (error) {
      console.error('Error generating video:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar vídeo';
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('video_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading history:', error);
        toast.error('Erro ao carregar histórico');
        return;
      }

      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('video_history')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success('Vídeo removido do histórico');
      await loadHistory();
    } catch (error) {
      console.error('Error deleting history item:', error);
      toast.error('Erro ao remover vídeo');
    }
  };

  const toggleFavorite = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('video_history')
        .update({ is_favorite: !currentValue })
        .eq('id', id);

      if (error) {
        throw error;
      }

      await loadHistory();
      toast.success(currentValue ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Erro ao atualizar favorito');
    }
  };

  return {
    loading,
    history,
    resultModalOpen,
    setResultModalOpen,
    generatedVideoUrl,
    currentConfig,
    generateVideo,
    loadHistory,
    deleteHistoryItem,
    toggleFavorite,
  };
};
