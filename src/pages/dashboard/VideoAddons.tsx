import { useState } from 'react';
import { Video, ShoppingCart, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useSubscription } from '@/hooks/useSubscription';
import { videoAddons } from '@/data/pricingPlans';
import { toast } from 'sonner';
import type { VideoAddonType } from '@/types/subscription';

export default function VideoAddons() {
  const { limits } = useUsageLimits();
  const { subscription } = useSubscription();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (packageType: VideoAddonType) => {
    setPurchasing(packageType);
    
    // Sistema de pagamento será integrado em breve
    toast.info('Sistema de pagamento em desenvolvimento', {
      description: 'Entre em contato com o suporte para adquirir créditos extras.',
      duration: 5000
    });
    
    setPurchasing(null);
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
              const isPopular = index === 1; // Middle package is most popular
              const isUrgent = limits && ((limits.videos_monthly_used + limits.video_credits_used) / (limits.videos_monthly_limit + limits.video_credits)) >= 0.8;

              return (
                <Card key={addon.type} className={`relative ${isPopular ? 'border-primary shadow-lg scale-105' : ''}`}>
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      Mais Popular
                    </Badge>
                  )}
                  
                  {isUrgent && index === 0 && (
                    <Badge className="absolute -top-3 right-4 bg-yellow-500 animate-pulse">
                      ⚠️ Quase esgotado!
                    </Badge>
                  )}

                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Video className="w-8 h-8 text-primary" />
                      {isProAdvancedUser && (
                        <Badge variant="secondary">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    <CardTitle>{addon.name}</CardTitle>
                    <CardDescription>{addon.description}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-3xl font-bold mb-1">
                          R$ {addon.price.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          R$ {pricePerVideo} por vídeo
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          <span className="text-sm">{addon.credits} vídeos extras</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          <span className="text-sm">
                            {isProAdvancedUser ? 'Veo 3.1 (até 8s, Ultra HD)' : 'Kling v2.5 (até 10s, Full HD)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          <span className="text-sm">Créditos válidos por 30 dias</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          <span className="text-sm">Processamento prioritário</span>
                        </div>
                      </div>

                      {isPopular && (
                        <Badge variant="secondary" className="w-full justify-center">
                          Melhor custo-benefício
                        </Badge>
                      )}

                      {index === 2 && (
                        <Badge variant="outline" className="w-full justify-center">
                          {isProAdvancedUser 
                            ? 'Economia de R$ 130 vs. individual'
                            : 'Economia de R$ 49 vs. 3x +10'}
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
                      disabled={purchasing === addon.type}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {purchasing === addon.type ? 'Processando...' : 'Comprar Agora'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* FAQ Section */}
          <div className="max-w-5xl mx-auto mt-16">
            <h2 className="text-2xl font-bold mb-6 text-center">Perguntas Frequentes</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Como funcionam os créditos extras?</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Os créditos extras são adicionados aos seus créditos mensais e podem ser usados quando seus vídeos mensais acabarem. 
                  {isProAdvancedUser 
                    ? ' Cada vídeo gerado com Veo 3.1 consome 1 crédito.'
                    : ' Cada vídeo gerado com Kling v2.5 consome 1 crédito.'}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Os créditos expiram?</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Sim, os créditos extras comprados expiram após 30 dias da data de compra. Use-os antes do vencimento!
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Posso acumular pacotes?</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Sim! Você pode comprar múltiplos pacotes e seus créditos serão somados. Ideal para projetos que exigem grande volume.
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">E se eu quiser mais vídeos?</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Simples! Compre mais pacotes de créditos quando precisar. Sem compromisso, sem mensalidade extra.
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
    </div>
  );
}

export default VideoAddons;
