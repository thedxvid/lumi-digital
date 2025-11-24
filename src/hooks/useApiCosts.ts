import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, startOfWeek, startOfMonth, subDays, format } from 'date-fns';

export interface ApiCostRecord {
  id: string;
  user_id: string | null;
  feature_type: 'creative_image' | 'video' | 'carousel' | 'profile_analysis' | 'chat' | 'other';
  api_provider: string;
  cost_usd: number;
  metadata: any;
  created_at: string;
}

export interface CostStats {
  today: number;
  week: number;
  month: number;
  projectedMonthly: number;
  byFeature: Record<string, number>;
  byProvider: Record<string, number>;
  trend: Array<{ date: string; cost: number }>;
}

export const useApiCosts = () => {
  const { data: costs, isLoading, refetch } = useQuery({
    queryKey: ['api-costs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_cost_tracking')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data as ApiCostRecord[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: settings } = useQuery({
    queryKey: ['api-cost-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_cost_settings')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
  });

  const stats: CostStats = {
    today: 0,
    week: 0,
    month: 0,
    projectedMonthly: 0,
    byFeature: {},
    byProvider: {},
    trend: [],
  };

  if (costs) {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    costs.forEach((cost) => {
      const costDate = new Date(cost.created_at);
      const costValue = Number(cost.cost_usd);

      // Calculate totals
      if (costDate >= todayStart) {
        stats.today += costValue;
      }
      if (costDate >= weekStart) {
        stats.week += costValue;
      }
      if (costDate >= monthStart) {
        stats.month += costValue;
      }

      // By feature
      stats.byFeature[cost.feature_type] = (stats.byFeature[cost.feature_type] || 0) + costValue;

      // By provider
      stats.byProvider[cost.api_provider] = (stats.byProvider[cost.api_provider] || 0) + costValue;
    });

    // Calculate projection based on last 7 days average
    const sevenDaysAgo = subDays(now, 7);
    const last7DaysCosts = costs.filter((c) => new Date(c.created_at) >= sevenDaysAgo);
    const last7DaysTotal = last7DaysCosts.reduce((sum, c) => sum + Number(c.cost_usd), 0);
    const dailyAverage = last7DaysTotal / 7;
    stats.projectedMonthly = dailyAverage * 30;

    // Build trend data for last 30 days
    const trendMap: Record<string, number> = {};
    const thirtyDaysAgo = subDays(now, 30);
    
    costs.forEach((cost) => {
      const costDate = new Date(cost.created_at);
      if (costDate >= thirtyDaysAgo) {
        const dateKey = format(costDate, 'yyyy-MM-dd');
        trendMap[dateKey] = (trendMap[dateKey] || 0) + Number(cost.cost_usd);
      }
    });

    stats.trend = Object.entries(trendMap)
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  return {
    costs: costs || [],
    stats,
    settings,
    isLoading,
    refetch,
  };
};
