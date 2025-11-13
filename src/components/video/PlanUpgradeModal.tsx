import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles, Video, Check } from 'lucide-react';

interface PlanUpgradeModalProps {
  open: boolean;
}

export const PlanUpgradeModal = ({ open }: PlanUpgradeModalProps) => {
  const handleUpgrade = () => {
    window.location.href = '/app/pricing?feature=video-generator';
  };

  const handleGoBack = () => {
    window.location.href = '/app/overview';
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-lumi-gold to-lumi-gold-dark rounded-full flex items-center justify-center">
            <Lock className="h-8 w-8 text-background" />
          </div>
          <DialogTitle className="text-2xl">
            Recurso Exclusivo PRO
          </DialogTitle>
          <DialogDescription className="text-base">
            O Gerador de Vídeos está disponível apenas para usuários do Plano PRO
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-lumi-gold" />
              Com o Plano PRO você ganha:
            </p>
            <div className="space-y-2">
              {[
                '15 vídeos por mês inclusos',
                'Acesso a todas as APIs de vídeo',
                'Qualidade até 1080p',
                'Vídeos com áudio',
                'Image-to-video e muito mais!'
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-lumi-gold to-lumi-gold-dark hover:opacity-90"
            size="lg"
          >
            <Video className="h-4 w-4 mr-2" />
            Fazer Upgrade para PRO
          </Button>
          <Button 
            onClick={handleGoBack}
            variant="outline"
            className="w-full"
          >
            Voltar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
