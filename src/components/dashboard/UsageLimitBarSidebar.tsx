import { Image, FileText, Film, ShoppingCart, Layers } from 'lucide-react';
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
      isMonthly: false,
    },
    {
      icon: FileText,
      name: 'Análises',
      used: limits.profile_analysis_daily_used,
      limit: limits.profile_analysis_daily_limit,
      color: 'text-blue-600',
      isMonthly: false,
    },
    {
      icon: Layers,
      name: 'Carrosséis',
      used: limits.carousel_images_monthly_used || limits.carousels_monthly_used || 0,
      limit: limits.carousel_images_monthly_limit || limits.carousels_monthly_limit || 0,
      color: 'text-orange-600',
      isMonthly: true,
    },
    {
      icon: Film,
      name: 'Vídeos',
      used: (limits.kling_image_videos_lifetime_used || 0) + limits.video_credits_used,
      limit: (limits.kling_image_videos_lifetime_limit || 1) + limits.video_credits,
      color: 'text-green-600',
      isMonthly: true,
    },
  ];
  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const shouldShowUpgrade = features.some(f => (f.used / f.limit) * 100 >= 80);

  const handleUpgrade = () => {
    navigate('/app/video-addons');
  };

  return (
    <div className="w-full">
      <div className="space-y-1">
        <TooltipProvider>
          {features.map((feature, index) => {
            const percentage = (feature.used / feature.limit) * 100;
            const Icon = feature.icon;
            
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div className="space-y-1 cursor-help hover:bg-muted/30 rounded px-2 py-1.5 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Icon className={cn("h-3 w-3", feature.color)} />
                        <span className="text-xs text-foreground">
                          {feature.name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {feature.used}/{feature.limit}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
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
                        <span className="text-muted-foreground">Progresso:</span>
                        <span className="font-medium">{Math.round(percentage)}%</span>
                      </div>
                    </div>

                    {/* Barra de progresso visual grande */}
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
                      <div 
                        className={cn("h-full rounded-full transition-all", getStatusColor(percentage))}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>

                    {/* Próxima renovação */}
                    <div className="text-xs text-muted-foreground border-t border-border pt-2">
                      {feature.isMonthly ? (
                        <>
                          <p className="font-medium mb-1">Renovação Mensal:</p>
                          <p>{getNextMonthlyReset()}</p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium mb-1">Renovação Diária:</p>
                          <p>{getNextDailyReset()}</p>
                        </>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>

        {shouldShowUpgrade && (
          <Button
            onClick={handleUpgrade}
            variant="outline"
            size="sm"
            className="w-full mt-1 text-xs gap-1.5 h-7 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:border-purple-500/40"
          >
            <ShoppingCart className="h-3 w-3" />
            Comprar Créditos
          </Button>
        )}
      </div>
    </div>
  );
}
