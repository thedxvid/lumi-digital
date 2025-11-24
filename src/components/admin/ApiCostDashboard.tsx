import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, AlertCircle, Target } from 'lucide-react';
import { useApiCosts } from '@/hooks/useApiCosts';
import { useCostProjection } from '@/hooks/useCostProjection';
import { CostChart } from './CostChart';
import { CostAlerts } from './CostAlerts';
import { CostBreakdownTable } from './CostBreakdownTable';
import { Progress } from '@/components/ui/progress';

export const ApiCostDashboard = () => {
  const { stats, settings, isLoading } = useApiCosts();
  const projection = useCostProjection();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-4 w-4 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted rounded mb-2" />
                <div className="h-3 w-40 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getDailyStatus = () => {
    if (!settings) return { label: 'N/A', color: 'text-muted-foreground' };
    const percentage = (stats.today / settings.alert_daily_warning) * 100;
    if (percentage >= 80) return { label: '🔴 Alerta', color: 'text-red-500' };
    if (percentage >= 50) return { label: '🟡 Atenção', color: 'text-yellow-500' };
    return { label: '🟢 Normal', color: 'text-green-500' };
  };

  const getWeeklyStatus = () => {
    if (!settings) return { label: 'N/A', color: 'text-muted-foreground' };
    const percentage = (stats.week / settings.alert_weekly_warning) * 100;
    if (percentage >= 80) return { label: '🔴 Alerta', color: 'text-red-500' };
    if (percentage >= 50) return { label: '🟡 Atenção', color: 'text-yellow-500' };
    return { label: '🟢 OK', color: 'text-green-500' };
  };

  const dailyStatus = getDailyStatus();
  const weeklyStatus = getWeeklyStatus();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard de Custos de API</h2>
        <p className="text-muted-foreground">
          Monitore e controle os custos de uso de APIs em tempo real
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.today.toFixed(2)}</div>
            <p className={`text-xs ${dailyStatus.color}`}>{dailyStatus.label}</p>
            {settings && (
              <Progress
                value={(stats.today / settings.alert_daily_warning) * 100}
                className="mt-2 h-1"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.week.toFixed(2)}</div>
            <p className={`text-xs ${weeklyStatus.color}`}>{weeklyStatus.label}</p>
            {settings && (
              <Progress
                value={(stats.week / settings.alert_weekly_warning) * 100}
                className="mt-2 h-1"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.month.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Gasto atual mensal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projeção Mensal</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${projection.monthlyProjection.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Confiança: {projection.confidence}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <CostAlerts />

      {/* Chart */}
      <CostChart />

      {/* Feature Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Breakdown por Feature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(stats.byFeature)
            .sort(([, a], [, b]) => b - a)
            .map(([feature, cost]) => {
              const percentage = (cost / stats.month) * 100;
              return (
                <div key={feature} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">{feature.replace('_', ' ')}</span>
                    <span className="text-muted-foreground">
                      ${cost.toFixed(2)} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <CostBreakdownTable />
    </div>
  );
};
