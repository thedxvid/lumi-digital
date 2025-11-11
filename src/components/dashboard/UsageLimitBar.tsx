import { useState } from 'react';
import { Image, FileText, Film, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
    window.location.href = '/#pricing';
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
              <TooltipContent>
                <p className="font-medium">{feature.name}</p>
                <p className="text-xs text-muted-foreground">
                  {feature.used} de {feature.limit} usados
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>

      {shouldShowUpgrade && (
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
  const [showDetails, setShowDetails] = useState(false);

  if (!limits) return null;

  const totalUsed = limits.creative_images_daily_used + limits.profile_analysis_daily_used;
  const totalLimit = limits.creative_images_daily_limit + limits.profile_analysis_daily_limit;
  const percentage = Math.round((totalUsed / totalLimit) * 100);

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => setShowDetails(!showDetails)}
      className="h-8"
    >
      <div className="flex items-center gap-1">
        <TrendingUp className="h-4 w-4" />
        <span className="text-xs font-medium">{percentage}%</span>
      </div>
    </Button>
  );
}
