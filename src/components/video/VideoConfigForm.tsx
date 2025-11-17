import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import type { VideoConfig, VideoAPIConfig, VideoMode } from '@/types/video';
import { VideoModeSelector } from './VideoModeSelector';
import { VideoImageUploader } from './VideoImageUploader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VIDEO_APIS: VideoAPIConfig[] = [
  // Text-to-Video APIs
  {
    id: 'fal_kling_v25_turbo',
    name: 'fal_kling_v25_turbo',
    display_name: 'Kling v2.5 Turbo Pro',
    cost_per_8s: 0.60,
    description: 'Movimento fluido e visual cinematográfico',
    provider: 'Kling AI',
    mode: 'text-to-video'
  },
  {
    id: 'fal_sora2_text_to_video',
    name: 'fal_sora2_text_to_video',
    display_name: 'Sora 2 by OpenAI (Text)',
    cost_per_8s: 4.00,
    description: 'Qualidade cinematográfica premium com áudio - Modelo da OpenAI',
    provider: 'OpenAI',
    mode: 'text-to-video',
    endpoint: 'https://fal.run/fal-ai/sora-2/text-to-video'
  },
  // Image-to-Video APIs
  {
    id: 'fal_kling_v25_image_to_video',
    name: 'fal_kling_v25_image_to_video',
    display_name: 'Kling v2.5 Turbo Pro (Imagem)',
    cost_per_8s: 0.60,
    description: 'Gera vídeo a partir de 1 imagem',
    provider: 'Kling AI',
    mode: 'image-to-video',
    requires_images: 1,
    endpoint: 'https://fal.run/fal-ai/kling-video/v2.5-turbo/pro/image-to-video'
  },
  {
    id: 'fal_sora2_image_to_video',
    name: 'fal_sora2_image_to_video',
    display_name: 'Sora 2 by OpenAI (Imagem)',
    cost_per_8s: 4.00,
    description: 'Qualidade cinematográfica premium com áudio - Modelo da OpenAI',
    provider: 'OpenAI',
    mode: 'image-to-video',
    requires_images: 1,
    endpoint: 'https://fal.run/fal-ai/sora-2/image-to-video'
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
  const [mode, setMode] = useState<VideoMode>(initialMode);
  const [prompt, setPrompt] = useState('');
  const [inputImages, setInputImages] = useState<string[]>(preloadedImage ? [preloadedImage] : []);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('16:9');
  const [duration, setDuration] = useState<'4s' | '6s' | '8s'>('8s');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [generateAudio, setGenerateAudio] = useState(true);
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [suggestingPrompt, setSuggestingPrompt] = useState(false);
  const [enhancingPrompt, setEnhancingPrompt] = useState(false);
  const [apiProvider, setApiProvider] = useState<string>(
    initialMode === 'image-to-video' ? 'fal_kling_v25_image_to_video' : 'fal_kling_v25_turbo'
  );

  // Update state when preloadedImage changes
  useEffect(() => {
    console.log('📸 VideoConfigForm - Preloaded image:', preloadedImage?.substring(0, 50));
    if (preloadedImage) {
      console.log('✅ Setting input images with preloaded image');
      setInputImages([preloadedImage]);
      setMode('image-to-video');
      setApiProvider('fal_kling_v25_image_to_video');
    }
  }, [preloadedImage]);

  // Filter APIs based on mode
  const availableAPIs = VIDEO_APIS.filter(api => api.mode === mode);

  // Update API provider when mode changes
  const handleModeChange = (newMode: VideoMode) => {
    console.log('🔄 Mode changed to:', newMode);
    setMode(newMode);
    // Only clear images if switching away from image-to-video and no preloaded image
    if (newMode !== 'image-to-video' || !preloadedImage) {
      setInputImages([]);
    }
    // Set default API for the mode
    const defaultAPI = VIDEO_APIS.find(api => api.mode === newMode);
    if (defaultAPI) {
      setApiProvider(defaultAPI.id);
    }
  };

  // Get selected API config
  const selectedAPI = VIDEO_APIS.find(api => api.id === apiProvider);
  const maxImages = selectedAPI?.requires_images || 1;

  const handleSuggestSafePrompt = async () => {
    if (!prompt || prompt.trim().length < 5) {
      toast.error('Digite um prompt primeiro para reformulá-lo');
      return;
    }

    setSuggestingPrompt(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-safe-prompt', {
        body: { prompt: prompt.trim(), mode: 'safe' }
      });

      if (error) {
        console.error('Error suggesting prompt:', error);
        toast.error('Erro ao sugerir prompt alternativo');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.suggested) {
        setPrompt(data.suggested);
        toast.success('Prompt reformulado! Marcas e conteúdo sensível foram removidos.');
      }
    } catch (error) {
      console.error('Error suggesting prompt:', error);
      toast.error('Erro ao processar solicitação');
    } finally {
      setSuggestingPrompt(false);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt || prompt.trim().length < 5) {
      toast.error('Digite um prompt primeiro para melhorá-lo');
      return;
    }

    // Detectar se Sora 2 está ativo para usar modo especial
    const isSora2 = apiProvider === 'fal_sora2_image_to_video' || apiProvider === 'fal_sora2_text_to_video';
    const enhanceMode = isSora2 ? 'enhance-sora' : 'enhance';

    setEnhancingPrompt(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-safe-prompt', {
        body: { prompt: prompt.trim(), mode: enhanceMode }
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
        const message = isSora2 
          ? 'Prompt otimizado para Sora 2! ✨' 
          : 'Prompt melhorado! Traduzido para inglês e otimizado com técnicas cinematográficas.';
        toast.success(message, { duration: 5000 });
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
    
    // Validations
    if (mode === 'text-to-video' && prompt.trim().length < 10) {
      return;
    }

    if (mode === 'image-to-video') {
      if (inputImages.length === 0) {
        return;
      }
      if (selectedAPI?.requires_images && inputImages.length !== selectedAPI.requires_images) {
        return;
      }
    }

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

  // Detectar se Sora 2 está ativo
  const isSora2Active = apiProvider === 'fal_sora2_image_to_video' || apiProvider === 'fal_sora2_text_to_video';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sora 2 Warning */}
      {isSora2Active && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-2">
          <div className="flex items-start gap-2">
            <Sparkles className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Sora 2 - Filtros Rigorosos Ativos
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                O Sora 2 bloqueia prompts com marcas, produtos específicos e cores detalhadas de objetos.
                Use o botão "Melhorar Prompt" para otimizar automaticamente! ✨
              </p>
            </div>
          </div>
        </div>
      )}

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
            <div className="flex items-center justify-between gap-2 mt-2">
              {mode === 'text-to-video' && (
                <p className="text-xs text-muted-foreground">
                  {prompt.length} caracteres {prompt.length < 10 && `(faltam ${10 - prompt.length})`}
                </p>
              )}
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSuggestSafePrompt}
                  disabled={loading || suggestingPrompt || enhancingPrompt || prompt.trim().length < 5}
                  className="flex-shrink-0"
                >
                  {suggestingPrompt ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Reformulando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Prompt Seguro
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleEnhancePrompt}
                  disabled={loading || suggestingPrompt || enhancingPrompt || prompt.trim().length < 5}
                  data-enhance-prompt
                  className={isSora2Active 
                    ? "flex-shrink-0 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    : "flex-shrink-0 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  }
                >
                  {enhancingPrompt ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isSora2Active ? 'Otimizando...' : 'Melhorando...'}
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      {isSora2Active ? 'Otimizar Sora 2' : 'Melhorar Prompt'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* API Provider */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Modelo de IA</Label>
            <Select value={apiProvider} onValueChange={setApiProvider} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableAPIs.map((api) => (
                  <SelectItem key={api.id} value={api.id}>
                    <div>
                      <div className="font-medium">{api.display_name}</div>
                      <div className="text-xs text-muted-foreground">{api.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Sparkles className="mr-2 h-5 w-5" />
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
