import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Wand2, Palette, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreativeGenerationProgressProps {
  isGenerating: boolean;
  mode?: 'with-image' | 'prompt-only';
}

const MESSAGES = [
  { icon: Sparkles, text: 'Analisando sua solicitação...', color: 'text-purple-500' },
  { icon: Wand2, text: 'Criando composição visual...', color: 'text-blue-500' },
  { icon: Palette, text: 'Aplicando estilos e cores...', color: 'text-pink-500' },
  { icon: Sparkles, text: 'Finalizando criativo...', color: 'text-green-500' },
];

export function CreativeGenerationProgress({ isGenerating, mode = 'with-image' }: CreativeGenerationProgressProps) {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Estimativa de tempo baseada no modo
  const estimatedSeconds = mode === 'prompt-only' ? 15 : 20;

  useEffect(() => {
    if (!isGenerating) {
      setProgress(0);
      setMessageIndex(0);
      setElapsedSeconds(0);
      return;
    }

    // Timer para tempo decorrido
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        // Calcular progresso (máximo 95% enquanto gerando)
        const calculatedProgress = Math.min(95, (next / estimatedSeconds) * 100);
        setProgress(calculatedProgress);
        
        // Atualizar mensagem
        const newMessageIndex = Math.min(
          Math.floor((calculatedProgress / 100) * MESSAGES.length),
          MESSAGES.length - 1
        );
        setMessageIndex(newMessageIndex);
        
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGenerating, estimatedSeconds]);

  if (!isGenerating) return null;

  const CurrentIcon = MESSAGES[messageIndex].icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <Card className="w-full max-w-md mx-4 p-6 space-y-6">
        {/* Preview placeholder */}
        <div className="relative aspect-square rounded-lg bg-muted/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
          <motion.div
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(45deg, transparent 40%, rgba(var(--primary), 0.1) 50%, transparent 60%)',
              backgroundSize: '200% 200%',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="h-12 w-12 text-primary/50" />
            </motion.div>
          </div>
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
                <CurrentIcon className={`h-4 w-4 ${MESSAGES[messageIndex].color}`} />
                <span className="text-muted-foreground">{MESSAGES[messageIndex].text}</span>
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
