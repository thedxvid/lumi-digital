import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useGoals } from '@/hooks/useGoals';
import { Plus, Target, Trash2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function GoalsTracker() {
  const { goals, loading, createGoal, deleteGoal, completeGoal } = useGoals();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    goal_type: 'revenue' as const,
    title: '',
    description: '',
    target_value: '',
    current_value: '0',
    unit: 'R$',
    deadline: ''
  });

  const activeGoals = goals.filter(g => g.status === 'active');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createGoal({
      ...formData,
      target_value: Number(formData.target_value),
      current_value: Number(formData.current_value),
      status: 'active'
    });

    setFormData({
      goal_type: 'revenue',
      title: '',
      description: '',
      target_value: '',
      current_value: '0',
      unit: 'R$',
      deadline: ''
    });
    setDialogOpen(false);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(100, (current / target) * 100);
  };

  const getDaysRemaining = (deadline?: string) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Suas Metas
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Meta</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Meta</Label>
                  <Select
                    value={formData.goal_type}
                    onValueChange={(value: any) => setFormData({ ...formData, goal_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Faturamento</SelectItem>
                      <SelectItem value="leads">Leads</SelectItem>
                      <SelectItem value="products">Produtos</SelectItem>
                      <SelectItem value="daily_usage">Uso Diário</SelectItem>
                      <SelectItem value="custom">Personalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Atingir 10k em vendas"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Meta</Label>
                    <Input
                      required
                      type="number"
                      min="0"
                      value={formData.target_value}
                      onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                      placeholder="10000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unidade</Label>
                    <Input
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="R$"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Prazo (opcional)</Label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">Criar Meta</Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando metas...</div>
        ) : activeGoals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              Você ainda não tem metas definidas
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Meta
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeGoals.map((goal) => {
              const progress = getProgressPercentage(goal.current_value, goal.target_value);
              const daysRemaining = getDaysRemaining(goal.deadline);
              const isCompleted = progress >= 100;

              return (
                <div
                  key={goal.id}
                  className="p-4 rounded-lg border border-border space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{goal.title}</h4>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {goal.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {isCompleted && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => completeGoal(goal.id)}
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteGoal(goal.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {goal.current_value.toLocaleString('pt-BR')} / {goal.target_value.toLocaleString('pt-BR')} {goal.unit}
                      </span>
                      <span className="font-semibold text-primary">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {daysRemaining !== null && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {daysRemaining > 0
                          ? `${daysRemaining} dias restantes`
                          : daysRemaining === 0
                          ? 'Última dia!'
                          : `${Math.abs(daysRemaining)} dias atrasado`}
                      </span>
                      {goal.deadline && (
                        <span className="text-muted-foreground">
                          até {format(new Date(goal.deadline), "dd 'de' MMM", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
