import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wand2, Lock } from 'lucide-react';
import type { VideoConfig, VideoAPIConfig, VideoMode } from '@/types/video';
import { VideoModeSelector } from './VideoModeSelector';
import { VideoImageUploader } from './VideoImageUploader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useApiKeyIntegrations } from '@/hooks/useApiKeyIntegrations';
import { useNavigate } from 'react-router-dom';

const VIDEO_APIS: VideoAPIConfig[] = [
  // ===== KLING v2.6 PRO (Disponível para todos) =====
  {
    id: 'fal_kling_v26_pro',
    name: 'fal_kling_v26_pro',
    display_name: 'Kling v2.6 Pro (Text-to-Video)',
    cost_per_8s: 0.60,
    description: '🔊 Movimento ultra-realista COM ÁUDIO integrado',
    provider: 'Kling AI',
    mode: 'text-to-video',
    requires_user_key: false
  },
  {
    id: 'fal_kling_v26_image_to_video',
    name: 'fal_kling_v26_image_to_video',
    display_name: 'Kling v2.6 Pro (Image-to-Video)',
    cost_per_8s: 0.60,
    description: '🔊 Gera vídeo realista a partir de 1 imagem COM ÁUDIO',
    provider: 'Kling AI',
    mode: 'image-to-video',
    requires_images: 1,
    endpoint: 'https://fal.run/fal-ai/kling-video/v2.6/pro/image-to-video',
    requires_user_key: false
  },
  
  // ===== VEO 3.1 (Apenas BYOK) - Melhor qualidade + Áudio =====
  {
    id: 'fal_veo31',
    name: 'fal_veo31',
    display_name: 'Veo 3.1 (Text-to-Video)',
    cost_per_8s: 0.60,
    description: '🔊 Google Veo 3.1: melhor qualidade, realismo e COM ÁUDIO',
    provider: 'Google Veo',
    mode: 'text-to-video',
    requires_user_key: true
  },
  {
    id: 'fal_veo31_image_to_video',
    name: 'fal_veo31_image_to_video',
    display_name: 'Veo 3.1 (Image-to-Video)',
    cost_per_8s: 0.60,
    description: '🔊 Transforma imagens em vídeo com Veo 3.1 COM ÁUDIO',
    provider: 'Google Veo',
    mode: 'image-to-video',
    requires_images: 1,
    endpoint: 'https://fal.run/fal-ai/veo3.1/image-to-video',
    requires_user_key: true
  }
];

interface VideoConfigFormProps {
  onGenerate: (config: VideoConfig) => void;
  loading: boolean;
  preloadedImage?: string | null;
  initialMode?: VideoMode;
}

