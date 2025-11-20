import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { NotificationSettings } from './NotificationSettings';
import { PurchaseHistory } from './PurchaseHistory';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

export function SettingsContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos de senha',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A nova senha deve ter pelo menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Senha alterada com sucesso',
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao alterar senha',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Perfil */}
      <Card>
        <CardHeader>
          <CardTitle>Perfil do Usuário</CardTitle>
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
                placeholder="Usuário"
                defaultValue="Usuário"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                value={user?.email || ''} 
                disabled 
                className="bg-muted"
              />
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Alterar Senha</h4>
            
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha Atual</Label>
              <div className="relative">
                <Input 
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <div className="relative">
                <Input 
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input 
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              onClick={handlePasswordChange}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notificações - Componente completo */}
      <NotificationSettings />

      {/* Histórico de Compras */}
      <PurchaseHistory />

      {/* Aparência */}
      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>
            Personalize a interface do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Modo escuro</Label>
              <p className="text-sm text-muted-foreground">
                Alternar entre tema claro e escuro
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Conta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>
            Ações irreversíveis da conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">
            Excluir Conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
