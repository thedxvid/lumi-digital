import { useState } from 'react';
import { Video, ShoppingCart, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useSubscription } from '@/hooks/useSubscription';
import { videoAddons } from '@/data/pricingPlans';
import type { VideoAddonType } from '@/types/subscription';

export default function VideoAddons() {
  const { limits } = useUsageLimits();
  const { subscription } = useSubscription();
  const [showComingSoonDialog, setShowComingSoonDialog] = useState(false);

  const handlePurchase = async (packageType: VideoAddonType) => {
    setShowComingSoonDialog(true);
  };

  const availablePackages = videoAddons;

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Pacotes Extras de Vídeos
        </h1>
        <p className="text-muted-foreground text-lg mb-4">
          Precisa gerar mais vídeos? Compre créditos extras e use em Sora 2 ou Kling v2.5!
        </p>

        {limits && (() => {
          const soraUsed = limits.sora_text_videos_lifetime_used || 0;
          const soraTotal = limits.sora_text_videos_lifetime_limit || 2;
          const klingUsed = limits.kling_image_videos_lifetime_used || 0;
          const klingTotal = limits.kling_image_videos_lifetime_limit || 1;
          const extraCredits = limits.video_credits - limits.video_credits_used;
          
          return (
            <div className="max-w-md mx-auto p-4 bg-muted rounded-lg border-2 border-primary/50">
              <p className="text-sm font-medium mb-2">Seus créditos de vídeo:</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>🎥 Sora (text-to-video):</span>
                  <span className="font-semibold">{soraTotal - soraUsed}/{soraTotal} grátis</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>🎬 Kling (image-to-video):</span>
                  <span className="font-semibold">{klingTotal - klingUsed}/{klingTotal} grátis</span>
                </div>
                {extraCredits > 0 && (
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span>⚡ Créditos Extras:</span>
                    <span className="font-semibold text-primary">{extraCredits}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {availablePackages.map((addon, index) => {
          const pricePerVideo = (addon.price / addon.credits).toFixed(2);
          const isPopular = index === 2;

          return (
            <Card key={addon.type} className={`relative ${isPopular ? 'border-primary shadow-lg scale-105' : ''}`}>
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  Mais Popular
                </Badge>
              )}

              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Video className="h-8 w-8 text-primary" />
                  <Badge variant="secondary" className="text-xs">
                    R$ {pricePerVideo}/vídeo
                  </Badge>
                </div>
                <CardTitle className="text-2xl">{addon.name}</CardTitle>
                <CardDescription>{addon.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      R$ {addon.price.toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {addon.credits} créditos de vídeo
                    </p>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm">{addon.credits} vídeos extras</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm">Sora 2 e Kling v2.5</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm">Créditos não expiram</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm">Use quando precisar</span>
                    </div>
                  </div>

                  {isPopular && (
                    <Badge variant="secondary" className="w-full justify-center">
                      Melhor custo-benefício
                    </Badge>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full" 
                  size="lg"
                  variant={isPopular ? "default" : "outline"}
                  onClick={() => handlePurchase(addon.type)}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Comprar Agora
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="max-w-5xl mx-auto mt-16">
        <h2 className="text-2xl font-bold mb-6 text-center">Perguntas Frequentes</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Como funcionam os créditos extras?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Os créditos extras são adicionados ao seu saldo e podem ser usados quando seus vídeos grátis acabarem. 
              Cada vídeo gerado (Sora ou Kling) consome 1 crédito.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Os créditos expiram?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Não! Os créditos comprados não expiram. Use-os quando precisar, sem pressa.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Posso acumular pacotes?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Sim! Você pode comprar múltiplos pacotes e seus créditos serão somados.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">E se eu quiser mais vídeos?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Simples! Compre mais pacotes quando precisar. Sem compromisso, sem mensalidade extra.
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Coming Soon Dialog */}
      <AlertDialog open={showComingSoonDialog} onOpenChange={setShowComingSoonDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-2xl">
              Função em Breve!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              O sistema de compra de créditos extras está sendo desenvolvido e será liberado em breve.
              <br /><br />
              Por enquanto, entre em contato com nosso suporte para adquirir créditos extras de vídeos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <Button onClick={() => setShowComingSoonDialog(false)} className="w-full sm:w-auto">
              Entendi
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
