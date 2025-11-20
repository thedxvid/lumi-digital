import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Calendar, Crown } from 'lucide-react';

interface SubscriptionManagerProps {
  userId: string;
  userName: string;
  currentEndDate?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubscriptionManager = ({
  userId,
  userName,
  currentEndDate,
  isOpen,
  onClose,
  onSuccess
}: SubscriptionManagerProps) => {
  const [loading, setLoading] = useState(false);
  const [planType, setPlanType] = useState<string>('basic');
  const [months, setMonths] = useState<string>('1');
  const [customMonths, setCustomMonths] = useState<string>('');

  const handleExtend = async () => {
    setLoading(true);
    try {
      const monthsToAdd = months === 'custom' ? parseInt(customMonths) : parseInt(months);

      if (isNaN(monthsToAdd) || monthsToAdd <= 0) {
        toast.error('Número de meses inválido');
        return;
      }

      const startDate = currentEndDate ? new Date(currentEndDate) : new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + monthsToAdd);

      // Criar ou atualizar assinatura
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_type: planType,
          duration_months: monthsToAdd,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          is_active: true,
          auto_renew: false
        }, {
          onConflict: 'user_id'
        });

      if (subError) throw subError;

      // Atualizar limites baseado no plano
      const limits = planType === 'basic' ? {
        plan_type: 'basic',
        creative_images_daily_limit: 10,
        creative_images_monthly_limit: 300,
        profile_analysis_daily_limit: 5,
        carousels_monthly_limit: 3,
        videos_monthly_limit: 0
      } : {
        plan_type: 'free',
        creative_images_daily_limit: 0,
        creative_images_monthly_limit: 0,
        profile_analysis_daily_limit: 0,
        carousels_monthly_limit: 0,
        videos_monthly_limit: 0
      };

      const { error: limitsError } = await supabase
        .from('usage_limits')
        .update(limits)
        .eq('user_id', userId);

      if (limitsError) throw limitsError;

      // Registrar log
      await supabase.rpc('log_admin_action', {
        _target_user_id: userId,
        _action: 'extend_subscription',
        _details: { plan_type: planType, months: monthsToAdd, end_date: endDate.toISOString() }
      });

      toast.success('Assinatura atualizada com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao estender assinatura:', error);
      toast.error('Erro ao atualizar assinatura');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gerenciar Assinatura - {userName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Plano</Label>
            <Select value={planType} onValueChange={setPlanType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-600" />
                    Basic
                  </div>
                </SelectItem>
                <SelectItem value="free">Free</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Duração</Label>
            <Select value={months} onValueChange={setMonths}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 mês</SelectItem>
                <SelectItem value="3">3 meses</SelectItem>
                <SelectItem value="6">6 meses</SelectItem>
                <SelectItem value="12">12 meses (1 ano)</SelectItem>
                <SelectItem value="custom">Customizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {months === 'custom' && (
            <div className="space-y-2">
              <Label>Meses (customizado)</Label>
              <Input
                type="number"
                min="1"
                value={customMonths}
                onChange={(e) => setCustomMonths(e.target.value)}
                placeholder="Digite o número de meses"
              />
            </div>
          )}

          {currentEndDate && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Data atual de expiração:
              </p>
              <p className="font-medium">
                {new Date(currentEndDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleExtend} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
