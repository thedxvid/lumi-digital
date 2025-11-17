import { useEffect } from 'react';
import { Image, UserCircle, Layout, Video, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
    type: 'creative_images' | 'profile_analysis' | 'carousels' | 'videos_sora_text' | 'videos_kling_image';
    daily?: { used: number; limit: number };
    monthly?: { used: number; limit: number };
    lifetime?: { used: number; limit: number };
    color: string;
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
      color: 'text-blue-500',
    },
    {
      icon: UserCircle,
      name: 'Análises de Perfil',
      type: 'profile_analysis',
      daily: {
        used: limits.profile_analysis_daily_used,
        limit: limits.profile_analysis_daily_limit,
      },
      color: 'text-purple-500',
    },
    {
      icon: Layout,
      name: 'Carrosséis',
      type: 'carousels',
      monthly: {
        used: limits.carousels_monthly_used,
        limit: limits.carousels_monthly_limit,
      },
      color: 'text-green-500',
    },
    {
      icon: Video,
      name: 'Vídeos Sora (text-to-video)',
      type: 'videos_sora_text',
      lifetime: {
        used: limits.sora_text_videos_lifetime_used,
        limit: limits.sora_text_videos_lifetime_limit,
      },
      color: 'text-red-500',
    },
    {
      icon: Video,
      name: 'Vídeos Kling (image-to-video)',
      type: 'videos_kling_image',
      lifetime: {
        used: limits.kling_image_videos_lifetime_used,
        limit: limits.kling_image_videos_lifetime_limit,
      },
      color: 'text-orange-500',
    },
  ];

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-primary';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Uso do Plano</h2>
          <p className="text-muted-foreground">
            Plano Básico
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Válido até {new Date(subscription.end_date).toLocaleDateString('pt-BR')}
        </Badge>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {features.map((feature) => {
          const Icon = feature.icon;
          const percentage = getUsagePercentage(feature.type);
          const statusColor = getStatusColor(percentage);

          return (
            <Card key={feature.type}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${feature.color}`} />
                    <CardTitle className="text-sm sm:text-base truncate">{feature.name}</CardTitle>
                  </div>
                  <TrendingUp className={`w-4 h-4 flex-shrink-0 ${statusColor}`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {feature.daily && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Diário</span>
                      <span className={statusColor}>
                        {feature.daily.used}/{feature.daily.limit}
                      </span>
                    </div>
                    <Progress 
                      value={(feature.daily.used / feature.daily.limit) * 100} 
                      className="h-2"
                    />
                  </div>
                )}
                
                {feature.monthly && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Mensal</span>
                      <span className={statusColor}>
                        {feature.monthly.used}/{feature.monthly.limit}
                      </span>
                    </div>
                    <Progress 
                      value={(feature.monthly.used / feature.monthly.limit) * 100} 
                      className="h-2"
                    />
                  </div>
                )}

                {feature.lifetime && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Grátis (vitalício):</span>
                      <span className="font-medium">{feature.lifetime.used} de {feature.lifetime.limit}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(feature.lifetime.used / feature.lifetime.limit) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {limits.video_credits > 0 && (feature.type === 'videos_sora_text' || feature.type === 'videos_kling_image') && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Créditos Extras</span>
                      <span className="text-primary font-medium">
                        {limits.video_credits - limits.video_credits_used}/{limits.video_credits}
                      </span>
                    </div>
                  </div>
                )}

                {percentage >= 80 && (
                  <Alert className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {percentage >= 90 ? 'Limite quase atingido!' : 'Você está usando bastante este recurso'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-4 justify-center">
        {limits.video_credits > 0 && (
          <Button onClick={() => window.location.href = '/app/video-addons'}>
            Comprar Créditos Extras
          </Button>
        )}
      </div>
    </div>
  );
}
