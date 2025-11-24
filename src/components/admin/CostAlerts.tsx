import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Info, XCircle } from 'lucide-react';
import { useApiCostAlerts } from '@/hooks/useApiCostAlerts';

export const CostAlerts = () => {
  const { alerts } = useApiCostAlerts();

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => {
        const Icon = alert.level === 'danger' ? XCircle : alert.level === 'warning' ? AlertTriangle : Info;
        const variant = alert.level === 'danger' || alert.level === 'warning' ? 'destructive' : 'default';

        return (
          <Alert key={index} variant={variant}>
            <Icon className="h-4 w-4" />
            <AlertTitle>
              {alert.level === 'danger' ? 'Alerta Crítico' : alert.level === 'warning' ? 'Atenção' : 'Informação'}
            </AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
};
