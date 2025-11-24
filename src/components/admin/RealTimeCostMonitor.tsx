import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DollarSign } from 'lucide-react';
import { useApiCosts } from '@/hooks/useApiCosts';
import { supabase } from '@/integrations/supabase/client';
import { useCostProjection } from '@/hooks/useCostProjection';
import { useIsMobile } from '@/hooks/use-mobile';

export const RealTimeCostMonitor = () => {
  const { stats, settings, refetch } = useApiCosts();
  const projection = useCostProjection();
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('api-costs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'api_cost_tracking',
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  if (!settings) return null;

  // Calculate status color
  const percentage = (stats.today / settings.alert_daily_warning) * 100;
  let variant: 'default' | 'secondary' | 'destructive' = 'default';
  let bgColor = 'bg-green-500';

  if (percentage >= 80) {
    variant = 'destructive';
    bgColor = 'bg-red-500';
  } else if (percentage >= 50) {
    variant = 'secondary';
    bgColor = 'bg-yellow-500';
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Badge variant={variant} className="cursor-pointer gap-1 px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm">
          <div className={`h-2 w-2 rounded-full ${bgColor} animate-pulse`} />
          <DollarSign className="h-3 w-3" />
          {isMobile ? (
            <span className="font-semibold">${stats.today.toFixed(2)}</span>
          ) : (
            <span>${stats.today.toFixed(2)}</span>
          )}
        </Badge>
      </DialogTrigger>
      <DialogContent className="max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Monitoramento em Tempo Real</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Hoje</div>
              <div className="text-2xl font-bold">${stats.today.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">
                {percentage.toFixed(0)}% do limite diário
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Esta Semana</div>
              <div className="text-2xl font-bold">${stats.week.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">
                {((stats.week / settings.alert_weekly_warning) * 100).toFixed(0)}% do limite semanal
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Este Mês</div>
              <div className="text-2xl font-bold">${stats.month.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Gasto atual mensal</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Projeção Mensal</div>
              <div className="text-2xl font-bold">${projection.monthlyProjection.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">
                Baseado em média de 7 dias
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Status</div>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${bgColor}`} />
              <span className="text-sm">
                {percentage < 50 ? 'Normal' : percentage < 80 ? 'Atenção' : 'Alerta'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Tendência</div>
            <div className="text-sm text-muted-foreground">
              {projection.trend === 'increasing' && '📈 Crescimento detectado'}
              {projection.trend === 'decreasing' && '📉 Decrescimento detectado'}
              {projection.trend === 'stable' && '➡️ Estável'}
              {' '}
              ({projection.percentageChange > 0 ? '+' : ''}
              {projection.percentageChange}% vs semana anterior)
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
