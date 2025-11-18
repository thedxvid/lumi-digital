
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Bell, 
  Palette, 
  Database, 
  Shield, 
  Trash2,
  Download,
  Upload
} from 'lucide-react';
import { useLumiStore } from '@/hooks/useLumiStore';

const DashboardSettings = () => {
  const { conversations, settings, updateSettings } = useLumiStore();
  const [profile, setProfile] = useState({
    name: 'Usuário',
    email: 'usuario@email.com'
  });

  const handleExportData = () => {
    const data = {
      conversations,
      settings,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumi-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearAllData = () => {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="w-full min-h-screen overflow-y-auto px-4 sm:px-6 space-y-6 max-w-4xl mx-auto py-6 sm:py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Configurações ⚙️
        </h1>
        <p className="text-muted-foreground">
          Personalize sua experiência com a LUMI
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil do Usuário
          </CardTitle>
          <CardDescription>
            Gerencie suas informações pessoais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                placeholder="seu@email.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha Atual</Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="Digite sua senha atual"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Digite sua nova senha"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirme sua nova senha"
            />
          </div>
          <Button>Alterar Senha</Button>
        </CardContent>
      </Card>

      {/* Interface Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Preferências da Interface
          </CardTitle>
          <CardDescription>
            Customize a aparência da aplicação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sidebar Aberta por Padrão</Label>
              <p className="text-sm text-muted-foreground">
                Manter a barra lateral sempre visível
              </p>
            </div>
            <Switch
              checked={settings.sidebarOpen}
              onCheckedChange={(checked) => updateSettings({ sidebarOpen: checked })}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Tema Escuro</Label>
              <p className="text-sm text-muted-foreground">
                Alternar entre tema claro e escuro
              </p>
            </div>
            <Switch disabled />
            <Badge variant="secondary" className="ml-2">Em breve</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>
            Configure como você quer ser notificado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificações no navegador
              </p>
            </div>
            <Switch disabled />
            <Badge variant="secondary" className="ml-2">Em breve</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas de Email</Label>
              <p className="text-sm text-muted-foreground">
                Receber updates importantes por email
              </p>
            </div>
            <Switch disabled />
            <Badge variant="secondary" className="ml-2">Em breve</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Gerenciamento de Dados
          </CardTitle>
          <CardDescription>
            Controle seus dados e conversas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-border rounded-lg">
              <p className="text-2xl font-bold text-foreground">{conversations.length}</p>
              <p className="text-sm text-muted-foreground">Conversas Salvas</p>
            </div>
            <div className="text-center p-4 border border-border rounded-lg">
              <p className="text-2xl font-bold text-foreground">
                {conversations.reduce((acc, conv) => acc + conv.messages.length, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Mensagens Totais</p>
            </div>
            <div className="text-center p-4 border border-border rounded-lg">
              <p className="text-2xl font-bold text-foreground">
                {Math.round(JSON.stringify({ conversations, settings }).length / 1024)}KB
              </p>
              <p className="text-sm text-muted-foreground">Dados Armazenados</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Dados
            </Button>
            <Button variant="outline" disabled>
              <Upload className="mr-2 h-4 w-4" />
              Importar Dados
              <Badge variant="secondary" className="ml-2">Em breve</Badge>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacidade e Segurança
          </CardTitle>
          <CardDescription>
            Mantenha seus dados seguros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-foreground mb-2">
              Armazenamento Local
            </h4>
            <p className="text-sm text-muted-foreground">
              Todos os seus dados são armazenados localmente no seu navegador. 
              A LUMI não tem acesso aos seus dados pessoais ou conversas.
            </p>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-destructive">Zona de Perigo</Label>
              <p className="text-sm text-muted-foreground">
                Ações irreversíveis que afetam seus dados
              </p>
            </div>
          </div>
          
          <Button 
            variant="destructive" 
            onClick={handleClearAllData}
            className="w-full"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar Todos os Dados
          </Button>
        </CardContent>
      </Card>

      {/* Footer */}
      <Card className="bg-gradient-to-r from-lumi-gold/10 to-lumi-gold-dark/10 border-lumi-gold/20">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Precisa de Ajuda?
            </h3>
            <p className="text-muted-foreground mb-4">
              Nossa equipe está sempre pronta para ajudar você
            </p>
            <Button variant="outline" disabled>
              Contatar Suporte
              <Badge variant="secondary" className="ml-2">Em breve</Badge>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSettings;
