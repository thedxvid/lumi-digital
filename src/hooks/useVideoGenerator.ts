import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActivity } from '@/hooks/useActivity';
import { toast } from 'sonner';
import type { VideoHistoryItem, VideoConfig } from '@/types/video';
import { getVideoGenerationEstimate, type TimeEstimate } from '@/utils/videoTimeEstimator';

type GenerationStatus = 'idle' | 'generating' | 'ready' | 'error';
export type ErrorType = 'limit' | 'balance' | 'policy' | 'network' | 'unknown';

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
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
    // Reset error states
    setErrorType(null);
    setErrorMessage(null);
    
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

      // FIRST: Check if user has valid BYOK key - skip credit check if so
      const { data: userKey } = await supabase
        .from('user_api_keys')
        .select('is_valid, is_active')
        .eq('user_id', user.id)
        .eq('provider', 'fal_ai')
        .eq('is_active', true)
        .single();

      const hasByokValid = userKey?.is_valid === true;
      
      if (hasByokValid) {
        console.log('✅ [VideoGen] User has valid BYOK key - skipping credit check');
      } else {
        // Only check credits if no BYOK
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
          const isKling = config.api_provider?.includes('kling');
          
          const klingAvailable = (userLimits.kling_image_videos_lifetime_limit || 0) - (userLimits.kling_image_videos_lifetime_used || 0);
          const extraCredits = (userLimits.video_credits || 0) - (userLimits.video_credits_used || 0);
          
          console.log('📊 [VideoGen] Credits status:', {
            api_provider: config.api_provider,
            isKling,
            klingAvailable,
            extraCredits,
            total_available: klingAvailable + extraCredits
          });
          
          // Verificar créditos disponíveis
          if (isKling && klingAvailable === 0 && extraCredits === 0) {
            console.warn('⚠️ [VideoGen] No Kling credits available');
            setErrorType('limit');
            setErrorMessage('Você não tem mais créditos Kling disponíveis. Conecte sua chave Fal.ai para uso ilimitado.');
            setGenerationStatus('error');
            setLoading(false);
            window.dispatchEvent(new CustomEvent('video-limit-reached', {
              detail: { videoType: 'kling', remainingCredits: extraCredits }
            }));
            return null;
          }
          
          console.log('✅ [VideoGen] Credits check passed - proceeding with generation');
        }
      }
    } catch (checkError) {
      console.error('❌ [VideoGen] Error checking limits:', checkError);
      setErrorType('network');
      setErrorMessage('Erro ao verificar limites de vídeo. Verifique sua conexão.');
      setGenerationStatus('error');
      setLoading(false);
      toast.error('Erro ao verificar limites de vídeo');
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
        // Check if it's a network error
        if (functionError.message?.includes('fetch') || functionError.message?.includes('network')) {
          setErrorType('network');
          setErrorMessage('Erro de conexão. Verifique sua internet e tente novamente.');
        } else {
          setErrorType('unknown');
          setErrorMessage(functionError.message || 'Erro desconhecido ao gerar vídeo.');
        }
        setGenerationStatus('error');
        throw new Error(functionError.message);
      }

      if (functionData?.error) {
        // Verificar se é erro de saldo esgotado (BYOK ou plataforma)
        if (functionData.errorType === 'balance_exhausted' || 
            functionData.error.includes('Saldo esgotado') ||
            functionData.error.includes('exhausted')) {
          console.log('💰 BALANCE EXHAUSTED DETECTED');
          
          setErrorType('balance');
          setErrorMessage(functionData.isUserKey 
            ? 'O saldo da sua conta Fal.ai acabou. Adicione mais créditos para continuar.'
            : 'Os créditos da plataforma estão temporariamente esgotados.');
          setGenerationStatus('error');
          
          window.dispatchEvent(new CustomEvent('video-balance-exhausted', {
            detail: {
              isUserKey: functionData.isUserKey || false,
              message: functionData.error
            }
          }));
          
          toast.error(functionData.isUserKey ? 'Saldo Fal.ai esgotado' : 'Créditos temporariamente indisponíveis', {
            description: functionData.isUserKey 
              ? 'Adicione créditos em fal.ai/billing'
              : 'Conecte sua própria chave ou tente mais tarde',
            duration: 8000
          });
          
          setLoading(false);
          return null;
        }
        
        // Verificar se é erro de violação de política de conteúdo
        if (functionData.error.includes('filtros de segurança') || 
            functionData.error.includes('conteúdo do prompt foi bloqueado')) {
          console.log('🚫 CONTENT POLICY VIOLATION DETECTED 🚫');
          console.log('Error details:', functionData.error);
          console.log('Prompt:', config.prompt?.substring(0, 100) + '...');
          console.log('API Provider:', config.api_provider);
          
          setErrorType('policy');
          setErrorMessage('O prompt foi bloqueado pelos filtros de segurança. Reformule usando termos mais genéricos.');
          setGenerationStatus('error');
          
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
          setLoading(false);
          return null;
        }
        
        setErrorType('unknown');
        setErrorMessage(functionData.error);
        setGenerationStatus('error');
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
      
      // Only set error state if not already set
      if (!errorType) {
        setErrorType('unknown');
        setErrorMessage(error instanceof Error ? error.message : 'Erro ao gerar vídeo');
      }
      setGenerationStatus('error');
      
      const errMsg = error instanceof Error ? error.message : 'Erro ao gerar vídeo';
      toast.error(errMsg);
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
    errorType,
    errorMessage,
    generateVideo,
    loadHistory,
    deleteHistoryItem,
    toggleFavorite,
    cancelGeneration,
  };
};
