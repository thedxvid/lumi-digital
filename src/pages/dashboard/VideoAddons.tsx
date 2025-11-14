import { useState } from 'react';
import { Video, ShoppingCart, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useSubscription } from '@/hooks/useSubscription';
import { videoAddons, videoAddonsAdvanced } from '@/data/pricingPlans';
import { toast } from 'sonner';
import type { VideoAddonType } from '@/types/subscription';

export default function VideoAddons() {
  const { limits } = useUsageLimits();
  const { subscription } = useSubscription();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (packageType: VideoAddonType) => {
    if (!subscription?.plan_type || (subscription.plan_type !== 'pro' && subscription.plan_type !== 'pro_advanced')) {
      toast.error('Pacotes de vídeo disponíveis apenas para assinantes PRO e PRO Advanced', {
        action: {
          label: 'Ver Planos',
          onClick: () => window.location.href = '/app/pricing'
        }
      });
      return;
    }

    setPurchasing(packageType);
    
    // Sistema de pagamento será integrado em breve
    toast.info('Sistema de pagamento em desenvolvimento', {
      description: 'Entre em contato com o suporte para adquirir créditos extras.',
      duration: 5000
    });
    
    setPurchasing(null);
  };

  const isProUser = subscription?.plan_type === 'pro';
  const isProAdvancedUser = subscription?.plan_type === 'pro_advanced';
  const hasVideoAccess = isProUser || isProAdvancedUser;

  // Select packages based on user plan
  const availablePackages = isProAdvancedUser ? videoAddonsAdvanced : videoAddons;

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Pacotes Extras de Vídeos
        </h1>
        <p className="text-muted-foreground text-lg mb-4">
          {isProAdvancedUser 
            ? 'Gere mais vídeos com Veo 3.1 - máxima qualidade cinematográfica' 
            : 'Precisa gerar mais vídeos este mês? Compre créditos extras!'}
        </p>
        
        {!hasVideoAccess && (
          <div className="mb-6">
            <Badge variant="destructive" className="mb-4 text-base py-2 px-4">
              Disponível apenas para assinantes PRO e PRO Advanced
            </Badge>
            <div>
              <Button onClick={() => window.location.href = '/app/pricing'} size="lg">
                Ver Planos Disponíveis
              </Button>
            </div>
          </div>
        )}

        {limits && hasVideoAccess && (() => {
          const videoUsed = limits.videos_monthly_used + limits.video_credits_used;
          const videoTotal = limits.videos_monthly_limit + limits.video_credits;
          const videoPercentage = videoTotal > 0 ? (videoUsed / videoTotal) * 100 : 0;
          
          return (
            <div className="max-w-md mx-auto p-4 bg-muted rounded-lg border-2 border-primary/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Seus créditos de vídeo:</p>
                {videoPercentage >= 80 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {videoPercentage >= 90 ? '🔴 Crítico' : '⚠️ Atenção'}
                  </Badge>
                )}
              </div>
              <div className="flex justify-center gap-4 text-lg font-semibold mb-2">
                <span>📅 Mensais: {limits.videos_monthly_limit - limits.videos_monthly_used}/{limits.videos_monthly_limit}</span>
                <span className="text-primary">⚡ Extras: {limits.video_credits - limits.video_credits_used}/{limits.video_credits}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    videoPercentage >= 90 ? 'bg-red-500' : 
                    videoPercentage >= 80 ? 'bg-yellow-500' : 
                    'bg-primary'
                  }`}
                  style={{ width: `${Math.min(videoPercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                {videoPercentage.toFixed(1)}% utilizado
              </p>
              {isProAdvancedUser && (
                <Badge variant="secondary" className="mt-3 w-full justify-center">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Veo 3.1 Premium
                </Badge>
              )}
            </div>
          );
        })()}
      </div>

      {hasVideoAccess && (
        <>
          {/* Plan Info Banner */}
          <div className="max-w-5xl mx-auto mb-8 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  {isProAdvancedUser ? '💎 Plano PRO Advanced' : '⭐ Plano PRO'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isProAdvancedUser 
                    ? 'Vídeos com Veo 3.1 do Google - Qualidade cinematográfica máxima'
                    : 'Vídeos com Kling v2.5 Turbo - Movimento fluido e visual cinematográfico'}
                </p>
              </div>
              {!isProAdvancedUser && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/app/pricing'}
                >
                  Fazer Upgrade para Advanced
                </Button>
              )}
            </div>
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
                  <CardTitle className="text-lg">
                    {isProAdvancedUser 
                      ? 'Qual a diferença do Veo 3.1?' 
                      : 'E se eu quiser qualidade premium?'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {isProAdvancedUser 
                    ? 'O Veo 3.1 do Google oferece a mais alta qualidade cinematográfica disponível, com controle criativo avançado e resolução Ultra HD.'
                    : 'Faça upgrade para o Plano PRO Advanced e tenha acesso ao Veo 3.1 do Google - a mais alta qualidade cinematográfica disponível.'}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
