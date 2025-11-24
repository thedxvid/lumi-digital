import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, DollarSign, Bell, Database } from 'lucide-react';

export default function ApiCostSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
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

  const updateSettings = useMutation({
    mutationFn: async (newSettings: any) => {
      const { error } = await supabase
        .from('api_cost_settings')
        .update(newSettings)
        .eq('id', settings?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-cost-settings'] });
      toast.success('Configurações salvas com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao salvar configurações');
    },
  });

  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações de Custos</h2>
        <p className="text-muted-foreground">
          Configure limites de alerta e custos por operação
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tracking Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Rastreamento
            </CardTitle>
            <CardDescription>
              Ativar ou desativar o rastreamento de custos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.tracking_enabled || false}
                onCheckedChange={(checked) => handleChange('tracking_enabled', checked)}
              />
              <Label>Rastreamento de custos ativo</Label>
            </div>
          </CardContent>
        </Card>

        {/* Cost per Operation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Custo por Operação (USD)
            </CardTitle>
            <CardDescription>
              Defina o custo de cada tipo de operação
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="creative_image">Imagem Criativa</Label>
              <Input
                id="creative_image"
                type="number"
                step="0.000001"
                value={formData.cost_per_creative_image || 0}
                onChange={(e) => handleChange('cost_per_creative_image', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kling_video">Vídeo Kling</Label>
              <Input
                id="kling_video"
                type="number"
                step="0.01"
                value={formData.cost_per_kling_video || 0}
                onChange={(e) => handleChange('cost_per_kling_video', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fal_video">Vídeo Fal.ai</Label>
              <Input
                id="fal_video"
                type="number"
                step="0.01"
                value={formData.cost_per_fal_video || 0}
                onChange={(e) => handleChange('cost_per_fal_video', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carousel">Carousel</Label>
              <Input
                id="carousel"
                type="number"
                step="0.001"
                value={formData.cost_per_carousel || 0}
                onChange={(e) => handleChange('cost_per_carousel', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile_analysis">Análise de Perfil</Label>
              <Input
                id="profile_analysis"
                type="number"
                step="0.001"
                value={formData.cost_per_profile_analysis || 0}
                onChange={(e) => handleChange('cost_per_profile_analysis', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chat_message">Mensagem de Chat</Label>
              <Input
                id="chat_message"
                type="number"
                step="0.000001"
                value={formData.cost_per_chat_message || 0}
                onChange={(e) => handleChange('cost_per_chat_message', parseFloat(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Alert Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Limites de Alerta (USD)
            </CardTitle>
            <CardDescription>
              Configure os valores de alerta automático
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="daily_warning">Alerta Diário (Warning)</Label>
              <Input
                id="daily_warning"
                type="number"
                step="0.01"
                value={formData.alert_daily_warning || 0}
                onChange={(e) => handleChange('alert_daily_warning', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily_danger">Alerta Diário (Danger)</Label>
              <Input
                id="daily_danger"
                type="number"
                step="0.01"
                value={formData.alert_daily_danger || 0}
                onChange={(e) => handleChange('alert_daily_danger', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekly_warning">Alerta Semanal (Warning)</Label>
              <Input
                id="weekly_warning"
                type="number"
                step="0.01"
                value={formData.alert_weekly_warning || 0}
                onChange={(e) => handleChange('alert_weekly_warning', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekly_danger">Alerta Semanal (Danger)</Label>
              <Input
                id="weekly_danger"
                type="number"
                step="0.01"
                value={formData.alert_weekly_danger || 0}
                onChange={(e) => handleChange('alert_weekly_danger', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly_projected">Projeção Mensal</Label>
              <Input
                id="monthly_projected"
                type="number"
                step="0.01"
                value={formData.alert_monthly_projected || 0}
                onChange={(e) => handleChange('alert_monthly_projected', parseFloat(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Balance */}
        <Card>
          <CardHeader>
            <CardTitle>Saldo das Contas API</CardTitle>
            <CardDescription>
              Saldos informativos das contas de API
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lovable_balance">Saldo Lovable AI (USD)</Label>
              <Input
                id="lovable_balance"
                type="number"
                step="0.01"
                value={formData.lovable_ai_balance_usd || 0}
                onChange={(e) => handleChange('lovable_ai_balance_usd', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fal_balance">Saldo Fal.ai (USD)</Label>
              <Input
                id="fal_balance"
                type="number"
                step="0.01"
                value={formData.fal_ai_balance_usd || 0}
                onChange={(e) => handleChange('fal_ai_balance_usd', parseFloat(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateSettings.isPending}>
            {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Salvar Configurações
          </Button>
        </div>
      </form>
    </div>
  );
}
