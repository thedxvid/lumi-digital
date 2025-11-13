import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles } from 'lucide-react';
import type { VideoConfig, VideoAPIConfig, VideoMode } from '@/types/video';
import { VideoModeSelector } from './VideoModeSelector';
import { VideoImageUploader } from './VideoImageUploader';

const VIDEO_APIS: VideoAPIConfig[] = [
  // Text-to-Video APIs
  {
    id: 'fal_veo3_fast',
    name: 'fal_veo3_fast',
    display_name: 'Veo 3 Fast (Text)',
    cost_per_8s: 0.80,
    description: 'Rápido e econômico',
    provider: 'Google',
    mode: 'text-to-video'
  },
  {
    id: 'fal_veo31',
    name: 'fal_veo31',
    display_name: 'Veo 3.1 (Text)',
    cost_per_8s: 3.20,
    description: 'Máxima qualidade',
    provider: 'Google',
    mode: 'text-to-video'
  },
  {
    id: 'fal_hunyuan',
    name: 'fal_hunyuan',
    display_name: 'Hunyuan Video (Text)',
    cost_per_8s: 0.64,
    description: 'Boa qualidade',
    provider: 'Tencent',
    mode: 'text-to-video'
  },
  {
    id: 'fal_wan_fast',
    name: 'fal_wan_fast',
    display_name: 'Wan 2.2 FastVideo (Text)',
    cost_per_8s: 0.50,
    description: 'Ultra rápido - até 5s em 720p',
    provider: 'Wan',
    mode: 'text-to-video'
  },
  // Image-to-Video APIs
  {
    id: 'fal_veo31_image_to_video',
    name: 'fal_veo31_image_to_video',
    display_name: 'Veo 3.1 Image-to-Video',
    cost_per_8s: 3.20,
    description: 'Gera vídeo a partir de 1 imagem',
    provider: 'Google',
    mode: 'image-to-video',
    requires_images: 1,
    endpoint: 'https://fal.run/fal-ai/veo3.1/image-to-video'
  },
  {
    id: 'fal_veo31_fast_image_to_video',
    name: 'fal_veo31_fast_image_to_video',
    display_name: 'Veo 3.1 Fast Image-to-Video',
    cost_per_8s: 0.80,
    description: 'Versão rápida - 1 imagem',
    provider: 'Google',
    mode: 'image-to-video',
    requires_images: 1,
    endpoint: 'https://fal.run/fal-ai/veo3.1/fast/image-to-video'
  },
  {
    id: 'fal_veo31_reference_to_video',
    name: 'fal_veo31_reference_to_video',
    display_name: 'Veo 3.1 Reference-to-Video',
    cost_per_8s: 3.20,
    description: 'Usa imagem como referência',
    provider: 'Google',
    mode: 'image-to-video',
    requires_images: 1,
    endpoint: 'https://fal.run/fal-ai/veo3.1/reference-to-video'
  },
  {
    id: 'fal_veo31_first_last_frame',
    name: 'fal_veo31_first_last_frame',
    display_name: 'Veo 3.1 First/Last Frame',
    cost_per_8s: 3.20,
    description: 'Gera vídeo entre 2 frames',
    provider: 'Google',
    mode: 'image-to-video',
    requires_images: 2,
    endpoint: 'https://fal.run/fal-ai/veo3.1/first-last-frame-to-video'
  },
  {
    id: 'fal_veo31_fast_first_last_frame',
    name: 'fal_veo31_fast_first_last_frame',
    display_name: 'Veo 3.1 Fast First/Last Frame',
    cost_per_8s: 0.80,
    description: 'Versão rápida - 2 frames',
    provider: 'Google',
    mode: 'image-to-video',
    requires_images: 2,
    endpoint: 'https://fal.run/fal-ai/veo3.1/fast/first-last-frame-to-video'
  }
];

interface VideoConfigFormProps {
  onGenerate: (config: VideoConfig) => void;
  loading: boolean;
}

export const VideoConfigForm = ({ onGenerate, loading }: VideoConfigFormProps) => {
  const [mode, setMode] = useState<VideoMode>('text-to-video');
  const [prompt, setPrompt] = useState('');
  const [inputImages, setInputImages] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('16:9');
  const [duration, setDuration] = useState<'4s' | '6s' | '8s'>('8s');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [generateAudio, setGenerateAudio] = useState(true);
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [apiProvider, setApiProvider] = useState<string>('fal_veo3_fast');

  // Filter APIs based on mode
  const availableAPIs = VIDEO_APIS.filter(api => api.mode === mode);

  // Update API provider when mode changes
  const handleModeChange = (newMode: VideoMode) => {
    setMode(newMode);
    setInputImages([]);
    // Set default API for the mode
    const defaultAPI = VIDEO_APIS.find(api => api.mode === newMode);
    if (defaultAPI) {
      setApiProvider(defaultAPI.id);
    }
  };

  // Get selected API config
  const selectedAPI = VIDEO_APIS.find(api => api.id === apiProvider);
  const maxImages = selectedAPI?.requires_images || 1;

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
                ? "Ex: Uma entrevista de rua em Nova York. Diálogo de exemplo:\nApresentador: 'Você ouviu a notícia?'\nPessoa: 'Sim! O Veo 3.1 está disponível. Incrível!'"
                : "Ex: Zoom lento na imagem, movimento suave da câmera da esquerda para direita"}
              className="min-h-[120px] resize-none"
              disabled={loading}
            />
            {mode === 'text-to-video' && (
              <p className="text-xs text-muted-foreground mt-1">
                {prompt.length} caracteres {prompt.length < 10 && `(faltam ${10 - prompt.length})`}
              </p>
            )}
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
                    <div className="flex items-center justify-between gap-4 w-full">
                      <div>
                        <div className="font-medium">{api.display_name}</div>
                        <div className="text-xs text-muted-foreground">{api.description}</div>
                      </div>
                      <div className="text-xs font-semibold text-lumi-gold whitespace-nowrap">
                        ${api.cost_per_8s.toFixed(2)}/8s
                      </div>
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
