import { useState } from 'react';
import { Image, FileText, Film, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getNextDailyReset, getNextMonthlyReset } from '@/utils/dateHelpers';

export function UsageLimitBarSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
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
    navigate('/app/pricing');
  };

  return (
    <div className="w-full">
      {/* Header Compacto - Sempre visível */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs font-medium text-foreground">Limites de Uso</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </button>

      {/* Conteúdo Expansível */}
      {isExpanded && (
        <div className="mt-2 space-y-2">
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
                      {feature.name === 'Vídeos' ? (
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
              variant="outline" 
              size="sm" 
              onClick={handleUpgrade}
              className="w-full text-xs mt-2 gap-1.5"
            >
              <ShoppingCart className="h-3 w-3" />
              Comprar Créditos de Vídeo
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
