import { useState } from 'react';
import { Image, FileText, Film, TrendingUp, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getNextDailyReset, getNextMonthlyReset } from '@/utils/dateHelpers';

export function UsageLimitBar() {
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

  // Adiciona vídeos se for PRO
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
    <div className="hidden md:flex items-center gap-2">
      <TooltipProvider>
        {features.map((feature, index) => {
          const percentage = (feature.used / feature.limit) * 100;
          const Icon = feature.icon;
          
          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-default">
                  <Icon className={cn("h-3 w-3", feature.color)} />
                  <span className="text-xs font-medium">
                    {feature.used}/{feature.limit}
                  </span>
                  <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full transition-all", getStatusColor(percentage))}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="w-64 p-4">
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
                {feature.name === 'Vídeos' && limits && (
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

      {/* Botão de Comprar Créditos - só aparece para PRO */}
      {subscription?.plan_type === 'pro' && (
        <Button 
          size="sm" 
          variant="default"
          className="h-7 text-xs px-3 bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm"
          onClick={() => navigate('/app/video-addons')}
        >
          <ShoppingCart className="h-3 w-3 mr-1" />
          Comprar Créditos
        </Button>
      )}

      {/* Botão de Upgrade - só aparece se não for PRO OU se atingir 80% */}
      {(subscription?.plan_type !== 'pro' || shouldShowUpgrade) && (
        <Button 
          size="sm" 
          variant="outline" 
          className="h-7 text-xs px-3 border-lumi-gold/50 text-lumi-gold hover:bg-lumi-gold/10 hover:text-lumi-gold-dark"
          onClick={handleUpgrade}
        >
          ⚡ Upgrade
        </Button>
      )}
    </div>
  );
}

export function MobileUsageLimitBar() {
  const { limits } = useUsageLimits();
  const { subscription } = useSubscription();
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();

  if (!limits) return null;

  const totalUsed = limits.creative_images_daily_used + limits.profile_analysis_daily_used;
  const totalLimit = limits.creative_images_daily_limit + limits.profile_analysis_daily_limit;
  const percentage = Math.round((totalUsed / totalLimit) * 100);

  const features = [
    {
      icon: Image,
      name: 'Imagens Criativas',
      used: limits.creative_images_daily_used,
      limit: limits.creative_images_daily_limit,
      color: 'text-purple-600',
      resetInfo: getNextDailyReset(),
    },
    {
      icon: FileText,
      name: 'Análises de Perfil',
      used: limits.profile_analysis_daily_used,
      limit: limits.profile_analysis_daily_limit,
      color: 'text-blue-600',
      resetInfo: getNextDailyReset(),
    },
  ];

  if (subscription?.plan_type === 'pro') {
    features.push({
      icon: Film,
      name: 'Vídeos',
      used: limits.videos_monthly_used,
      limit: limits.videos_monthly_limit + limits.video_credits - limits.video_credits_used,
      color: 'text-green-600',
      resetInfo: getNextMonthlyReset(),
    });
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setShowDetails(true)}
        className="h-8"
      >
        <div className="flex items-center gap-1">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs font-medium">{percentage}%</span>
        </div>
      </Button>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Seus Limites de Uso</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {features.map((feature, index) => {
              const featurePercentage = (feature.used / feature.limit) * 100;
              const Icon = feature.icon;
              
              return (
                <div key={index} className="space-y-2">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", feature.color)} />
                      <span className="text-sm font-semibold">{feature.name}</span>
                    </div>
                    {featurePercentage >= 80 && (
                      <Badge variant="destructive" className="text-xs">
                        {featurePercentage >= 90 ? 'Crítico' : 'Atenção'}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Estatísticas */}
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
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
                      <span className="font-medium">{featurePercentage.toFixed(1)}%</span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all", getStatusColor(featurePercentage))}
                        style={{ width: `${Math.min(featurePercentage, 100)}%` }}
                      />
                    </div>
                    
                    <p className="text-xs text-muted-foreground pt-1">
                      🔄 Reseta {feature.resetInfo}
                    </p>
                    
                    {/* Breakdown de vídeos */}
                    {feature.name === 'Vídeos' && (
                      <div className="border-t pt-2 mt-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>📅 Créditos Mensais:</span>
                          <span className="font-medium">
                            {limits.videos_monthly_limit - limits.videos_monthly_used}/{limits.videos_monthly_limit}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-green-600">⚡ Créditos Extras:</span>
                          <span className="font-medium text-green-600">
                            {limits.video_credits - limits.video_credits_used}/{limits.video_credits}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Botões de ação */}
            <div className="flex flex-col gap-2 pt-2">
              {subscription?.plan_type === 'pro' && (
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setShowDetails(false);
                    navigate('/app/video-addons');
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Comprar Créditos de Vídeo
                </Button>
              )}
              
              {subscription?.plan_type !== 'pro' && (
                <Button 
                  className="w-full bg-gradient-to-r from-lumi-gold to-lumi-gold-dark"
                  onClick={() => {
                    setShowDetails(false);
                    navigate('/app/pricing');
                  }}
                >
                  ⚡ Fazer Upgrade para PRO
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
