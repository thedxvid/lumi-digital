
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, ShoppingCart, DollarSign, Activity, AlertCircle, FileWarning, Shield, XCircle } from 'lucide-react';
import { AgentAnalytics } from '@/components/admin/AgentAnalytics';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  recentActivities: number;
}

interface UserToRevoke {
  id: string;
  email: string;
  full_name: string;
  access_granted: boolean;
  subscription_status: string;
  has_active_subscription: boolean;
}

interface DryRunReport {
  total_users_with_access: number;
  legitimate_buyers: number;
  users_to_revoke: number;
  users_to_revoke_list: UserToRevoke[];
  admin_users_protected: number;
  summary: string;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentActivities: 0
  });
  const [loading, setLoading] = useState(true);
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [report, setReport] = useState<DryRunReport | null>(null);
  const [showDryRun, setShowDryRun] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const runDryRun = async () => {
    setDryRunLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('revoke-unauthorized-access', {
        body: { dryRun: true }
      });

      if (error) throw error;

      setReport(data);
      setShowDryRun(true);
      
      toast({
        title: '✅ Dry-run executado',
        description: `${data.users_to_revoke} usuários serão afetados. Revise os detalhes abaixo.`,
      });
    } catch (error: any) {
      console.error('Error running dry-run:', error);
      toast({
        title: 'Erro ao executar dry-run',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDryRunLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      // Buscar total de usuários
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Buscar total de pedidos
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact' });

      // Buscar receita total (pedidos pagos)
      const { data: paidOrders } = await supabase
        .from('orders')
        .select('order_value')
        .eq('status', 'paid');

      const totalRevenue = paidOrders?.reduce((sum, order) => sum + Number(order.order_value), 0) || 0;

      // Buscar atividades recentes (últimos 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: activitiesCount } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact' })
        .gte('created_at', sevenDaysAgo.toISOString());

      setStats({
        totalUsers: usersCount || 0,
        totalOrders: ordersCount || 0,
        totalRevenue,
        recentActivities: activitiesCount || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-64"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total de Usuários',
      value: stats.totalUsers,
      description: 'Usuários registrados',
      icon: Users,
      color: 'text-lumi-blue'
    },
    {
      title: 'Total de Pedidos',
      value: stats.totalOrders,
      description: 'Pedidos processados',
      icon: ShoppingCart,
      color: 'text-lumi-purple'
    },
    {
      title: 'Receita Total',
      value: `R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      description: 'Vendas confirmadas',
      icon: DollarSign,
      color: 'text-lumi-success'
    },
    {
      title: 'Atividades Recentes',
      value: stats.recentActivities,
      description: 'Últimos 7 dias',
      icon: Activity,
      color: 'text-lumi-gold'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">Visão geral do sistema LUMI</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revoke Access Tool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-red-500" />
            Remoção de Acessos Não Autorizados - Black Friday
          </CardTitle>
          <CardDescription>
            Verificar e remover acessos de usuários que NÃO constam nas planilhas de vendas válidas da Black Friday
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>⚠️ Atenção - Ação Crítica</AlertTitle>
            <AlertDescription>
              Esta ferramenta identificará todos os usuários que têm acesso mas NÃO estão nas planilhas de vendas válidas.
              Execute o dry-run primeiro para verificar quem será afetado.
            </AlertDescription>
          </Alert>

          <Button
            onClick={runDryRun}
            disabled={dryRunLoading}
            size="lg"
            className="w-full"
            variant="destructive"
          >
            {dryRunLoading ? '🔍 Analisando...' : '🔍 Executar Dry-Run (Simulação)'}
          </Button>

          {showDryRun && report && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      Total com Acesso
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{report.total_users_with_access}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" />
                      Compradores Legítimos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{report.legitimate_buyers}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      A Remover
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{report.users_to_revoke}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4 text-yellow-500" />
                      Admins Protegidos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{report.admin_users_protected}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">
                    ⚠️ Usuários que PERDERÃO acesso ({report.users_to_revoke})
                  </CardTitle>
                  <CardDescription>
                    Estes usuários têm acesso mas NÃO constam nas planilhas de vendas válidas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {report.users_to_revoke_list.length === 0 ? (
                    <Alert>
                      <AlertTitle>✅ Nenhum usuário a remover</AlertTitle>
                      <AlertDescription>
                        Todos os usuários com acesso estão nas planilhas de vendas válidas!
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="rounded-md border max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Subscription</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.users_to_revoke_list.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.full_name}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <Badge variant={user.access_granted ? 'default' : 'secondary'}>
                                  {user.access_granted ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={user.has_active_subscription ? 'default' : 'outline'}>
                                  {user.subscription_status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Alert>
                <AlertTitle>📋 Resumo</AlertTitle>
                <AlertDescription className="whitespace-pre-wrap font-mono text-xs">
                  {report.summary}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Analytics */}
      <AgentAnalytics />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>
            Últimas ações realizadas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Logs de atividade serão mostrados aqui</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
