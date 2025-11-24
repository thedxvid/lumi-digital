import { ApiCostDashboard } from '@/components/admin/ApiCostDashboard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';

export default function ApiCosts() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Custos de API</h1>
          <p className="text-muted-foreground">Monitore gastos em tempo real</p>
        </div>
        <Button onClick={() => navigate('/admin/api-costs/settings')} variant="outline">
          <SettingsIcon className="mr-2 h-4 w-4" />
          Configurações
        </Button>
      </div>
      
      <ApiCostDashboard />
    </div>
  );
}
