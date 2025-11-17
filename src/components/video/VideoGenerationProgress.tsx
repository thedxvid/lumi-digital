import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2, Sparkles } from 'lucide-react';
import { getProgressMessage, type TimeEstimate } from '@/utils/videoTimeEstimator';

interface VideoGenerationProgressProps {
  estimate: TimeEstimate;
  aspectRatio?: string;
  onCancel?: () => void;
}

export const VideoGenerationProgress = ({ 
  estimate, 
  aspectRatio = '16:9',
  onCancel 
}: VideoGenerationProgressProps) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(estimate.message);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Progresso estimado (nunca chega a 100% até o vídeo estar pronto)
    const estimatedProgress = Math.min((elapsedSeconds / estimate.average) * 100, 95);
    setProgress(estimatedProgress);
    setMessage(getProgressMessage(elapsedSeconds, estimate));
  }, [elapsedSeconds, estimate]);

  const aspectRatioClasses = {
    '16:9': 'aspect-video',
    '9:16': 'aspect-[9/16]',
    '1:1': 'aspect-square'
  };

  return (
    <div className="w-full space-y-6">
      {/* Preview/Skeleton */}
      <div className={`relative w-full ${aspectRatioClasses[aspectRatio as keyof typeof aspectRatioClasses] || 'aspect-video'} bg-gradient-to-br from-primary/10 via-background to-secondary/10 rounded-lg overflow-hidden`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="relative">
              <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
              <Sparkles className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Animated overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" 
             style={{ 
               backgroundSize: '200% 100%',
               animation: 'shimmer 2s infinite linear'
             }} 
        />
      </div>

      {/* Progress info */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">{message}</span>
          <span className="text-muted-foreground">
            {Math.floor(progress)}%
          </span>
        </div>
        
        <Progress value={progress} className="h-2" />
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Tempo decorrido: {elapsedSeconds}s</span>
          <span>Estimativa: {estimate.min}-{estimate.max}s</span>
        </div>
      </div>

      {/* Cancel button */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancelar geração
        </button>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};
