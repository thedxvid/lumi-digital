import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, ArrowLeft, FileWarning, Shield, Users, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

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

const RevokeAccessDryRun = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [report, setReport] = useState<DryRunReport | null>(null);

  const runDryRun = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('revoke-unauthorized-access', {
        body: { dryRun: true, execute: false }
      });

      if (error) throw error;

      setReport(data);
      
      toast({
        title: '✅ Análise concluída',
        description: `${data.users_to_revoke} usuários serão afetados. Revise os detalhes abaixo.`,
      });
    } catch (error: any) {
      console.error('Error running analysis:', error);
      toast({
        title: 'Erro ao executar análise',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const executeRevocation = async () => {
    if (!report || report.users_to_revoke === 0) {
      toast({
        title: 'Nenhuma ação necessária',
        description: 'Não há usuários para remover.',
      });
      return;
    }

    const confirmed = window.confirm(
      `⚠️ ATENÇÃO! Esta ação irá remover o acesso de ${report.users_to_revoke} usuários.\n\nEsta ação NÃO pode ser desfeita automaticamente.\n\nDeseja continuar?`
    );

    if (!confirmed) return;

    setExecuting(true);
    try {
      const { data, error } = await supabase.functions.invoke('revoke-unauthorized-access', {
        body: { dryRun: false, execute: true }
      });

      if (error) throw error;

      setReport(data);
      
      toast({
        title: '✅ Remoção executada com sucesso',
        description: `${data.users_to_revoke} usuários tiveram seus acessos removidos.`,
      });
    } catch (error: any) {
      console.error('Error executing revocation:', error);
      toast({
        title: 'Erro ao executar remoção',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Remoção de Acessos Não Autorizados</h1>
          <p className="text-muted-foreground">
            Verificar e remover acessos de usuários que não constam nas planilhas da Black Friday
          </p>
        </div>
      </div>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>⚠️ Atenção - Ação Crítica</AlertTitle>
        <AlertDescription>
          Esta ferramenta identificará e removerá o acesso de todos os usuários que NÃO estão nas planilhas de vendas válidas da Black Friday.
          Revise cuidadosamente a lista antes de executar a remoção.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileWarning className="h-5 w-5" />
            Análise e Remoção de Acessos
          </CardTitle>
          <CardDescription>
            Identifique quais usuários NÃO estão nas planilhas válidas e execute a remoção dos acessos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={runDryRun}
            disabled={loading || executing}
            size="lg"
            className="w-full"
            variant="outline"
          >
            {loading ? '🔍 Analisando...' : '🔍 Analisar Usuários'}
          </Button>

          {report && report.users_to_revoke > 0 && (
            <Button
              onClick={executeRevocation}
              disabled={loading || executing}
              size="lg"
              className="w-full"
              variant="destructive"
            >
              {executing ? '⚙️ Executando Remoção...' : `🚨 Executar Remoção (${report.users_to_revoke} usuários)`}
            </Button>
          )}
        </CardContent>
      </Card>

      {report && (
        <>
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
                Estes usuários têm acesso atualmente mas NÃO constam nas planilhas de vendas válidas da Black Friday
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
                <div className="rounded-md border">
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
        </>
      )}
    </div>
  );
};

export default RevokeAccessDryRun;
