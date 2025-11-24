import { useEffect, useState } from 'react';
import { useApiCosts } from './useApiCosts';
import { toast } from 'sonner';

export interface CostAlert {
  level: 'info' | 'warning' | 'danger';
  message: string;
  threshold: number;
  current: number;
}

export const useApiCostAlerts = () => {
  const { stats, settings } = useApiCosts();
  const [alerts, setAlerts] = useState<CostAlert[]>([]);
  const [lastAlertTime, setLastAlertTime] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!settings) return;

    const newAlerts: CostAlert[] = [];
    const now = Date.now();
    const ALERT_COOLDOWN = 60 * 60 * 1000; // 1 hour cooldown between same alerts

    // Check daily warning
    if (stats.today >= settings.alert_daily_warning) {
      const alertKey = 'daily_warning';
      const lastAlert = lastAlertTime[alertKey] || 0;
      
      if (now - lastAlert > ALERT_COOLDOWN) {
        const alert: CostAlert = {
          level: stats.today >= settings.alert_daily_danger ? 'danger' : 'warning',
          message: `Custo diário de $${stats.today.toFixed(2)} ${stats.today >= settings.alert_daily_danger ? 'excedeu' : 'atingiu'} o limite de $${settings.alert_daily_warning.toFixed(2)}`,
          threshold: settings.alert_daily_warning,
          current: stats.today,
        };
        newAlerts.push(alert);

        // Show toast
        if (alert.level === 'danger') {
          toast.error(alert.message, { duration: 10000 });
        } else {
          toast.warning(alert.message, { duration: 8000 });
        }

        setLastAlertTime((prev) => ({ ...prev, [alertKey]: now }));
      }
    }

    // Check weekly warning
    if (stats.week >= settings.alert_weekly_warning) {
      const alertKey = 'weekly_warning';
      const lastAlert = lastAlertTime[alertKey] || 0;
      
      if (now - lastAlert > ALERT_COOLDOWN) {
        const alert: CostAlert = {
          level: stats.week >= settings.alert_weekly_danger ? 'danger' : 'warning',
          message: `Custo semanal de $${stats.week.toFixed(2)} ${stats.week >= settings.alert_weekly_danger ? 'excedeu' : 'atingiu'} o limite de $${settings.alert_weekly_warning.toFixed(2)}`,
          threshold: settings.alert_weekly_warning,
          current: stats.week,
        };
        newAlerts.push(alert);

        if (alert.level === 'danger') {
          toast.error(alert.message, { duration: 10000 });
        } else {
          toast.warning(alert.message, { duration: 8000 });
        }

        setLastAlertTime((prev) => ({ ...prev, [alertKey]: now }));
      }
    }

    // Check monthly projection
    if (stats.projectedMonthly >= settings.alert_monthly_projected) {
      const alertKey = 'monthly_projected';
      const lastAlert = lastAlertTime[alertKey] || 0;
      
      if (now - lastAlert > ALERT_COOLDOWN * 2) { // Longer cooldown for projection
        const alert: CostAlert = {
          level: 'info',
          message: `Projeção mensal de $${stats.projectedMonthly.toFixed(2)} pode exceder o budget de $${settings.alert_monthly_projected.toFixed(2)}`,
          threshold: settings.alert_monthly_projected,
          current: stats.projectedMonthly,
        };
        newAlerts.push(alert);

        toast.info(alert.message, { duration: 8000 });

        setLastAlertTime((prev) => ({ ...prev, [alertKey]: now }));
      }
    }

    setAlerts(newAlerts);
  }, [stats, settings, lastAlertTime]);

  return { alerts };
};
