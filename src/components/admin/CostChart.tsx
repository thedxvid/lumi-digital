import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useApiCosts } from '@/hooks/useApiCosts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const CostChart = () => {
  const { costs } = useApiCosts();

  // Prepare data for last 30 days
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const dateRange = eachDayOfInterval({ start: thirtyDaysAgo, end: now });

  const chartData = dateRange.map((date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayCosts = costs.filter((c) => format(new Date(c.created_at), 'yyyy-MM-dd') === dateKey);

    const totalCost = dayCosts.reduce((sum, c) => sum + Number(c.cost_usd), 0);
    const lovableAICost = dayCosts
      .filter((c) => c.api_provider.includes('lovable'))
      .reduce((sum, c) => sum + Number(c.cost_usd), 0);
    const falAICost = dayCosts
      .filter((c) => c.api_provider.includes('fal'))
      .reduce((sum, c) => sum + Number(c.cost_usd), 0);

    return {
      date: format(date, 'dd/MM', { locale: ptBR }),
      total: Number(totalCost.toFixed(4)),
      lovable: Number(lovableAICost.toFixed(4)),
      fal: Number(falAICost.toFixed(4)),
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendência de Custos - Últimos 30 Dias</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => `$${value.toFixed(2)}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="Total"
              dot={{ fill: 'hsl(var(--primary))' }}
            />
            <Line
              type="monotone"
              dataKey="lovable"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              name="Lovable AI"
              dot={{ fill: 'hsl(var(--chart-1))' }}
            />
            <Line
              type="monotone"
              dataKey="fal"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              name="Fal.ai"
              dot={{ fill: 'hsl(var(--chart-2))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
