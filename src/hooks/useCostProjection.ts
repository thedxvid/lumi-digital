import { useMemo } from 'react';
import { useApiCosts } from './useApiCosts';
import { subDays, format, eachDayOfInterval } from 'date-fns';

export const useCostProjection = () => {
  const { costs } = useApiCosts();

  const projection = useMemo(() => {
    if (!costs.length) {
      return {
        dailyAverage: 0,
        weeklyProjection: 0,
        monthlyProjection: 0,
        trend: 'stable' as 'increasing' | 'decreasing' | 'stable',
        confidence: 0,
      };
    }

    const now = new Date();
    const last7Days = subDays(now, 7);
    const last14Days = subDays(now, 14);

    // Calculate average for last 7 days
    const recent7DaysCosts = costs.filter((c) => new Date(c.created_at) >= last7Days);
    const recent7DaysTotal = recent7DaysCosts.reduce((sum, c) => sum + Number(c.cost_usd), 0);
    const dailyAverage = recent7DaysTotal / 7;

    // Calculate average for previous 7 days (days 8-14)
    const previous7DaysCosts = costs.filter(
      (c) => new Date(c.created_at) >= last14Days && new Date(c.created_at) < last7Days
    );
    const previous7DaysTotal = previous7DaysCosts.reduce((sum, c) => sum + Number(c.cost_usd), 0);
    const previousDailyAverage = previous7DaysTotal / 7;

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    const percentageChange = previousDailyAverage > 0 
      ? ((dailyAverage - previousDailyAverage) / previousDailyAverage) * 100 
      : 0;

    if (percentageChange > 10) {
      trend = 'increasing';
    } else if (percentageChange < -10) {
      trend = 'decreasing';
    }

    // Calculate confidence based on data consistency
    const dailyCosts = eachDayOfInterval({ start: last7Days, end: now }).map((date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      return costs
        .filter((c) => format(new Date(c.created_at), 'yyyy-MM-dd') === dateKey)
        .reduce((sum, c) => sum + Number(c.cost_usd), 0);
    });

    const variance = dailyCosts.reduce((sum, cost) => {
      return sum + Math.pow(cost - dailyAverage, 2);
    }, 0) / dailyCosts.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = dailyAverage > 0 ? stdDev / dailyAverage : 1;
    
    // Confidence: higher when variation is lower
    const confidence = Math.max(0, Math.min(100, (1 - coefficientOfVariation) * 100));

    return {
      dailyAverage,
      weeklyProjection: dailyAverage * 7,
      monthlyProjection: dailyAverage * 30,
      trend,
      confidence: Math.round(confidence),
      percentageChange: Math.round(percentageChange),
    };
  }, [costs]);

  return projection;
};
