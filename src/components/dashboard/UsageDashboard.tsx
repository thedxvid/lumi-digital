import { useEffect } from 'react';
import { Image, UserCircle, Layout, Video, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useSubscription } from '@/hooks/useSubscription';

export default function UsageDashboard() {
  const { limits, loading, getUsagePercentage, refreshLimits } = useUsageLimits();
  const { subscription } = useSubscription();

  useEffect(() => {
    refreshLimits();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Carregando uso...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!limits || !subscription) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Você ainda não possui um plano ativo.{' '}
          <Button variant="link" className="p-0 h-auto" onClick={() => window.location.href = '/app/pricing'}>
            Ver planos disponíveis
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const features: Array<{
    icon: any;
    name: string;
    type: 'creative_images' | 'profile_analysis' | 'carousels' | 'videos_kling_image';
    daily?: { used: number; limit: number };
    monthly?: { used: number; limit: number };
    lifetime?: { used: number; limit: number };
  }> = [
    {
      icon: Image,
      name: 'Imagens Criativas',
      type: 'creative_images',
      daily: {
        used: limits.creative_images_daily_used,
        limit: limits.creative_images_daily_limit,
      },
      monthly: {
        used: limits.creative_images_monthly_used,
        limit: limits.creative_images_monthly_limit,
      },
    },
    {
      icon: UserCircle,
      name: 'Análises de Perfil',
      type: 'profile_analysis',
      daily: {
        used: limits.profile_analysis_daily_used,
        limit: limits.profile_analysis_daily_limit,
      },
    },
    {
      icon: Layout,
      name: 'Carrosséis',
      type: 'carousels',
      monthly: {
        used: limits.carousels_monthly_used,
        limit: limits.carousels_monthly_limit,
      },
    },
    {
      icon: Video,
      name: 'Vídeos Kling',
      type: 'videos_kling_image',
      lifetime: {
        used: limits.kling_image_videos_lifetime_used,
        limit: limits.kling_image_videos_lifetime_limit,
      },
    },
  ];

  const getBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-amber-500';
    return 'bg-lumi-gold';
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 70) return 'text-amber-500';
    return 'text-foreground';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Uso do Plano
        </h2>
        <Badge variant="outline" className="text-xs">
          até {new Date(subscription.end_date).toLocaleDateString('pt-BR')}
        </Badge>
      </div>

      <div className="grid gap-3 grid-cols-1">
        {features.map((feature) => {
          const Icon = feature.icon;
          const percentage = getUsagePercentage(feature.type);
          const statusColor = getStatusColor(percentage);
          const barColor = getBarColor(percentage);

          return (
            <Card key={feature.type}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="w-4 h-4 flex-shrink-0 text-foreground/60" />
                  <CardTitle className="text-sm font-medium truncate">{feature.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                {feature.daily && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Diário</span>
                      <span className={statusColor}>
                        {feature.daily.used}/{feature.daily.limit}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all`}
                        style={{ width: `${Math.min((feature.daily.used / feature.daily.limit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {feature.monthly && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Mensal</span>
                      <span className={statusColor}>
                        {feature.monthly.used}/{feature.monthly.limit}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all`}
                        style={{ width: `${Math.min((feature.monthly.used / feature.monthly.limit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {feature.lifetime && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Grátis (vitalício)</span>
                      <span className="font-medium">{feature.lifetime.used}/{feature.lifetime.limit}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all`}
                        style={{ width: `${Math.min((feature.lifetime.used / feature.lifetime.limit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {limits.video_credits > 0 && (feature.type === 'videos_kling_image') && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Créditos Extras</span>
                      <span className="text-lumi-gold font-medium">
                        {limits.video_credits - limits.video_credits_used}/{limits.video_credits}
                      </span>
                    </div>
                  </div>
                )}

                {percentage >= 80 && (
                  <Alert className="mt-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      {percentage >= 90 ? 'Limite quase atingido!' : 'Uso elevado deste recurso'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {limits.video_credits > 0 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            className="border-lumi-gold/20 text-lumi-gold hover:bg-lumi-gold/10"
            onClick={() => window.location.href = '/app/video-addons'}
          >
            Comprar Créditos Extras
          </Button>
        </div>
      )}
    </div>
  );
}
