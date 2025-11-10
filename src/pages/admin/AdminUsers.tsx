import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, UserCheck, UserX, Mail, Users, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AddUserModal from '@/components/admin/AddUserModal';
import EmailTestModal from '@/components/admin/EmailTestModal';

interface User {
  id: string;
  full_name: string;
  email: string;
  access_granted: boolean;
  subscription_status: string;
  created_at: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEmailTestModal, setShowEmailTestModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('🔍 Buscando usuários...');
      
      // Buscar apenas os dados do perfil, sem tentar acessar auth.users
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          access_granted,
          subscription_status,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar usuários:', error);
        throw error;
      }

      console.log('✅ Usuários encontrados:', data?.length || 0);

      // Usar os dados sem tentar buscar emails da tabela auth.users
      const usersData: User[] = (data || []).map(user => ({
        id: user.id,
        full_name: user.full_name || '',
        email: 'Email não disponível',
        access_granted: user.access_granted || false,
        subscription_status: user.subscription_status || 'inactive',
        created_at: user.created_at
      }));

      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserAccess = async (userId: string, currentAccess: boolean) => {
    try {
      console.log(`🔄 ${!currentAccess ? 'Concedendo' : 'Removendo'} acesso para usuário:`, userId);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          access_granted: !currentAccess,
          subscription_status: !currentAccess ? 'active' : 'inactive'
        })
        .eq('id', userId);

      if (error) throw error;

      // Log da atividade
      try {
        await supabase.rpc('log_activity', {
          _action: `user_access_${!currentAccess ? 'granted' : 'revoked'}`,
          _details: { target_user_id: userId }
        });
      } catch (logError) {
        console.error('⚠️ Erro ao registrar log:', logError);
      }

      setUsers(users.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              access_granted: !currentAccess,
              subscription_status: !currentAccess ? 'active' : 'inactive'
            }
          : user
      ));

      toast({
        title: 'Sucesso',
        description: `Acesso ${!currentAccess ? 'concedido' : 'removido'} com sucesso`,
      });

      console.log(`✅ Acesso ${!currentAccess ? 'concedido' : 'removido'} com sucesso`);
    } catch (error) {
      console.error('Error toggling user access:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o acesso do usuário',
        variant: 'destructive'
      });
    }
  };

  const handleUserAdded = () => {
    console.log('🔄 Recarregando lista de usuários após adição...');
    fetchUsers();
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-64"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">Controle de acesso e permissões dos usuários</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowEmailTestModal(true)}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Mail className="h-4 w-4 mr-2" />
            Testar Email
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="bg-lumi-success hover:bg-lumi-success/90">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Usuário
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Lista de todos os usuários cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">
                      {user.full_name || 'Nome não informado'}
                    </h3>
                    <Badge
                      variant={user.access_granted ? "default" : "secondary"}
                      className={user.access_granted ? "bg-lumi-success" : ""}
                    >
                      {user.access_granted ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{user.email || 'Email não disponível'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cadastrado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={user.access_granted ? "destructive" : "default"}
                    size="sm"
                    onClick={() => toggleUserAccess(user.id, user.access_granted)}
                    className={!user.access_granted ? "bg-lumi-success hover:bg-lumi-success/90" : ""}
                  >
                    {user.access_granted ? (
                      <>
                        <UserX className="h-4 w-4 mr-1" />
                        Remover Acesso
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-1" />
                        Conceder Acesso
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum usuário encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AddUserModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onUserAdded={handleUserAdded}
      />

      <EmailTestModal
        open={showEmailTestModal}
        onOpenChange={setShowEmailTestModal}
      />
    </div>
  );
};

export default AdminUsers;
