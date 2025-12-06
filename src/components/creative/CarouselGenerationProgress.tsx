import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Image, Layers, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CarouselGenerationProgressProps {
  isGenerating: boolean;
  slideCount?: number;
}

export function CarouselGenerationProgress({ isGenerating, slideCount = 3 }: CarouselGenerationProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Estimativa: ~8 segundos por slide
  const estimatedSeconds = slideCount * 8;

  const messages = [
    'Preparando geração do carrossel...',
    ...Array.from({ length: slideCount }, (_, i) => `Gerando slide ${i + 1} de ${slideCount}...`),
    'Finalizando carrossel...',
  ];

  useEffect(() => {
    if (!isGenerating) {
      setProgress(0);
      setCurrentSlide(0);
      setElapsedSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        const calculatedProgress = Math.min(95, (next / estimatedSeconds) * 100);
        setProgress(calculatedProgress);
        
        // Calcular slide atual
        const slideProgress = Math.floor((calculatedProgress / 100) * (slideCount + 1));
        setCurrentSlide(Math.min(slideProgress, slideCount));
        
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGenerating, estimatedSeconds, slideCount]);

  if (!isGenerating) return null;

  const messageIndex = Math.min(currentSlide, messages.length - 1);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <Card className="w-full max-w-md mx-4 p-6 space-y-6">
        {/* Preview grid */}
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: Math.min(slideCount, 6) }).map((_, i) => (
            <motion.div
              key={i}
              className={`aspect-[4/5] rounded-lg overflow-hidden ${
                i < currentSlide ? 'bg-primary/20' : 'bg-muted/50'
              }`}
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{
                scale: i === currentSlide ? 1.05 : 1,
                opacity: i <= currentSlide ? 1 : 0.5,
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="h-full w-full flex items-center justify-center">
                {i < currentSlide ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                  >
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </motion.div>
                ) : i === currentSlide ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="h-6 w-6 text-primary/50" />
                  </motion.div>
                ) : (
                  <Image className="h-6 w-6 text-muted-foreground/30" />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Progress info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={messageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                <Layers className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">{messages[messageIndex]}</span>
              </motion.div>
            </AnimatePresence>
            <span className="text-muted-foreground tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>

          <Progress value={progress} className="h-2" />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tempo: {elapsedSeconds}s</span>
            <span>Estimativa: ~{estimatedSeconds}s</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
