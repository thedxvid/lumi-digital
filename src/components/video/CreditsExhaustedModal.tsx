import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Sparkles, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface CreditsExhaustedModalProps {
  open: boolean;
  onClose: () => void;
  videoType: 'sora' | 'kling';
  remainingCredits: number;
}

export const CreditsExhaustedModal = ({ 
  open, 
  onClose, 
  videoType,
  remainingCredits 
}: CreditsExhaustedModalProps) => {
  const navigate = useNavigate();

  const handleBuyCredits = () => {
    navigate('/app/video-addons');
    onClose();
  };

  const videoInfo = videoType === 'sora' 
    ? {
        title: 'Vídeos Sora Esgotados',
        description: 'Você usou seus 2 vídeos grátis do Sora 2 (text-to-video + image-to-video)',
        icon: '🎥'
      }
    : {
        title: 'Vídeo Kling Esgotado',
        description: 'Você usou seu 1 vídeo grátis do Kling v2.5 (text-to-video + image-to-video)',
        icon: '🎬'
      };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-3xl">
            {videoInfo.icon}
          </div>
          <DialogTitle className="text-2xl">
            {videoInfo.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {videoInfo.description}
          </DialogDescription>
        </DialogHeader>

        {remainingCredits > 0 && (
          <Badge className="mx-auto" variant="outline">
            Você ainda tem {remainingCredits} créditos extras disponíveis
          </Badge>
        )}

        <div className="space-y-4 my-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Compre mais créditos e continue criando:
            </p>
            <div className="space-y-2">
              {[
                'Pacotes a partir de R$ 59,90',
                'Créditos unificados: use em qualquer API (Sora ou Kling)',
                'Créditos não expiram',
                'Sem mensalidade extra',
                'Compre apenas quando precisar'
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
            onClick={handleBuyCredits}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90"
            size="lg"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Comprar Créditos Extras
          </Button>
          <Button 
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
