import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import type { VideoConfig } from '@/types/video';

interface VideoConfigFormProps {
  onGenerate: (config: VideoConfig) => void;
  loading: boolean;
}

export const VideoConfigForm = ({ onGenerate, loading }: VideoConfigFormProps) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('16:9');
  const [duration, setDuration] = useState<'4s' | '6s' | '8s'>('8s');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [generateAudio, setGenerateAudio] = useState(true);
  const [enhancePrompt, setEnhancePrompt] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (prompt.trim().length < 10) {
      return;
    }

    onGenerate({
      prompt: prompt.trim(),
      aspect_ratio: aspectRatio,
      duration,
      resolution,
      generate_audio: generateAudio,
      enhance_prompt: enhancePrompt,
    });
  };

  const isValid = prompt.trim().length >= 10;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="prompt" className="text-base font-semibold">
              Descreva o vídeo que deseja gerar
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Seja detalhado e específico para melhores resultados (mínimo 10 caracteres)
            </p>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Uma entrevista de rua em Nova York. Diálogo de exemplo:&#10;Apresentador: 'Você ouviu a notícia?'&#10;Pessoa: 'Sim! O Veo 3.1 está disponível. Incrível!'"
              className="min-h-[120px] resize-none"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {prompt.length} caracteres {prompt.length < 10 && `(faltam ${10 - prompt.length})`}
            </p>
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
                      {ratio === '9:16' && 'Stories/Reels'}
                      {ratio === '16:9' && 'YouTube/Web'}
                      {ratio === '1:1' && 'Post/Feed'}
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
                  {res === '1080p' && <span className="ml-1 text-xs opacity-70">(HD)</span>}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="audio">Gerar áudio</Label>
              <p className="text-xs text-muted-foreground">
                Inclui efeitos sonoros e música
              </p>
            </div>
            <Switch
              id="audio"
              checked={generateAudio}
              onCheckedChange={setGenerateAudio}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="enhance" className="flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                Melhorar prompt
              </Label>
              <p className="text-xs text-muted-foreground">
                IA otimiza seu prompt automaticamente
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
        size="lg"
        className="w-full"
        disabled={loading || !isValid}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Gerando vídeo... (isso pode levar até 60 segundos)
          </>
        ) : (
          'Gerar Vídeo'
        )}
      </Button>

      {!isValid && prompt.length > 0 && (
        <p className="text-sm text-destructive text-center">
          O prompt deve ter pelo menos 10 caracteres
        </p>
      )}
    </form>
  );
};
