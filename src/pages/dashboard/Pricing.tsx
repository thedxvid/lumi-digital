import { useState } from 'react';
import { Check, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSubscription } from '@/hooks/useSubscription';
import { pricingPlans, getPricePerMonth, getSavingsPercentage } from '@/data/pricingPlans';
import type { DurationMonths } from '@/types/subscription';
import { toast } from 'sonner';

export default function Pricing() {
  const [duration, setDuration] = useState<DurationMonths>(3);
  const { createSubscription, subscription, loading } = useSubscription();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planType: 'basic') => {
    setProcessingPlan(planType);
    
    // TODO: Integrate with payment gateway (Stripe/Kiwify)
    toast.info('Integração de pagamento em desenvolvimento');
    
    const success = await createSubscription(planType, duration);
    
    if (success) {
      toast.success('Plano ativado! (Demo mode)');
    }
    
    setProcessingPlan(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 sm:py-12 px-4 min-h-screen overflow-y-auto">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Escolha Seu Plano
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          Comece a criar conteúdo incrível com IA hoje mesmo
        </p>

        <Tabs value={duration.toString()} onValueChange={(v) => setDuration(Number(v) as DurationMonths)} className="w-fit mx-auto mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="1">1 Mês</TabsTrigger>
            <TabsTrigger value="3">
              3 Meses
              <Badge variant="secondary" className="ml-2">-20%</Badge>
            </TabsTrigger>
            <TabsTrigger value="6">
              6 Meses
              <Badge variant="secondary" className="ml-2">-30%</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
        {pricingPlans.map((plan) => {
          const price = plan.prices[duration];
          const pricePerMonth = getPricePerMonth(price, duration);
          const savings = duration > 1 ? getSavingsPercentage(plan.prices[1], price, duration) : 0;
          const isCurrentPlan = subscription?.plan_type === plan.type;

          // Skip free plan from rendering
          if (plan.type === 'free') return null;

          return (
            <Card 
              key={plan.type}
              className="relative border-primary shadow-lg shadow-primary/20"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-primary to-primary/60">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Recomendado
                </Badge>
              </div>

              <CardHeader>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <CardTitle className="text-xl sm:text-2xl">{plan.name}</CardTitle>
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <CardDescription>{plan.description}</CardDescription>
                
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">R$ {price}</span>
                    {duration > 1 && (
                      <span className="text-muted-foreground">
                        (R$ {pricePerMonth.toFixed(2)}/mês)
                      </span>
                    )}
                  </div>
                  {savings > 0 && (
                    <Badge variant="outline" className="mt-2">
                      Economize {savings}%
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  variant="default"
                  onClick={() => handleSubscribe('basic')}
                  disabled={isCurrentPlan || processingPlan === plan.type}
                >
                  {isCurrentPlan ? 'Plano Atual' : processingPlan === plan.type ? 'Processando...' : 'Assinar Agora'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="mt-16 text-center">
        <p className="text-muted-foreground mb-4">
          Precisa de mais vídeos? Confira nossos pacotes extras!
        </p>
        <Button variant="outline" onClick={() => window.location.href = '/app/video-addons'}>
          Ver Pacotes de Vídeo
        </Button>
      </div>
    </div>
  );
}
