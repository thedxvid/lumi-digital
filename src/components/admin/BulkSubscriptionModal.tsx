import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface BulkSubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (config: { planType: string; months: number }) => void;
  selectedCount: number;
}

export const BulkSubscriptionModal = ({
  open,
  onClose,
  onConfirm,
  selectedCount
}: BulkSubscriptionModalProps) => {
  const [planType, setPlanType] = useState('basic');
  const [months, setMonths] = useState(1);

  const handleConfirm = () => {
    onConfirm({ planType, months });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Estender Assinatura em Lote</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Aplicar a mesma extensão para <strong>{selectedCount} usuários</strong> selecionados
          </p>

          <div className="space-y-2">
            <Label>Tipo de Plano</Label>
            <Select value={planType} onValueChange={setPlanType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Básico</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Duração</Label>
            <Select value={months.toString()} onValueChange={(v) => setMonths(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 mês</SelectItem>
                <SelectItem value="3">3 meses</SelectItem>
                <SelectItem value="6">6 meses</SelectItem>
                <SelectItem value="12">12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Aplicar para {selectedCount} usuários
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
