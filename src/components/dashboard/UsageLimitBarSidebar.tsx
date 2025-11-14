import { Image, FileText, Film, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getNextDailyReset, getNextMonthlyReset } from '@/utils/dateHelpers';

export function UsageLimitBarSidebar() {
  const { limits } = useUsageLimits();
  const { subscription } = useSubscription();
  const navigate = useNavigate();

  if (!limits) return null;

  const features = [
    {
      icon: Image,
      name: 'Imagens',
      used: limits.creative_images_daily_used,
      limit: limits.creative_images_daily_limit,
      color: 'text-purple-600',
    },
    {
      icon: FileText,
      name: 'Análises',
      used: limits.profile_analysis_daily_used,
      limit: limits.profile_analysis_daily_limit,
      color: 'text-blue-600',
    },
  ];

  if (subscription?.plan_type === 'pro') {
    features.push({
      icon: Film,
      name: 'Vídeos',
      used: limits.videos_monthly_used,
      limit: limits.videos_monthly_limit + limits.video_credits - limits.video_credits_used,
      color: 'text-green-600',
    });
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const shouldShowUpgrade = features.some(f => (f.used / f.limit) * 100 >= 80);

  const handleUpgrade = () => {
    window.location.href = '/#pricing';
  };

  return (
    <div className="w-full space-y-3">
      <TooltipProvider>
        {features.map((feature, index) => {
          const percentage = (feature.used / feature.limit) * 100;
          const Icon = feature.icon;
          
          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div className="space-y-1.5 cursor-help hover:bg-muted/30 rounded p-2 transition-colors">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-3.5 w-3.5", feature.color)} />
                      <span className="text-xs font-medium text-foreground">
                        {feature.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {feature.used}/{feature.limit}
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full transition-all", getStatusColor(percentage))}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="w-56 p-3">
                {/* Header com ícone e nome */}
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={cn("h-4 w-4", feature.color)} />
                  <p className="font-semibold text-base">{feature.name}</p>
                </div>
                
                {/* Estatísticas de uso */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Usado:</span>
                    <span className="font-medium">{feature.used} de {feature.limit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Disponível:</span>
                    <span className="font-medium text-green-600">{feature.limit - feature.used}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Uso:</span>
                    <span className="font-medium">{percentage.toFixed(1)}%</span>
                  </div>
                </div>
                
                {/* Informação de reset */}
                <div className="border-t pt-2 mb-2">
                  <p className="text-xs text-muted-foreground">
                    {feature.name === 'Vídeos' 
                      ? `🔄 Reseta ${getNextMonthlyReset()}` 
                      : `🔄 Reseta ${getNextDailyReset()}`}
                  </p>
                </div>
                
                {/* Para VÍDEOS PRO: Breakdown de créditos */}
                {feature.name === 'Vídeos' && (
                  <div className="bg-muted/50 rounded p-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>📅 Mensais:</span>
                      <span className="font-medium">
                        {limits.videos_monthly_limit - limits.videos_monthly_used}/{limits.videos_monthly_limit}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600">⚡ Extras:</span>
                      <span className="font-medium text-green-600">
                        {limits.video_credits - limits.video_credits_used}/{limits.video_credits}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* CTA baseado no tipo */}
                {feature.name === 'Vídeos' && percentage >= 70 && (
                  <Button 
                    size="sm" 
                    className="w-full mt-3 bg-green-600 hover:bg-green-700"
                    onClick={() => navigate('/app/video-addons')}
                  >
                    💳 Comprar Mais Créditos
                  </Button>
                )}
                {feature.name !== 'Vídeos' && percentage >= 80 && (
                  <p className="text-xs text-center mt-2 text-muted-foreground">
                    💡 Faça upgrade para ter mais
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
      
      {/* Botão de Comprar Créditos para PRO */}
      {subscription?.plan_type === 'pro' && (
        <Button 
          size="sm" 
          variant="default"
          className="w-full text-xs h-9 bg-green-600 hover:bg-green-700 text-white font-semibold"
          onClick={() => navigate('/app/video-addons')}
        >
          <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
          Comprar Créditos de Vídeo
        </Button>
      )}

      {/* Botão de Upgrade para não-PRO ou quando atingir 80% de outros recursos */}
      {(subscription?.plan_type !== 'pro' || shouldShowUpgrade) && (
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full text-xs h-8 border-lumi-gold/50 text-lumi-gold hover:bg-lumi-gold/10 hover:text-lumi-gold-dark"
          onClick={handleUpgrade}
        >
          ⚡ Fazer Upgrade
        </Button>
      )}
    </div>
  );
}
