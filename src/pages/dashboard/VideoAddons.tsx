import { useState } from 'react';
import { Video, ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useSubscription } from '@/hooks/useSubscription';
import { videoAddons } from '@/data/pricingPlans';
import { toast } from 'sonner';

export default function VideoAddons() {
  const { limits, purchaseVideoAddon } = useUsageLimits();
  const { subscription } = useSubscription();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (packageType: 'plus_10' | 'plus_20' | 'plus_30') => {
    if (subscription?.plan_type !== 'pro') {
      toast.error('Pacotes de vídeo disponíveis apenas para assinantes PRO', {
        action: {
          label: 'Ver Planos',
          onClick: () => window.location.href = '/pricing'
        }
      });
      return;
    }

    setPurchasing(packageType);
    
    // TODO: Integrate with payment gateway
    toast.info('Integração de pagamento em desenvolvimento');
    
    await purchaseVideoAddon(packageType);
    setPurchasing(null);
  };

  const isProUser = subscription?.plan_type === 'pro';

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Pacotes Extras de Vídeos
        </h1>
        <p className="text-muted-foreground text-lg mb-4">
          Precisa gerar mais vídeos este mês? Compre créditos extras!
        </p>
        
        {!isProUser && (
          <Badge variant="destructive" className="mb-4">
            Disponível apenas para assinantes PRO
          </Badge>
        )}

        {limits && isProUser && (
          <div className="max-w-md mx-auto p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Seus créditos atuais:</p>
            <div className="flex justify-center gap-4 text-lg font-semibold">
              <span>Mensais: {limits.videos_monthly_limit - limits.videos_monthly_used}/{limits.videos_monthly_limit}</span>
              <span className="text-primary">Extras: {limits.video_credits - limits.video_credits_used}/{limits.video_credits}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {videoAddons.map((addon) => {
          const pricePerVideo = (addon.price / addon.credits).toFixed(2);

          return (
            <Card key={addon.type} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Video className="w-8 h-8 text-primary" />
                  {addon.credits === 20 && (
                    <Badge variant="secondary">Melhor Custo</Badge>
                  )}
                </div>
                <CardTitle className="text-2xl">{addon.name}</CardTitle>
                <CardDescription>
                  R$ {pricePerVideo} por vídeo
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="text-center py-6">
                  <div className="text-5xl font-bold mb-2">
                    {addon.credits}
                  </div>
                  <div className="text-muted-foreground">vídeos</div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Válido por 30 dias</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Até 8 segundos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Resolução 1080p</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Com áudio</span>
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-3xl font-bold">R$ {addon.price.toFixed(2)}</span>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handlePurchase(addon.type)}
                  disabled={!isProUser || purchasing === addon.type}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {purchasing === addon.type ? 'Processando...' : 'Comprar Agora'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-muted-foreground mb-4">
          Ainda não tem o Plano PRO?
        </p>
        <Button variant="outline" onClick={() => window.location.href = '/pricing'}>
          Ver Planos de Assinatura
        </Button>
      </div>
    </div>
  );
}
