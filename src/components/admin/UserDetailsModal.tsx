import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, Crown, BarChart3, Shield, History, Lock } from 'lucide-react';
import { UsageBar } from './UsageBar';
import { UserLimitsEditor } from './UserLimitsEditor';
import { UserRolesManager } from './UserRolesManager';
import { VideoLimitsDebug } from './VideoLimitsDebug';

interface UserDetailsModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface UserDetails {
  id: string;
  full_name: string;
  email: string;
  access_granted: boolean;
  subscription_status: string;
  created_at: string;
  last_sign_in_at?: string;
  subscription?: any;
  usage_limits?: any;
  roles?: string[];
}

export const UserDetailsModal = ({ userId, isOpen, onClose }: UserDetailsModalProps) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [showLimitsEditor, setShowLimitsEditor] = useState(false);
  const [showRolesManager, setShowRolesManager] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      // Buscar detalhes via function
      const { data: adminDetails, error: detailsError } = await supabase
        .rpc('get_admin_user_details');

      if (detailsError) throw detailsError;

      const userDetail = adminDetails?.find((u: any) => u.id === userId);

      // Buscar subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      // Buscar limites
      const { data: limits } = await supabase
        .from('usage_limits')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Buscar roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      setUser({
        ...userDetail,
        subscription,
        usage_limits: limits,
        roles: roles?.map(r => r.role) || []
      });
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user && !loading) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Detalhes do Usuário
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : user ? (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="info">
                  <User className="h-4 w-4 mr-2" />
                  Info
                </TabsTrigger>
                <TabsTrigger value="subscription">
                  <Crown className="h-4 w-4 mr-2" />
                  Plano
                </TabsTrigger>
                <TabsTrigger value="usage">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Uso
                </TabsTrigger>
                <TabsTrigger value="roles">
                  <Shield className="h-4 w-4 mr-2" />
                  Roles
                </TabsTrigger>
                <TabsTrigger value="history">
                  <History className="h-4 w-4 mr-2" />
                  Histórico
                </TabsTrigger>
                <TabsTrigger value="security">
                  <Lock className="h-4 w-4 mr-2" />
                  Segurança
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nome</p>
                        <p className="font-medium">{user.full_name || 'Não informado'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge variant={user.access_granted ? "default" : "secondary"}>
                          {user.access_granted ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cadastro</p>
                        <p className="font-medium">
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      {user.last_sign_in_at && (
                        <div>
                          <p className="text-sm text-muted-foreground">Último Login</p>
                          <p className="font-medium">
                            {new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="subscription" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    {user.subscription ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Plano Atual</p>
                            <p className="text-2xl font-bold capitalize">{user.subscription.plan_type}</p>
                          </div>
                          <Badge variant={user.subscription.is_active ? "default" : "secondary"}>
                            {user.subscription.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Data Início</p>
                            <p className="font-medium">
                              {new Date(user.subscription.start_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Data Fim</p>
                            <p className="font-medium">
                              {new Date(user.subscription.end_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Duração</p>
                            <p className="font-medium">{user.subscription.duration_months} meses</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nenhuma assinatura ativa</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="usage" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Limites de Uso</h3>
                      <Button
                        size="sm"
                        onClick={() => setShowLimitsEditor(true)}
                      >
                        Editar Limites
                      </Button>
                    </div>
                    {user.usage_limits ? (
                      <div className="space-y-4">
                        <UsageBar
                          label="Imagens Criativas (Diário)"
                          current={user.usage_limits.creative_images_daily_used}
                          limit={user.usage_limits.creative_images_daily_limit}
                          type="daily"
                        />
                        <UsageBar
                          label="Imagens Criativas (Mensal)"
                          current={user.usage_limits.creative_images_monthly_used}
                          limit={user.usage_limits.creative_images_monthly_limit}
                          type="monthly"
                        />
                        <UsageBar
                          label="Análise de Perfil (Diário)"
                          current={user.usage_limits.profile_analysis_daily_used}
                          limit={user.usage_limits.profile_analysis_daily_limit}
                          type="daily"
                        />
                        <UsageBar
                          label="Carrosséis (Mensal)"
                          current={user.usage_limits.carousels_monthly_used}
                          limit={user.usage_limits.carousels_monthly_limit}
                          type="monthly"
                        />
                        <UsageBar
                          label="Vídeos (Mensal)"
                          current={user.usage_limits.videos_monthly_used}
                          limit={user.usage_limits.videos_monthly_limit}
                          type="monthly"
                        />
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Limites não configurados</p>
                    )}
                  </CardContent>
                </Card>
                
                {user.usage_limits && (
                  <VideoLimitsDebug limits={user.usage_limits} />
                )}
              </TabsContent>

              <TabsContent value="roles" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Roles do Usuário</h3>
                      <Button
                        size="sm"
                        onClick={() => setShowRolesManager(true)}
                      >
                        Gerenciar Roles
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map(role => (
                          <Badge key={role} variant="secondary">
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground">Nenhuma role atribuída</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground text-center py-8">
                      Histórico de atividades em desenvolvimento
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground text-center py-8">
                      Opções de segurança em desenvolvimento
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : null}
        </DialogContent>
      </Dialog>

      {showLimitsEditor && user && (
        <UserLimitsEditor
          userId={user.id}
          userName={user.full_name}
          isOpen={showLimitsEditor}
          onClose={() => setShowLimitsEditor(false)}
          onSuccess={() => {
            fetchUserDetails();
            setShowLimitsEditor(false);
          }}
        />
      )}

      {showRolesManager && user && (
        <UserRolesManager
          userId={user.id}
          userName={user.full_name}
          open={showRolesManager}
          onOpenChange={(open) => {
            setShowRolesManager(open);
            if (!open) {
              fetchUserDetails();
            }
          }}
        />
      )}
    </>
  );
};
