import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActivity } from '@/hooks/useActivity';
import { toast } from 'sonner';
import type { VideoHistoryItem, VideoConfig } from '@/types/video';
import { getVideoGenerationEstimate, type TimeEstimate } from '@/utils/videoTimeEstimator';

type GenerationStatus = 'idle' | 'generating' | 'ready' | 'error';

export const useVideoGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<VideoHistoryItem[]>([]);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [currentConfig, setCurrentConfig] = useState<VideoConfig | null>(null);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle');
  const [timeEstimate, setTimeEstimate] = useState<TimeEstimate | null>(null);
  const [preloadedVideo, setPreloadedVideo] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const videoPreloadRef = useRef<HTMLVideoElement | null>(null);
  const { logActivity } = useActivity();

  useEffect(() => {
    loadHistory();
  }, []);

  const preloadVideo = (url: string) => {
    return new Promise<void>((resolve) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.src = url;
      
      const handleCanPlay = () => {
        console.log('✅ Video preloaded successfully');
        setPreloadedVideo(url);
        videoPreloadRef.current = video;
        resolve();
      };

      const handleError = () => {
        console.warn('⚠️ Video preload failed, but continuing...');
        resolve(); // Continue anyway
      };

      video.addEventListener('canplaythrough', handleCanPlay, { once: true });
      video.addEventListener('error', handleError, { once: true });
      
      video.load();
    });
  };

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setGenerationStatus('idle');
    setLoading(false);
    setResultModalOpen(false);
    toast.info('Geração cancelada');
  };

  const generateVideo = async (config: VideoConfig): Promise<string | null> => {
    // Abrir modal IMEDIATAMENTE com estado de geração
    setCurrentConfig(config);
    setGenerationStatus('generating');
    setPreloadedVideo(null);
    
    // Calcular estimativa de tempo
    const estimate = getVideoGenerationEstimate(
      config.api_provider || 'fal_kling_v25_turbo',
      config.duration
    );
    setTimeEstimate(estimate);
    
    // Abrir modal antes de começar
    setResultModalOpen(true);
    setLoading(true);

    // Criar AbortController para cancelamento
    abortControllerRef.current = new AbortController();

    // Verificar limites específicos ANTES de gerar
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('🔍 [VideoGen] Checking video credits for user:', user.id);

      const { data: userLimits, error: limitsError } = await supabase
        .from('usage_limits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (limitsError) {
        console.error('❌ [VideoGen] Error fetching limits:', limitsError);
        throw limitsError;
      }

      if (userLimits) {
        const isSora = config.api_provider?.includes('sora');
        const isKling = config.api_provider?.includes('kling');
        
        const soraAvailable = (userLimits.sora_text_videos_lifetime_limit || 0) - (userLimits.sora_text_videos_lifetime_used || 0);
        const klingAvailable = (userLimits.kling_image_videos_lifetime_limit || 0) - (userLimits.kling_image_videos_lifetime_used || 0);
        const extraCredits = (userLimits.video_credits || 0) - (userLimits.video_credits_used || 0);
        
        console.log('📊 [VideoGen] Credits status:', {
          api_provider: config.api_provider,
          isSora,
          isKling,
          soraAvailable,
          klingAvailable,
          extraCredits,
          total_available: soraAvailable + klingAvailable + extraCredits
        });
        
        // APENAS verificar créditos disponíveis - SEM verificação de plano PRO
        if (isSora && soraAvailable === 0 && extraCredits === 0) {
          console.warn('⚠️ [VideoGen] No Sora credits available');
          window.dispatchEvent(new CustomEvent('video-limit-reached', {
            detail: { videoType: 'sora', remainingCredits: extraCredits }
          }));
          setLoading(false);
          setGenerationStatus('idle');
          setResultModalOpen(false);
          return null;
        }
        
        if (isKling && klingAvailable === 0 && extraCredits === 0) {
          console.warn('⚠️ [VideoGen] No Kling credits available');
          window.dispatchEvent(new CustomEvent('video-limit-reached', {
            detail: { videoType: 'kling', remainingCredits: extraCredits }
          }));
          setLoading(false);
          setGenerationStatus('idle');
          setResultModalOpen(false);
          return null;
        }
        
        console.log('✅ [VideoGen] Credits check passed - proceeding with generation');
      }
    } catch (checkError) {
      console.error('❌ [VideoGen] Error checking limits:', checkError);
      toast.error('Erro ao verificar limites de vídeo');
      setLoading(false);
      setGenerationStatus('idle');
      setResultModalOpen(false);
      return null;
    }

    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-video', {
        body: config
      });

      // Verificar se foi cancelado
      if (abortControllerRef.current?.signal.aborted) {
        return null;
      }

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
      const thumbnailUrlFromApi = functionData?.video?.thumbnail_url;
      
      if (!videoUrl) {
        throw new Error('URL do vídeo não retornada pela API');
      }

      console.log('🎬 Video URL received, starting preload:', videoUrl);

      // Mudar status para ready IMEDIATAMENTE
      setGeneratedVideoUrl(videoUrl);
      setThumbnailUrl(thumbnailUrlFromApi || null);
      setGenerationStatus('ready');

      // Pré-carregar vídeo em background (não bloqueante)
      preloadVideo(videoUrl).catch(err => {
        console.warn('⚠️ Video preload failed:', err);
      });

      // Verificar se foi cancelado
      if (abortControllerRef.current?.signal.aborted) {
        return null;
      }

      // Save to history
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('Saving to history with config:', {
        api_provider: config.api_provider,
        api_used_value: config.api_provider || 'fal_kling_v25_turbo'
      });
      
      if (user) {
        const { data: newVideo, error: insertError } = await supabase
          .from('video_history')
          .insert({
            user_id: user.id,
            prompt: config.prompt,
            video_url: videoUrl,
            thumbnail_url: thumbnailUrlFromApi,
            aspect_ratio: config.aspect_ratio,
            duration: config.duration,
            resolution: config.resolution,
            has_audio: config.generate_audio,
            api_used: config.api_provider || 'fal_kling_v25_turbo',
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error saving to history:', insertError);
          toast.error('Erro ao salvar no histórico: ' + insertError.message);
        } else if (newVideo) {
          console.log('Successfully saved to history:', newVideo);
          
          // Add new video to the beginning of history (incremental loading)
          setHistory(prev => {
            console.log('Updating history. Previous length:', prev.length);
            const updated = [newVideo, ...prev];
            console.log('New history length:', updated.length);
            return updated;
          });
          
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
          
          // Log activity
          await logActivity('result');
          
          // Trigger a custom event to refresh usage limits across components
          window.dispatchEvent(new CustomEvent('usage-limits-updated'));
        }
      }

      toast.success('Vídeo gerado com sucesso!');
      
      return videoUrl;
    } catch (error) {
      console.error('Error generating video:', error);
      
      // Não mostrar erro se foi cancelado
      if (abortControllerRef.current?.signal.aborted) {
        return null;
      }
      
      setGenerationStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar vídeo';
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const loadHistory = async (page = 0, limit = 15) => {
    try {
      console.log('🔄 Loading history, page:', page, 'limit:', limit);
      const { data, error } = await supabase
        .from('video_history')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) {
        console.error('❌ Error loading history:', error);
        toast.error('Erro ao carregar histórico');
        return;
      }

      console.log('✅ History loaded:', data?.length || 0, 'videos');
      setHistory(prev => {
        const updated = page === 0 ? (data || []) : [...prev, ...(data || [])];
        console.log('📊 History state updated. Total videos:', updated.length);
        return updated;
      });
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
    thumbnailUrl,
    currentConfig,
    generationStatus,
    timeEstimate,
    preloadedVideo,
    generateVideo,
    loadHistory,
    deleteHistoryItem,
    toggleFavorite,
    cancelGeneration,
  };
};
