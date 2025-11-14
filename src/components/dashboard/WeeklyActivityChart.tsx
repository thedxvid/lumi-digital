import { Card, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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
        .select('activity_date')
        .eq('user_id', session.user.id)
        .gte('activity_date', sevenDaysAgo.toISOString().split('T')[0]);

      if (error) throw error;

      // Count activities per day
      const activityCounts: Record<string, number> = {};
      activityData?.forEach((activity) => {
        const date = activity.activity_date;
        activityCounts[date] = (activityCounts[date] || 0) + 1;
      });

      // Create array for last 7 days
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
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(d => d.count), 1);

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-foreground mb-4">Atividade Semanal</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <XAxis 
              dataKey="dayName" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              allowDecimals={false}
              domain={[0, maxValue]}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
