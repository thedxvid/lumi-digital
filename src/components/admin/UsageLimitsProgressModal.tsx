import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Loader2, Users } from 'lucide-react';

interface UsageLimitsProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalUsers: number;
  currentBatch: number;
  totalBatches: number;
  processedCount: number;
  errors: string[];
  stage: 'identifying' | 'creating' | 'complete' | 'error';
}

export const UsageLimitsProgressModal = ({
  isOpen,
  onClose,
  totalUsers,
  currentBatch,
  totalBatches,
  processedCount,
  errors,
  stage
}: UsageLimitsProgressModalProps) => {
  const progress = totalUsers > 0 ? (processedCount / totalUsers) * 100 : 0;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && stage === 'complete' && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {stage === 'identifying' && (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Identificando Usuários
              </>
            )}
            {stage === 'creating' && (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Criando Usage Limits
              </>
            )}
            {stage === 'complete' && (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Processo Concluído
              </>
            )}
            {stage === 'error' && (
              <>
                <AlertCircle className="h-5 w-5 text-red-500" />
                Erro no Processo
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                Total
              </div>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="text-xs text-muted-foreground">Processados</div>
              <div className="text-2xl font-bold text-primary">{processedCount}</div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="text-xs text-muted-foreground">Restantes</div>
              <div className="text-2xl font-bold text-orange-500">{totalUsers - processedCount}</div>
            </div>
          </div>

          {/* Progress Bar */}
          {stage !== 'identifying' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso Geral</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          )}

          {/* Batch Progress */}
          {stage === 'creating' && totalBatches > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Batch Atual</span>
                <Badge variant="outline">
                  {currentBatch} de {totalBatches}
                </Badge>
              </div>
              <div className="bg-muted/30 rounded p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Processando batch {currentBatch}...</span>
                </div>
              </div>
            </div>
          )}

          {/* Stage Info */}
          {stage === 'identifying' && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium">Identificando usuários sem usage_limits...</span>
              </div>
              <p className="text-muted-foreground mt-2 text-xs">
                Verificando usuários ativos que ainda não possuem limites configurados
              </p>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium text-sm">
                <AlertCircle className="h-4 w-4" />
                Erros Encontrados ({errors.length})
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {errors.slice(0, 5).map((error, i) => (
                  <div key={i} className="text-xs text-muted-foreground">
                    • {error}
                  </div>
                ))}
                {errors.length > 5 && (
                  <div className="text-xs text-muted-foreground italic">
                    ... e mais {errors.length - 5} erros
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success Message */}
          {stage === 'complete' && errors.length === 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                <CheckCircle2 className="h-5 w-5" />
                <span>Usage limits criados com sucesso!</span>
              </div>
              <p className="text-muted-foreground mt-2 text-sm">
                {totalUsers} usuários agora têm seus limites configurados.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
