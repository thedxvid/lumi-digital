import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, RotateCcw, X } from 'lucide-react';
import type { VideoConfig } from '@/types/video';
import { VideoPlayer } from './VideoPlayer';
import { toast } from 'sonner';
import { useState } from 'react';
import { VideoGenerationProgress } from './VideoGenerationProgress';
import type { TimeEstimate } from '@/utils/videoTimeEstimator';

interface VideoResultModalProps {
  open: boolean;
  onClose: () => void;
  videoUrl: string | null;
  config: VideoConfig | null;
  onRegenerate?: () => void;
  loading?: boolean;
  generationStatus?: 'idle' | 'generating' | 'ready' | 'error';
  timeEstimate?: TimeEstimate | null;
  onCancel?: () => void;
  thumbnailUrl?: string | null;
}

export const VideoResultModal = ({
  open,
  onClose,
  videoUrl,
  config,
  onRegenerate,
  loading = false,
  generationStatus = 'idle',
  timeEstimate,
  onCancel,
  thumbnailUrl
}: VideoResultModalProps) => {
  const [downloading, setDownloading] = useState(false);
  const isGenerating = generationStatus === 'generating';
  const isReady = generationStatus === 'ready';

  const handleDownload = async () => {
    if (!videoUrl) return;
    
    setDownloading(true);
    try {
      // Try to fetch and download
      const response = await fetch(videoUrl, { mode: 'cors' });
      if (!response.ok) throw new Error('Failed to fetch video');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `lumi-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('Vídeo baixado com sucesso!');
    } catch (error) {
      console.error('Error downloading video:', error);
      // Fallback: open in new tab
      toast.info('Abrindo vídeo em nova aba para download...');
      window.open(videoUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${isGenerating ? 'max-w-2xl' : 'max-w-4xl'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>
            {isGenerating ? '🎬 Gerando Vídeo...' : isReady ? 'Vídeo Gerado com Sucesso! 🎉' : 'Resultado do Vídeo'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Mostrar progresso enquanto está gerando */}
          {isGenerating && timeEstimate && (
            <VideoGenerationProgress 
              estimate={timeEstimate}
              aspectRatio={config?.aspect_ratio}
              onCancel={onCancel}
              thumbnailUrl={thumbnailUrl}
            />
          )}

          {/* Mostrar vídeo quando estiver pronto */}
          {isReady && videoUrl && (
            <div className="aspect-video bg-muted rounded-lg overflow-hidden animate-in fade-in duration-500">
              <VideoPlayer
                src={videoUrl}
                controls
                autoPlay={true}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Configuração - mostrar apenas quando pronto */}
          {isReady && config && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 animate-in fade-in duration-500">
              <h4 className="font-semibold text-sm">Configurações utilizadas:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Proporção:</span> {config.aspect_ratio}
                </div>
                <div>
                  <span className="font-medium">Duração:</span> {config.duration}
                </div>
                <div>
                  <span className="font-medium">Resolução:</span> {config.resolution}
                </div>
                <div>
                  <span className="font-medium">Áudio:</span> {config.generate_audio ? 'Sim' : 'Não'}
                </div>
              </div>
              <div className="pt-2 border-t border-border/50">
                <p className="text-sm">
                  <span className="font-medium">Prompt:</span> {config.prompt}
                </p>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2 justify-end">
            {isReady && onRegenerate && (
              <Button
                variant="outline"
                onClick={onRegenerate}
                disabled={loading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Gerar Novamente
              </Button>
            )}
            
            {isReady && videoUrl && (
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={downloading}
              >
                <Download className="h-4 w-4 mr-2" />
                {downloading ? 'Baixando...' : 'Download'}
              </Button>
            )}

            <Button
              variant={isGenerating ? "destructive" : "default"}
              onClick={isGenerating ? onCancel : onClose}
            >
              <X className="h-4 w-4 mr-2" />
              {isGenerating ? 'Cancelar' : 'Fechar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
