import { Card, CardContent } from '@/components/ui/card';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityData {
  date: string;
  count: number;
  dayName: string;
}

export const WeeklyActivityChart = () => {
  const [data, setData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    if (session?.user?.id) {
      fetchWeeklyActivity();
    }
  }, [session?.user?.id]);

  const fetchWeeklyActivity = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: activityData, error } = await supabase
        .from('user_activity_log')
        .select('activity_date, chats_started, results_generated, modules_used')
        .eq('user_id', session.user.id)
        .gte('activity_date', sevenDaysAgo.toISOString().split('T')[0]);

      if (error) throw error;

      // Build a map of date -> total activity count
      const activityCounts: Record<string, number> = {};
      activityData?.forEach((row) => {
        const date = row.activity_date;
        const modulesUsed = typeof row.modules_used === 'number' ? row.modules_used : 0;
        const total = (row.chats_started || 0) + (row.results_generated || 0) + modulesUsed;
        activityCounts[date] = (activityCounts[date] || 0) + total;
      });

      const chartData: ActivityData[] = [];
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = dayNames[date.getDay()];

        chartData.push({
          date: dateStr,
          count: activityCounts[dateStr] || 0,
          dayName,
        });
      }

      setData(chartData);
    } catch (error) {
      console.error('Error fetching weekly activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(d => d.count), 1);

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
          Atividade Semanal
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(45, 100%, 60%)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(45, 100%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="dayName"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              allowDecimals={false}
              domain={[0, maxValue]}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '13px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number) => [`${value} ações`, 'Atividade']}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--lumi-gold))"
              strokeWidth={2}
              fill="url(#goldGradient)"
              dot={{ fill: 'hsl(var(--lumi-gold))', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: 'hsl(var(--lumi-gold))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