export const VideoConfigForm = ({ 
  onGenerate, 
  loading, 
  preloadedImage = null,
  initialMode = 'text-to-video'
}: VideoConfigFormProps) => {
  const navigate = useNavigate();
  const { keys, loading: loadingKeys } = useApiKeyIntegrations();
  const [mode, setMode] = useState<VideoMode>(initialMode);
  const [prompt, setPrompt] = useState('');
  const [inputImages, setInputImages] = useState<string[]>(preloadedImage ? [preloadedImage] : []);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('16:9');
  const [duration, setDuration] = useState<'4s' | '6s' | '8s'>('8s');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [generateAudio, setGenerateAudio] = useState(true);
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [enhancingPrompt, setEnhancingPrompt] = useState(false);
  const [apiProvider, setApiProvider] = useState<string>(
    initialMode === 'image-to-video' ? 'fal_kling_v26_image_to_video' : 'fal_kling_v26_pro'
  );

  // Verificar se usuário tem API key válida do fal.ai
  const hasFalApiKey = keys.some(k => 
    k.provider === 'fal_ai' && 
    k.is_active && 
    k.is_valid
  );

  // Update state when preloadedImage changes
  useEffect(() => {
    console.log('📸 VideoConfigForm - Preloaded image:', preloadedImage?.substring(0, 50));
    if (preloadedImage) {
      console.log('✅ Setting input images with preloaded image');
      setInputImages([preloadedImage]);
      setMode('image-to-video');
      setApiProvider('fal_kling_v26_image_to_video');
    }
  }, [preloadedImage]);

  // Reset para modelo padrão se tentar usar Veo 3 sem BYOK
  useEffect(() => {
    const selectedAPI = VIDEO_APIS.find(api => api.id === apiProvider);
    if (selectedAPI?.requires_user_key && !hasFalApiKey) {
      console.log('🚫 Resetando para modelo padrão - Veo 3 requer BYOK');
      if (mode === 'image-to-video') {
        setApiProvider('fal_kling_v26_image_to_video');
      } else {
        setApiProvider('fal_kling_v26_pro');
      }
      toast.info('Veo 3 requer conexão com sua API Fal.ai', {
        description: 'Conecte sua API nas Configurações para usar este modelo'
      });
    }
  }, [hasFalApiKey, apiProvider, mode]);

  // Sincronizar apiProvider quando mode muda - garante que sempre há um modelo selecionado
  useEffect(() => {
    const validForMode = VIDEO_APIS.filter(api => 
      api.mode === mode && (!api.requires_user_key || hasFalApiKey)
    );
    const currentIsValid = validForMode.some(api => api.id === apiProvider);
    
    if (!currentIsValid && validForMode.length > 0) {
      // Seleciona o primeiro modelo disponível para o modo
      const defaultApi = mode === 'image-to-video' 
        ? 'fal_kling_v26_image_to_video' 
        : 'fal_kling_v26_pro';
      console.log('🔄 Sincronizando modelo de IA:', defaultApi);
      setApiProvider(defaultApi);
    }
  }, [mode, apiProvider, hasFalApiKey]);

  // Filter APIs based on mode - show all APIs but mark locked ones
  const availableAPIs = VIDEO_APIS.filter(api => api.mode === mode);

  // Update API provider when mode changes
  const handleModeChange = (newMode: VideoMode) => {
    console.log('🔄 Mode changed to:', newMode);
    setMode(newMode);
    // Only clear images if switching away from image-to-video and no preloaded image
    if (newMode !== 'image-to-video' || !preloadedImage) {
      setInputImages([]);
    }
    // Always set the correct API for the mode - now we only have one API per mode
    if (newMode === 'image-to-video') {
      setApiProvider('fal_kling_v26_image_to_video');
    } else {
      setApiProvider('fal_kling_v26_pro');
    }
  };

  // Get selected API config
  const selectedAPI = VIDEO_APIS.find(api => api.id === apiProvider);
  const maxImages = selectedAPI?.requires_images || 1;

  const handleEnhancePrompt = async () => {
    if (!prompt || prompt.trim().length < 5) {
      toast.error('Digite um prompt primeiro para melhorá-lo');
      return;
    }

    setEnhancingPrompt(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-safe-prompt', {
        body: { prompt: prompt.trim(), mode: 'enhance' }
      });

      if (error) {
        console.error('Error enhancing prompt:', error);
        toast.error('Erro ao melhorar prompt');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.suggested) {
        setPrompt(data.suggested);
        toast.success('Prompt melhorado! Traduzido para inglês e otimizado com técnicas cinematográficas.', { duration: 5000 });
      }
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      toast.error('Erro ao processar solicitação');
    } finally {
      setEnhancingPrompt(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🎬 [VideoForm] Form submitted with config:', {
      mode,
      api_provider: apiProvider,
      prompt_length: prompt.trim().length,
      images_count: inputImages.length,
      aspect_ratio: aspectRatio,
      duration,
      resolution,
      generate_audio: generateAudio,
      enhance_prompt: enhancePrompt
    });
    
    // Validations
    if (!apiProvider) {
      toast.error('Selecione um modelo de IA');
      return;
    }

    if (mode === 'text-to-video' && prompt.trim().length < 10) {
      console.warn('⚠️ [VideoForm] Prompt too short:', prompt.trim().length);
      toast.error('Prompt muito curto. Mínimo 10 caracteres.');
      return;
    }

    if (mode === 'image-to-video') {
      if (inputImages.length === 0) {
        console.warn('⚠️ [VideoForm] No images provided for image-to-video');
        toast.error('Adicione pelo menos uma imagem para gerar o vídeo.');
        return;
      }
      if (selectedAPI?.requires_images && inputImages.length !== selectedAPI.requires_images) {
        console.warn('⚠️ [VideoForm] Wrong number of images:', {
          provided: inputImages.length,
          required: selectedAPI.requires_images
        });
        toast.error(`Este modelo requer exatamente ${selectedAPI.requires_images} imagem(ns).`);
        return;
      }
    }

    console.log('✅ [VideoForm] Validation passed - calling onGenerate');

    onGenerate({
      mode,
      prompt: prompt.trim(),
      input_images: mode === 'image-to-video' ? inputImages : undefined,
      aspect_ratio: aspectRatio,
      duration,
      resolution,
      generate_audio: generateAudio,
      enhance_prompt: enhancePrompt,
      api_provider: apiProvider,
    });
  };

  const isValid = mode === 'text-to-video' 
    ? prompt.trim().length >= 10
    : inputImages.length > 0 && (!selectedAPI?.requires_images || inputImages.length === selectedAPI.requires_images);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          {/* Mode Selector */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Modo de Geração
            </Label>
            <VideoModeSelector 
              mode={mode} 
              onModeChange={handleModeChange}
              disabled={loading}
            />
          </div>

          {/* Image Uploader for Image-to-Video mode */}
          {mode === 'image-to-video' && (
            <VideoImageUploader
              maxImages={maxImages}
              onImagesChange={setInputImages}
              disabled={loading}
              initialImages={inputImages}
            />
          )}

          {/* Prompt */}
          <div>
            <Label htmlFor="prompt" className="text-base font-semibold">
              {mode === 'text-to-video' ? 'Descreva o vídeo que deseja gerar' : 'Descrição do Movimento (Opcional)'}
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              {mode === 'text-to-video' 
                ? 'Seja detalhado e específico para melhores resultados (mínimo 10 caracteres)'
                : 'Adicione detalhes sobre o movimento e a cena desejada'}
            </p>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={mode === 'text-to-video' 
                ? "Ex: Uma entrevista de rua em Nova York. Diálogo de exemplo:\nApresentador: 'Você ouviu a notícia?'\nPessoa: 'Sim! O Sora 2 está disponível. Incrível!'"
                : "Ex: Zoom lento na imagem, movimento suave da câmera da esquerda para direita"}
              className="min-h-[120px] resize-none"
              disabled={loading}
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
              {mode === 'text-to-video' && (
                <p className="text-xs text-muted-foreground">
                  {prompt.length} caracteres {prompt.length < 10 && `(faltam ${10 - prompt.length})`}
                </p>
              )}
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleEnhancePrompt}
                disabled={loading || enhancingPrompt || prompt.trim().length < 5}
                data-enhance-prompt
                className="sm:ml-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {enhancingPrompt ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Melhorando...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Melhorar Prompt
                  </>
                )}
              </Button>
            </div>
          </div>


          {/* API Provider */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              Modelo de IA
              {!apiProvider && (
                <span className="text-sm font-normal text-amber-500 dark:text-amber-400">
                  (selecione o modelo!)
                </span>
              )}
            </Label>
            <Select 
              value={apiProvider} 
              onValueChange={(value) => {
                const selectedApi = VIDEO_APIS.find(api => api.id === value);
                // Bloquear seleção de Veo 3.1 se não tiver BYOK
                if (selectedApi?.requires_user_key && !hasFalApiKey) {
                  toast.info('Veo 3.1 requer créditos extras', {
                    description: 'Adquira créditos para desbloquear este modelo premium'
                  });
                  return;
                }
                setApiProvider(value);
              }} 
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um modelo de IA" />
              </SelectTrigger>
              <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                {availableAPIs.map((api) => {
                  const isLocked = api.requires_user_key && !hasFalApiKey;
                  
                  return (
                    <SelectItem 
                      key={api.id} 
                      value={api.id} 
                      className={`py-3 ${isLocked ? 'opacity-70' : ''}`}
                    >
                      <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                        <div className="font-medium text-sm leading-tight flex items-center gap-2 flex-wrap">
                          <span className="break-words">{api.display_name}</span>
                          {isLocked && (
                            <Lock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground leading-tight break-words whitespace-normal">
                          {api.description}
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Link para desbloquear Veo 3.1 */}
            {!hasFalApiKey && (
              <div className="flex items-center gap-2 text-sm">
                <Lock className="h-4 w-4 text-amber-500" />
                <span className="text-muted-foreground">
                  Quer usar o <strong>Veo 3.1 com áudio</strong>?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/app/settings')}
                    className="text-primary hover:underline font-medium"
                  >
                    Conecte sua chave Fal.ai nas Configurações
                  </button>
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Proporção</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['9:16', '16:9', '1:1'] as const).map((ratio) => (
                <Button
                  key={ratio}
                  type="button"
                  variant={aspectRatio === ratio ? 'default' : 'outline'}
                  onClick={() => setAspectRatio(ratio)}
                  disabled={loading}
                  className="h-auto py-3"
                >
                  <div className="text-center">
                    <div className="font-semibold">{ratio}</div>
                    <div className="text-xs opacity-70">
                      {ratio === '9:16' ? 'Stories' : ratio === '16:9' ? 'Landscape' : 'Quadrado'}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Duração</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['4s', '6s', '8s'] as const).map((dur) => (
                <Button
                  key={dur}
                  type="button"
                  variant={duration === dur ? 'default' : 'outline'}
                  onClick={() => setDuration(dur)}
                  disabled={loading}
                >
                  {dur}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Resolução</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['720p', '1080p'] as const).map((res) => (
                <Button
                  key={res}
                  type="button"
                  variant={resolution === res ? 'default' : 'outline'}
                  onClick={() => setResolution(res)}
                  disabled={loading}
                >
                  {res}
                  <span className="ml-2 text-xs opacity-70">
                    {res === '720p' ? 'HD' : 'Full HD'}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="audio">Gerar Áudio</Label>
              <p className="text-xs text-muted-foreground">
                Adiciona áudio ao vídeo gerado
              </p>
            </div>
            <Switch
              id="audio"
              checked={generateAudio}
              onCheckedChange={setGenerateAudio}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="enhance">Melhorar Prompt</Label>
              <p className="text-xs text-muted-foreground">
                A IA otimiza seu prompt automaticamente
              </p>
            </div>
            <Switch
              id="enhance"
              checked={enhancePrompt}
              onCheckedChange={setEnhancePrompt}
              disabled={loading}
            />
          </div>
        </div>
      </Card>

      <Button
        type="submit"
        disabled={!isValid || loading}
        className="w-full h-12 text-base"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Gerando vídeo...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-5 w-5" />
            Gerar Vídeo
          </>
        )}
      </Button>

      {!isValid && (
        <p className="text-sm text-destructive text-center">
          {mode === 'text-to-video' 
            ? 'O prompt precisa ter pelo menos 10 caracteres'
            : inputImages.length === 0 
              ? 'Faça upload de pelo menos 1 imagem'
              : `Este modelo requer exatamente ${selectedAPI?.requires_images} ${selectedAPI?.requires_images === 1 ? 'imagem' : 'imagens'}`}
        </p>
      )}
    </form>
  );
};
