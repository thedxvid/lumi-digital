import { Image, FileText, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useSubscription } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';

export function UsageLimitBarSidebar() {
  const { limits } = useUsageLimits();
  const { subscription } = useSubscription();

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
      {features.map((feature, index) => {
        const percentage = (feature.used / feature.limit) * 100;
        const Icon = feature.icon;
        
        return (
          <div key={index} className="space-y-1.5">
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
        );
      })}
      
      {shouldShowUpgrade && (
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
