import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings, Database, Mail, Shield, Save } from 'lucide-react';
import { toast } from 'sonner';

const AdminSettings = () => {
  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <p className="text-muted-foreground">Gerencie configurações globais da plataforma</p>
        </div>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Sistema */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle>Sistema</CardTitle>
            </div>
            <CardDescription>Configurações gerais do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label className="text-base">Modo de Manutenção</Label>
                <p className="text-sm text-muted-foreground">Desabilitar acesso de usuários temporariamente</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label className="text-base">Permitir Novos Registros</Label>
                <p className="text-sm text-muted-foreground">Habilitar criação de novas contas</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label className="text-base">Logs Detalhados</Label>
                <p className="text-sm text-muted-foreground">Registrar todas as ações do sistema</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Limites Padrão */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Limites Padrão para Novos Usuários</CardTitle>
            </div>
            <CardDescription>Definir limites iniciais automáticos para plano Free</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Imagens Diárias (Free)</Label>
                <Input type="number" defaultValue={0} min={0} />
              </div>
              <div className="space-y-2">
                <Label>Imagens Mensais (Free)</Label>
                <Input type="number" defaultValue={0} min={0} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Análises Diárias (Free)</Label>
                <Input type="number" defaultValue={0} min={0} />
              </div>
              <div className="space-y-2">
                <Label>Carousels Mensais (Free)</Label>
                <Input type="number" defaultValue={0} min={0} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Vídeos Mensais (Free)</Label>
              <Input type="number" defaultValue={0} min={0} />
            </div>
          </CardContent>
        </Card>

        {/* Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>Configurações de Email</CardTitle>
            </div>
            <CardDescription>Gerenciar notificações e templates de email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email de Envio Padrão</Label>
              <Input type="email" placeholder="noreply@lumi.app" defaultValue="noreply@lumi.app" />
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label className="text-base">Notificações de Boas-vindas</Label>
                <p className="text-sm text-muted-foreground">Enviar email ao criar nova conta</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label className="text-base">Alertas de Limite</Label>
                <p className="text-sm text-muted-foreground">Notificar usuários quando atingirem 80% dos limites</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Segurança</CardTitle>
            </div>
            <CardDescription>Configurações de segurança e controle de acesso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label className="text-base">Autenticação de Dois Fatores</Label>
                <p className="text-sm text-muted-foreground">Obrigatório para administradores</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Tempo de Expiração de Sessão (minutos)</Label>
              <Input type="number" defaultValue={60} min={5} max={1440} />
              <p className="text-xs text-muted-foreground">Tempo até o logout automático por inatividade</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Máximo de Tentativas de Login</Label>
              <Input type="number" defaultValue={5} min={3} max={10} />
              <p className="text-xs text-muted-foreground">Bloquear conta após X tentativas incorretas</p>
            </div>
          </CardContent>
        </Card>

        {/* Botão de Salvar */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="lg">
            Restaurar Padrões
          </Button>
          <Button size="lg" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Todas as Configurações
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
