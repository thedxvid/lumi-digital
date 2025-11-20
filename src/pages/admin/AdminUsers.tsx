import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, UserCheck, UserX, Mail, Users, Plus, Shield, Settings, 
  Download, MoreVertical, Calendar, Eye, SlidersHorizontal 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AddUserModal from '@/components/admin/AddUserModal';
import EmailTestModal from '@/components/admin/EmailTestModal';
import { UserRolesManager } from '@/components/admin/UserRolesManager';
import { UserLimitsEditor } from '@/components/admin/UserLimitsEditor';
import { AdminStatsCards } from '@/components/admin/AdminStatsCards';
import { BulkActionsBar } from '@/components/admin/BulkActionsBar';
import { UserDetailsModal } from '@/components/admin/UserDetailsModal';
import { SubscriptionManager } from '@/components/admin/SubscriptionManager';
import { UsageBar } from '@/components/admin/UsageBar';
import { EmailProgressModal } from '@/components/admin/EmailProgressModal';
import { toast as sonnerToast } from 'sonner';

interface User {
  id: string;
  full_name: string;
  email: string;
  access_granted: boolean;
  subscription_status: string;
  created_at: string;
  last_sign_in_at?: string;
  roles?: string[];
  subscription?: {
    plan_type: string;
    end_date: string;
    is_active: boolean;
  };
  usage_limits?: {
    creative_images_monthly_used: number;
    creative_images_monthly_limit: number;
    videos_monthly_used: number;
    videos_monthly_limit: number;
  };
}

