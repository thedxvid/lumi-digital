import { Button } from '@/components/ui/button';
import { FileText, Image } from 'lucide-react';

type VideoMode = 'text-to-video' | 'image-to-video';

interface VideoModeSelectorProps {
  mode: VideoMode;
  onModeChange: (mode: VideoMode) => void;
  disabled?: boolean;
}

export const VideoModeSelector = ({ mode, onModeChange, disabled }: VideoModeSelectorProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button
        type="button"
        variant={mode === 'text-to-video' ? 'default' : 'outline'}
        className="flex-1"
        onClick={() => onModeChange('text-to-video')}
        disabled={disabled}
      >
        <FileText className="h-4 w-4 mr-2" />
        Texto-para-Vídeo
      </Button>
      <Button
        type="button"
        variant={mode === 'image-to-video' ? 'default' : 'outline'}
        className="flex-1"
        onClick={() => onModeChange('image-to-video')}
        disabled={disabled}
      >
        <Image className="h-4 w-4 mr-2" />
        Imagem-para-Vídeo
      </Button>
    </div>
  );
};
