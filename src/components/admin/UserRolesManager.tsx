import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Loader2, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserRolesManagerProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AppRole = 'admin' | 'moderator' | 'user';

interface UserRole {
  id: string;
  role: AppRole;
  created_at: string;
}

export function UserRolesManager({ userId, userName, open, onOpenChange }: UserRolesManagerProps) {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');
  const { toast } = useToast();

  const availableRoles: AppRole[] = ['admin', 'moderator', 'user'];

  useEffect(() => {
    if (open) {
      fetchRoles();
    }
  }, [open, userId]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as roles do usuário',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addRole = async () => {
    if (!selectedRole) return;

    // Check if role already exists
    if (roles.some(r => r.role === selectedRole)) {
      toast({
        title: 'Aviso',
        description: 'Este usuário já possui essa role',
        variant: 'default',
      });
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: selectedRole,
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Role "${selectedRole}" adicionada com sucesso`,
      });

      await fetchRoles();
    } catch (error: any) {
      console.error('Error adding role:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível adicionar a role',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const removeRole = async (roleId: string, roleName: AppRole) => {
    if (roleName === 'admin' && roles.filter(r => r.role === 'admin').length === 1) {
      // Prevent removing the last admin role
      const { data: adminCount } = await supabase
        .from('user_roles')
        .select('id', { count: 'exact' })
        .eq('role', 'admin');

      if ((adminCount?.length || 0) <= 1) {
        toast({
          title: 'Aviso',
          description: 'Não é possível remover a última role de admin do sistema',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Role "${roleName}" removida com sucesso`,
      });

      await fetchRoles();
    } catch (error: any) {
      console.error('Error removing role:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível remover a role',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeColor = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500 hover:bg-red-600';
      case 'moderator':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'user':
        return 'bg-gray-500 hover:bg-gray-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'moderator':
        return 'Moderador';
      case 'user':
        return 'Usuário';
      default:
        return role;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gerenciar Roles de {userName}
          </DialogTitle>
          <DialogDescription>
            Adicione ou remova roles para controlar as permissões do usuário
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Roles */}
          <div>
            <h3 className="text-sm font-medium mb-3">Roles Atuais</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : roles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <Badge
                    key={role.id}
                    className={`${getRoleBadgeColor(role.role)} text-white`}
                  >
                    <span className="mr-2">{getRoleLabel(role.role)}</span>
                    <button
                      onClick={() => removeRole(role.id, role.role)}
                      className="hover:bg-black/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Este usuário não possui nenhuma role atribuída
              </p>
            )}
          </div>

          {/* Add New Role */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Adicionar Nova Role</h3>
            <div className="flex gap-2">
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione uma role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {getRoleLabel(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={addRole}
                disabled={adding || !selectedRole}
                className="bg-lumi-success hover:bg-lumi-success/90"
              >
                {adding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Role Descriptions */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-xs">
            <p className="font-medium text-foreground">Descrição das Roles:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li><strong>Admin:</strong> Acesso total ao sistema, pode gerenciar usuários e roles</li>
              <li><strong>Moderador:</strong> Pode moderar conteúdo e interagir com usuários</li>
              <li><strong>Usuário:</strong> Acesso padrão às funcionalidades do sistema</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
