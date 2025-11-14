import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, RotateCcw, X } from 'lucide-react';
import type { VideoConfig } from '@/types/video';
import { VideoPlayer } from './VideoPlayer';

interface VideoResultModalProps {
  open: boolean;
  onClose: () => void;
  videoUrl: string | null;
  config: VideoConfig | null;
  onRegenerate?: () => void;
  loading?: boolean;
}

export const VideoResultModal = ({
  open,
  onClose,
  videoUrl,
  config,
  onRegenerate,
  loading = false,
}: VideoResultModalProps) => {
  const handleDownload = async () => {
    if (!videoUrl) return;
    
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading video:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Vídeo Gerado com Sucesso! 🎉</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {videoUrl && (
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <VideoPlayer
                src={videoUrl}
                controls
                autoPlay={false}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {config && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
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

          <div className="flex gap-2 justify-end">
            {onRegenerate && (
              <Button
                variant="outline"
                onClick={onRegenerate}
                disabled={loading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Gerar Novamente
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={!videoUrl}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
