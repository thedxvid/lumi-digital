import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmailProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: {
    total: number;
    sent: number;
    failed: number;
    current: string;
    errors: Array<{ email: string; error: string }>;
  };
  isComplete: boolean;
  isLoading: boolean;
}

export const EmailProgressModal = ({
  open,
  onOpenChange,
  progress,
  isComplete,
  isLoading
}: EmailProgressModalProps) => {
  const percentage = progress.total > 0 
    ? Math.round((progress.sent + progress.failed) / progress.total * 100) 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            {isComplete && progress.failed === 0 && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            {isComplete && progress.failed > 0 && (
              <XCircle className="h-5 w-5 text-orange-500" />
            )}
            <span>
              {isLoading && "Enviando Emails..."}
              {isComplete && "Envio Concluído"}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{progress.sent + progress.failed} de {progress.total}</span>
              <span>{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          {/* Current Status */}
          {isLoading && progress.current && (
            <div className="flex items-center gap-2 text-sm p-3 bg-muted rounded-lg">
              <Mail className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-muted-foreground">
                Enviando para: <span className="text-foreground font-medium">{progress.current}</span>
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{progress.sent}</p>
                <p className="text-xs text-muted-foreground">Enviados</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{progress.failed}</p>
                <p className="text-xs text-muted-foreground">Falharam</p>
              </div>
            </div>
          </div>

          {/* Errors List */}
          {progress.errors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive">Erros:</p>
              <div className="max-h-32 overflow-y-auto space-y-1 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                {progress.errors.map((error, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{error.email}</span>
                    <span className="text-destructive ml-2">{error.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete Message */}
          {isComplete && (
            <div className={`p-4 rounded-lg border ${
              progress.failed === 0 
                ? 'bg-green-500/10 border-green-500/20' 
                : 'bg-orange-500/10 border-orange-500/20'
            }`}>
              <p className="text-sm font-medium">
                {progress.failed === 0 
                  ? '🎉 Todos os emails foram enviados com sucesso!'
                  : `⚠️ ${progress.sent} enviados, ${progress.failed} falharam.`
                }
              </p>
            </div>
          )}

          {/* Close Button */}
          {isComplete && (
            <Button 
              onClick={() => onOpenChange(false)} 
              className="w-full"
            >
              Fechar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
