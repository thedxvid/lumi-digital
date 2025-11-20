import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, Copy, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface SupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SupportModal = ({ open, onOpenChange }: SupportModalProps) => {
  const [copied, setCopied] = useState(false);
  const supportEmail = 'suportedalumi@gmail.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopied(true);
    toast.success('Email copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = () => {
    window.location.href = `mailto:${supportEmail}?subject=Solicitação de Suporte - LUMI`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Suporte LUMI
          </DialogTitle>
          <DialogDescription>
            Nossa equipe está pronta para ajudar você!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Email de Contato */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4 text-primary" />
              Email de Suporte
            </div>
            <div className="flex items-center justify-between gap-2">
              <code className="flex-1 rounded bg-background px-3 py-2 text-sm font-mono">
                {supportEmail}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyEmail}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Tempo de Resposta */}
          <div className="rounded-lg border border-border bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Tempo de Resposta</p>
                <p className="text-xs text-muted-foreground">
                  Respondemos em até <strong className="text-foreground">24 horas úteis</strong>. 
                  Para questões urgentes, mencione no assunto do email.
                </p>
              </div>
            </div>
          </div>

          {/* Botão de Enviar Email */}
          <Button 
            onClick={handleSendEmail}
            className="w-full"
            size="lg"
          >
            <Mail className="h-4 w-4 mr-2" />
            Enviar Email
          </Button>

          {/* Informações Úteis */}
          <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-4">
            <p className="font-medium text-foreground mb-2">Dicas para um atendimento mais rápido:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Descreva detalhadamente seu problema</li>
              <li>Inclua capturas de tela se relevante</li>
              <li>Mencione o email da sua conta LUMI</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