interface Filters {
  planType: string;
  accessStatus: string;
  role: string;
  subscriptionStatus: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEmailTestModal, setShowEmailTestModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [showLimitsEditor, setShowLimitsEditor] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
  const [selectedUserForLimits, setSelectedUserForLimits] = useState<{ id: string; name: string } | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>({
    planType: 'all',
    accessStatus: 'all',
    role: 'all',
    subscriptionStatus: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isResendingEmails, setIsResendingEmails] = useState(false);
  const { toast } = useToast();
  
  // Email progress modal states
  const [showEmailProgress, setShowEmailProgress] = useState(false);
  const [emailProgress, setEmailProgress] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    current: "",
    errors: [] as Array<{ email: string; error: string }>,
  });
  const [isEmailComplete, setIsEmailComplete] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('🔍 Buscando usuários...');
      
      // Buscar via function para ter acesso aos emails
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_admin_user_details');

      if (usersError) throw usersError;

      // Buscar subscriptions
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('is_active', true);

      // Buscar limites
      const { data: limits } = await supabase
        .from('usage_limits')
        .select('*');

      // Buscar roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Mapear roles por usuário
      const rolesMap = new Map<string, string[]>();
      rolesData?.forEach(role => {
        const userRoles = rolesMap.get(role.user_id) || [];
        userRoles.push(role.role);
        rolesMap.set(role.user_id, userRoles);
      });

      // Mapear subscriptions
      const subsMap = new Map();
      subscriptions?.forEach(sub => {
        subsMap.set(sub.user_id, sub);
      });

      // Mapear limites
      const limitsMap = new Map();
      limits?.forEach(limit => {
        limitsMap.set(limit.user_id, limit);
      });

      // Combinar dados
      const fullUsers: User[] = (usersData || []).map(user => ({
        id: user.id,
        full_name: user.full_name || '',
        email: user.email || 'Email não disponível',
        access_granted: user.access_granted || false,
        subscription_status: user.subscription_status || 'inactive',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        roles: rolesMap.get(user.id) || [],
        subscription: subsMap.get(user.id),
        usage_limits: limitsMap.get(user.id)
      }));

      setUsers(fullUsers);
      console.log('✅ Usuários carregados:', fullUsers.length);
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

  const handleManageRoles = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowRolesModal(true);
  };

  const handleEditLimits = (userId: string, userName: string) => {
    setSelectedUserForLimits({ id: userId, name: userName });
    setShowLimitsEditor(true);
  };

  const handleViewDetails = (userId: string) => {
    setSelectedUserId(userId);
    setShowDetailsModal(true);
  };

  const handleExtendSubscription = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowSubscriptionManager(true);
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleBulkActivate = async () => {
    console.log('🎯 handleBulkActivate chamado. Usuários selecionados:', selectedUsers);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ access_granted: true, subscription_status: 'active' })
        .in('id', selectedUsers);

      if (error) throw error;

      toast({ title: 'Sucesso', description: `${selectedUsers.length} usuários ativados` });
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error('❌ Erro ao ativar usuários:', error);
      toast({ title: 'Erro', description: 'Erro ao ativar usuários', variant: 'destructive' });
    }
  };

  const handleBulkDeactivate = async () => {
    console.log('🎯 handleBulkDeactivate chamado. Usuários selecionados:', selectedUsers);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ access_granted: false, subscription_status: 'inactive' })
        .in('id', selectedUsers);

      if (error) throw error;

      toast({ title: 'Sucesso', description: `${selectedUsers.length} usuários desativados` });
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error('❌ Erro ao desativar usuários:', error);
      toast({ title: 'Erro', description: 'Erro ao desativar usuários', variant: 'destructive' });
    }
  };

  const handleExport = () => {
    const csvData = filteredUsers.map(u => ({
      Nome: u.full_name,
      Email: u.email,
      Acesso: u.access_granted ? 'Ativo' : 'Inativo',
      Plano: u.subscription?.plan_type || 'free',
      'Data Cadastro': new Date(u.created_at).toLocaleDateString('pt-BR')
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const calculateStats = () => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      total: users.length,
      active: users.filter(u => u.access_granted).length,
      inactive: users.filter(u => !u.access_granted).length,
      byPlan: {
        free: users.filter(u => !u.subscription || u.subscription.plan_type === 'free').length,
        basic: users.filter(u => u.subscription?.plan_type === 'basic').length,
        pro: users.filter(u => u.subscription?.plan_type === 'pro').length
      },
      newThisMonth: users.filter(u => new Date(u.created_at) > oneMonthAgo).length,
      expiringThisWeek: users.filter(u => 
        u.subscription?.end_date && 
        new Date(u.subscription.end_date) <= oneWeekFromNow &&
        new Date(u.subscription.end_date) > now
      ).length
    };
  };

  const handleResendWelcomeEmails = async () => {
    if (!confirm('⚠️ Isso irá reenviar emails de boas-vindas para TODOS os usuários que não receberam. Novas senhas temporárias serão geradas. Deseja continuar?')) {
      return;
    }

    try {
      // Resetar e abrir modal de progresso
      setEmailProgress({
        total: 0,
        sent: 0,
        failed: 0,
        current: "",
        errors: [],
      });
      setIsEmailComplete(false);
      setIsResendingEmails(true);
      setShowEmailProgress(true);

      console.log('🚀 Iniciando envio de emails...');

      // Primeiro, buscar quantos emails precisam ser enviados
      const { data: pendingOrders, error: countError } = await supabase
        .from('orders')
        .select('customer_email, customer_name')
        .eq('order_status', 'paid')
        .or('credentials_sent.eq.false,credentials_sent.is.null')
        .not('user_id', 'is', null);

      if (countError) {
        throw countError;
      }

      const totalToSend = pendingOrders?.length || 0;
      
      setEmailProgress(prev => ({
        ...prev,
        total: totalToSend
      }));

      if (totalToSend === 0) {
        setIsEmailComplete(true);
        setIsResendingEmails(false);
        sonnerToast.info("Nenhum Email Pendente", {
          description: "Todos os usuários já receberam seus emails de acesso.",
          duration: 4000
        });
        return;
      }

      // Simular progresso para melhor UX
      const simulateProgress = setInterval(() => {
        setEmailProgress(prev => {
          if (prev.sent + prev.failed >= prev.total) {
            clearInterval(simulateProgress);
            return prev;
          }
          const nextIndex = prev.sent + prev.failed;
          return {
            ...prev,
            current: pendingOrders[nextIndex]?.customer_email || "",
          };
        });
      }, 300);

      // Chamar a função de envio
      const { data, error } = await supabase.functions.invoke('resend-welcome-emails', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      clearInterval(simulateProgress);

      if (error) throw error;

      const results = data.results;
      
      // Atualizar progresso final
      setEmailProgress({
        total: results.total,
        sent: results.success,
        failed: results.failed,
        current: "",
        errors: results.errors || [],
      });

      setIsEmailComplete(true);

      // Toast de resumo
      if (results.failed === 0) {
        sonnerToast.success("Envio Concluído!", {
          description: `Todos os ${results.success} emails foram enviados com sucesso.`,
          duration: 5000
        });
      } else {
        sonnerToast.warning("Envio Concluído com Avisos", {
          description: `${results.success} enviados, ${results.failed} falharam.`,
          duration: 5000
        });
      }

      // Recarregar dados
      fetchUsers();

    } catch (error: any) {
      console.error('❌ Erro ao reenviar emails:', error);
      setIsEmailComplete(true);
      
      sonnerToast.error("Erro ao Enviar Emails", {
        description: error.message || "Ocorreu um erro. Tente novamente.",
        duration: 5000
      });
    } finally {
      setIsResendingEmails(false);
    }
  };

  const handleRolesModalClose = () => {
    setShowRolesModal(false);
    setSelectedUserId(null);
    setSelectedUserName('');
    // Refresh users to show updated roles
    fetchUsers();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'moderator':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'user':
        return 'bg-gray-500 hover:bg-gray-600 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'moderator':
        return 'Moderador';
      case 'user':
        return 'Usuário';
      default:
        return role;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlan = filters.planType === 'all' || 
      (user.subscription?.plan_type === filters.planType || 
       (!user.subscription && filters.planType === 'free'));

    const matchesAccess = filters.accessStatus === 'all' ||
      (filters.accessStatus === 'active' && user.access_granted) ||
      (filters.accessStatus === 'inactive' && !user.access_granted);

    const matchesRole = filters.role === 'all' ||
      user.roles?.includes(filters.role);

    const matchesSubscription = filters.subscriptionStatus === 'all' ||
      (filters.subscriptionStatus === 'active' && user.subscription?.is_active) ||
      (filters.subscriptionStatus === 'expired' && !user.subscription?.is_active);

    return matchesSearch && matchesPlan && matchesAccess && matchesRole && matchesSubscription;
  });

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

  const stats = calculateStats();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">Controle completo de usuários e assinaturas</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowEmailTestModal(true)}
          >
            <Mail className="h-4 w-4 mr-2" />
            Testar Email
          </Button>
          <Button 
            variant="outline"
            onClick={handleResendWelcomeEmails}
            disabled={isResendingEmails}
          >
            <Mail className="h-4 w-4 mr-2" />
            {isResendingEmails ? 'Enviando...' : 'Reenviar Emails Pendentes'}
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Usuário
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <AdminStatsCards stats={stats} />

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Buscar e Filtrar</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium mb-2 block">Plano</label>
                <Select value={filters.planType} onValueChange={(v) => setFilters({...filters, planType: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Acesso</label>
                <Select value={filters.accessStatus} onValueChange={(v) => setFilters({...filters, accessStatus: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Role</label>
                <Select value={filters.role} onValueChange={(v) => setFilters({...filters, role: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderador</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Assinatura</label>
                <Select value={filters.subscriptionStatus} onValueChange={(v) => setFilters({...filters, subscriptionStatus: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="expired">Expirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuários ({filteredUsers.length})</CardTitle>
              <CardDescription>
                {selectedUsers.length > 0 && `${selectedUsers.length} selecionados`}
              </CardDescription>
            </div>
            <Checkbox
              checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
              onCheckedChange={toggleSelectAll}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={() => toggleSelectUser(user.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">
                      {user.full_name || 'Nome não informado'}
                    </h3>
                    <Badge
                      variant={user.access_granted ? "default" : "secondary"}
                    >
                      {user.access_granted ? 'Ativo' : 'Inativo'}
                    </Badge>
                    {user.subscription && (
                      <Badge variant="outline" className="capitalize">
                        {user.subscription.plan_type}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Mail className="h-3 w-3" />
                    <span>{user.email}</span>
                  </div>

                  {user.roles && user.roles.length > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-3 w-3 text-muted-foreground" />
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge
                            key={role}
                            className={getRoleBadgeColor(role)}
                            variant="secondary"
                          >
                            {getRoleLabel(role)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {user.usage_limits && (
                    <div className="mt-2 space-y-1">
                      <UsageBar
                        label="Imagens"
                        current={user.usage_limits.creative_images_monthly_used}
                        limit={user.usage_limits.creative_images_monthly_limit}
                      />
                      {user.usage_limits.videos_monthly_limit > 0 && (
                        <UsageBar
                          label="Vídeos"
                          current={user.usage_limits.videos_monthly_used}
                          limit={user.usage_limits.videos_monthly_limit}
                        />
                      )}
                    </div>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewDetails(user.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditLimits(user.id, user.full_name)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Editar Limites
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleManageRoles(user.id, user.full_name)}>
                      <Shield className="h-4 w-4 mr-2" />
                      Gerenciar Roles
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExtendSubscription(user.id, user.full_name)}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Gerenciar Plano
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => toggleUserAccess(user.id, user.access_granted)}
                      className={user.access_granted ? "text-destructive" : "text-green-600"}
                    >
                      {user.access_granted ? (
                        <>
                          <UserX className="h-4 w-4 mr-2" />
                          Desativar Acesso
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Ativar Acesso
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum usuário encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedUsers.length}
        onClearSelection={() => setSelectedUsers([])}
        onActivate={handleBulkActivate}
        onDeactivate={handleBulkDeactivate}
        onSendEmail={() => toast({ title: 'Em desenvolvimento' })}
        onExtendSubscription={() => toast({ title: 'Em desenvolvimento' })}
        onDelete={() => toast({ title: 'Em desenvolvimento' })}
      />

      {/* Modals */}
      <AddUserModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onUserAdded={handleUserAdded}
      />

      <EmailTestModal
        open={showEmailTestModal}
        onOpenChange={setShowEmailTestModal}
      />

      {selectedUserId && showRolesModal && (
        <UserRolesManager
          userId={selectedUserId}
          userName={selectedUserName}
          open={showRolesModal}
          onOpenChange={(open) => {
            setShowRolesModal(open);
            if (!open) fetchUsers();
          }}
        />
      )}

      {selectedUserForLimits && showLimitsEditor && (
        <UserLimitsEditor
          userId={selectedUserForLimits.id}
          userName={selectedUserForLimits.name}
          isOpen={showLimitsEditor}
          onClose={() => {
            setShowLimitsEditor(false);
            setSelectedUserForLimits(null);
          }}
          onSuccess={fetchUsers}
        />
      )}

      {selectedUserId && showDetailsModal && (
        <UserDetailsModal
          userId={selectedUserId}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUserId(null);
          }}
        />
      )}

      {selectedUserId && showSubscriptionManager && (
        <SubscriptionManager
          userId={selectedUserId}
          userName={selectedUserName}
          currentEndDate={users.find(u => u.id === selectedUserId)?.subscription?.end_date}
          isOpen={showSubscriptionManager}
          onClose={() => {
            setShowSubscriptionManager(false);
            setSelectedUserId(null);
          }}
          onSuccess={fetchUsers}
        />
      )}

      <EmailProgressModal
        open={showEmailProgress}
        onOpenChange={setShowEmailProgress}
        progress={emailProgress}
        isComplete={isEmailComplete}
        isLoading={isResendingEmails}
      />
    </div>
  );
};

export default AdminUsers;
