import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast as sonnerToast } from 'sonner';
import { Key, Search, RefreshCw, CheckCircle, XCircle, Clock, Video, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserApiKey {
  id: string;
  user_id: string;
  provider: string;
  is_active: boolean;
  is_valid: boolean | null;
  last_validated_at: string | null;
  credits_used_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  user_email?: string;
  user_name?: string;
}

interface BYOKStats {
  totalKeys: number;
  validKeys: number;
  invalidKeys: number;
  pendingKeys: number;
  totalVideosGenerated: number;
  activeUsers: number;
}

export default function AdminApiKeys() {
  const [apiKeys, setApiKeys] = useState<UserApiKey[]>([]);
  const [stats, setStats] = useState<BYOKStats>({
    totalKeys: 0,
    validKeys: 0,
    invalidKeys: 0,
    pendingKeys: 0,
    totalVideosGenerated: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [validatingId, setValidatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    setLoading(true);
    try {
      // Fetch all user API keys
      const { data: keysData, error: keysError } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('provider', 'fal_ai')
        .order('created_at', { ascending: false });

      if (keysError) throw keysError;

      // Get user details for each key
      const keysWithUsers: UserApiKey[] = [];
      
      if (keysData && keysData.length > 0) {
        // Get all user IDs
        const userIds = keysData.map(k => k.user_id);
        
        // Fetch profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        // Fetch admin user details for emails
        const { data: adminUsers } = await supabase.rpc('get_admin_user_details');

        for (const key of keysData) {
          const profile = profiles?.find(p => p.id === key.user_id);
          const adminUser = adminUsers?.find((u: any) => u.id === key.user_id);
          
          keysWithUsers.push({
            ...key,
            user_name: profile?.full_name || 'N/A',
            user_email: adminUser?.email || 'N/A'
          });
        }
      }

      setApiKeys(keysWithUsers);

      // Calculate stats
      const validKeys = keysWithUsers.filter(k => k.is_valid === true).length;
      const invalidKeys = keysWithUsers.filter(k => k.is_valid === false).length;
      const pendingKeys = keysWithUsers.filter(k => k.is_valid === null).length;
      const totalVideos = keysWithUsers.reduce((sum, k) => sum + (k.credits_used_count || 0), 0);
      const activeUsers = new Set(keysWithUsers.filter(k => k.is_active).map(k => k.user_id)).size;

      setStats({
        totalKeys: keysWithUsers.length,
        validKeys,
        invalidKeys,
        pendingKeys,
        totalVideosGenerated: totalVideos,
        activeUsers
      });

    } catch (error) {
      console.error('Error fetching API keys:', error);
      sonnerToast.error('Erro ao carregar chaves BYOK');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateKey = async (userId: string) => {
    setValidatingId(userId);
    sonnerToast.loading('Validando chave...', { id: 'validate-key' });

    try {
      const { data, error } = await supabase.functions.invoke('validate-user-api-key', {
        body: { provider: 'fal_ai', admin_user_id: userId }
      });

      if (error) throw error;

      if (data.valid) {
        sonnerToast.success('Chave Válida!', {
          id: 'validate-key',
          description: 'A chave Fal.ai foi validada com sucesso',
          duration: 5000
        });
      } else {
        sonnerToast.error('Chave Inválida', {
          id: 'validate-key',
          description: data.error || 'A chave não passou na validação',
          duration: 5000
        });
      }

      fetchApiKeys();
    } catch (error: any) {
      console.error('Error validating key:', error);
      sonnerToast.error('Erro ao Validar', {
        id: 'validate-key',
        description: error.message || 'Não foi possível validar a chave',
        duration: 5000
      });
    } finally {
      setValidatingId(null);
    }
  };

  const getStatusBadge = (isValid: boolean | null, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" /> Desativada</Badge>;
    }
    if (isValid === true) {
      return <Badge className="bg-green-500/20 text-green-400 gap-1"><CheckCircle className="h-3 w-3" /> Válida</Badge>;
    }
    if (isValid === false) {
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Inválida</Badge>;
    }
    return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>;
  };

  const filteredKeys = apiKeys.filter(key => {
    const search = searchTerm.toLowerCase();
    return (
      key.user_email?.toLowerCase().includes(search) ||
      key.user_name?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Key className="h-6 w-6 text-primary" />
            Chaves BYOK (Fal.ai)
          </h1>
          <p className="text-muted-foreground">Gerencie chaves de API próprias dos usuários</p>
        </div>
        <Button onClick={fetchApiKeys} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalKeys}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Válidas</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{stats.validKeys}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Inválidas</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{stats.invalidKeys}</p>
          </CardContent>
        </Card>
        <Card 
          className={stats.pendingKeys > 0 ? 'border-yellow-500/50 bg-yellow-500/5 cursor-pointer hover:bg-yellow-500/10 transition-colors' : ''}
          onClick={() => stats.pendingKeys > 0 && setSearchTerm('')}
        >
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Pendentes</span>
            </div>
            <p className="text-2xl font-bold text-yellow-500">{stats.pendingKeys}</p>
            {stats.pendingKeys > 0 && (
              <p className="text-xs text-yellow-600 mt-1">Clique para ver</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Vídeos</span>
            </div>
            <p className="text-2xl font-bold text-blue-500">{stats.totalVideosGenerated}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Ativos</span>
            </div>
            <p className="text-2xl font-bold text-purple-500">{stats.activeUsers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert for pending keys */}
      {stats.pendingKeys > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {stats.pendingKeys} chave(s) pendente(s) de validação
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Essas chaves foram conectadas mas ainda não passaram pela validação. 
                  Use o botão "Validar" ao lado de cada chave para verificá-las.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 gap-2 border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10"
                  onClick={async () => {
                    const pendingKeys = apiKeys.filter(k => k.is_valid === null);
                    sonnerToast.loading(`Validando ${pendingKeys.length} chave(s)...`, { id: 'bulk-validate' });
                    
                    let successCount = 0;
                    for (const key of pendingKeys) {
                      try {
                        const { data } = await supabase.functions.invoke('validate-user-api-key', {
                          body: { provider: 'fal_ai', admin_user_id: key.user_id }
                        });
                        if (data?.valid) successCount++;
                      } catch (e) {
                        console.error('Error validating key:', e);
                      }
                    }
                    
                    sonnerToast.success(`${successCount}/${pendingKeys.length} chaves validadas!`, { 
                      id: 'bulk-validate',
                      duration: 5000
                    });
                    fetchApiKeys();
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Validar Todas Pendentes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      {stats.totalKeys === 0 && !loading && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground">Nenhuma chave BYOK conectada</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Ainda não há usuários que conectaram suas próprias chaves Fal.ai. 
                  Usuários podem conectar em Configurações → Integrações → Fal.ai API Key.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keys Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Chaves Conectadas</CardTitle>
              <CardDescription>Lista de usuários com chaves Fal.ai próprias</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhuma chave encontrada para esta busca' : 'Nenhuma chave BYOK conectada ainda'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Vídeos</TableHead>
                    <TableHead>Conectada em</TableHead>
                    <TableHead>Última Validação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.user_name}</TableCell>
                      <TableCell className="text-muted-foreground">{key.user_email}</TableCell>
                      <TableCell>{getStatusBadge(key.is_valid, key.is_active)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="gap-1">
                          <Video className="h-3 w-3" />
                          {key.credits_used_count || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(key.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {key.last_validated_at 
                          ? format(new Date(key.last_validated_at), "dd/MM/yy HH:mm", { locale: ptBR })
                          : 'Nunca'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleValidateKey(key.user_id)}
                          disabled={validatingId === key.user_id}
                          className="gap-1"
                        >
                          {validatingId === key.user_id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          Validar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
