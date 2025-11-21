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
    <div className="flex gap-2">
      <Button
        type="button"
        variant={mode === 'text-to-video' ? 'default' : 'outline'}
        className="flex-1 text-xs sm:text-sm px-2 sm:px-4"
        onClick={() => onModeChange('text-to-video')}
        disabled={disabled}
      >
        <FileText className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
        <span className="truncate">Texto-para-Vídeo</span>
      </Button>
      <Button
        type="button"
        variant={mode === 'image-to-video' ? 'default' : 'outline'}
        className="flex-1 text-xs sm:text-sm px-2 sm:px-4"
        onClick={() => onModeChange('image-to-video')}
        disabled={disabled}
      >
        <Image className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
        <span className="truncate">Imagem-para-Vídeo</span>
      </Button>
    </div>
  );
};
