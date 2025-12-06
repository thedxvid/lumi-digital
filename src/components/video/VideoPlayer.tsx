import { useState, useRef, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  controls?: boolean;
  autoPlay?: boolean;
  className?: string;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onError?: () => void;
}

export const VideoPlayer = ({ 
  src, 
  poster, 
  controls = true, 
  autoPlay = false, 
  className = "w-full h-full object-contain",
  onLoadStart,
  onCanPlay,
  onError
}: VideoPlayerProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset states when src changes
    setLoading(true);
    setError(false);

    const handleLoadStart = () => {
      console.log('🎬 Video loadstart event');
      setLoading(true);
      onLoadStart?.();
    };
    
    const handleCanPlay = () => {
      console.log('✅ Video canplay event');
      setLoading(false);
      onCanPlay?.();
    };
    
    const handleError = (e: Event) => {
      console.error('❌ Video error event:', e);
      setLoading(false);
      setError(true);
      onError?.();
    };

    const handleLoadedMetadata = () => {
      console.log('📊 Video metadata loaded');
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Timeout para detectar se o vídeo não carregar
    const timeout = setTimeout(() => {
      if (loading && !error) {
        console.warn('⏱️ Video loading timeout - forcing load');
        // Try to force load
        video.load();
      }
    }, 5000);

    return () => {
      clearTimeout(timeout);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [src, onLoadStart, onCanPlay, onError]);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={src}
        poster={poster || src + '#t=0.1'}
        controls={controls}
        autoPlay={autoPlay}
        playsInline
        preload="metadata"
        className={className}
      />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando vídeo...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-center p-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="font-semibold text-foreground">Erro ao carregar vídeo</p>
            <p className="text-sm text-muted-foreground">Tente novamente mais tarde</p>
          </div>
        </div>
      )}
    </div>
  );
};
