import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, ArrowLeft, FileSpreadsheet, Shield, Users, XCircle, Upload, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface UserToRevoke {
  id: string;
  email: string;
  full_name: string;
  subscription_status: string;
  created_at: string;
}

interface ParsedUser {
  email: string;
  name: string;
  status: string;
  offer: string;
  date: string;
}

interface DryRunReport {
  spreadsheet?: {
    totalRows: number;
    validPaidEmails: number;
    parsedUsers: ParsedUser[];
  };
  system: {
    totalUsersWithAccess: number;
    totalAdmins: number;
    usersToRevoke: UserToRevoke[];
  };
  summary: {
    legitimateBuyers: number;
    currentUsersWithAccess: number;
    usersToRevoke: number;
    adminsProtected: number;
  };
}

const RevokeAccessDryRun = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [report, setReport] = useState<DryRunReport | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({
          title: 'Arquivo inválido',
          description: 'Por favor, selecione um arquivo Excel (.xlsx ou .xls)',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      setReport(null);
      toast({
        title: '✅ Arquivo selecionado',
        description: file.name,
      });
    }
  };

  const processSpreadsheet = async () => {
    if (!selectedFile) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione uma planilha primeiro',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const { data, error } = await supabase.functions.invoke('process-blackfriday-spreadsheet', {
        body: formData,
      });

      if (error) {
        throw new Error(error.message || 'Erro ao processar planilha');
      }

      setReport(data);
      
      toast({
        title: '✅ Planilha processada',
        description: `${data.summary.usersToRevoke} usuários identificados para remoção`,
      });
    } catch (error: any) {
      console.error('Error processing spreadsheet:', error);
      toast({
        title: 'Erro ao processar planilha',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const executeRevocation = async () => {
    if (!report || report.summary.usersToRevoke === 0) {
      toast({
        title: 'Nenhuma ação necessária',
        description: 'Não há usuários para remover.',
      });
      return;
    }

    const confirmed = window.confirm(
      `⚠️ ATENÇÃO! Esta ação irá remover o acesso de ${report.summary.usersToRevoke} usuários.\n\nEsta ação NÃO pode ser desfeita automaticamente.\n\nDeseja continuar?`
    );

    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      `🚨 CONFIRMAÇÃO FINAL\n\nVocê está prestes a remover permanentemente o acesso de ${report.summary.usersToRevoke} usuários.\n\nClique em OK para prosseguir.`
    );

    if (!doubleConfirm) return;

    setExecuting(true);
    try {
      const userIds = report.system.usersToRevoke.map(u => u.id);

      const { data, error } = await supabase.functions.invoke('revoke-unauthorized-access', {
        body: { 
          dryRun: false,
          execute: true,
          userIds
        }
      });

      if (error) throw error;

      toast({
        title: '✅ Remoção executada',
        description: `${report.summary.usersToRevoke} acessos removidos com sucesso`,
      });
      
      setReport(null);
      setSelectedFile(null);
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
          <h1 className="text-3xl font-bold">Cruzamento de Dados - Black Friday</h1>
          <p className="text-muted-foreground">
            Processar planilha de vendas e remover acessos não autorizados
          </p>
        </div>
      </div>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>⚠️ Atenção - Ação Crítica</AlertTitle>
        <AlertDescription>
          Esta ferramenta remove permanentemente o acesso de usuários que NÃO estão na planilha de vendas. Use com extrema cautela.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload da Planilha de Vendas
          </CardTitle>
          <CardDescription>
            Faça upload do arquivo Excel com as vendas legítimas para identificar usuários não autorizados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-6">
            <div className="flex flex-col items-center gap-4">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <h3 className="font-semibold mb-2">Selecione a Planilha Excel</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Arquivo .xlsx ou .xls com as vendas da Black Friday (coluna "Status" = "paid")
                </p>
              </div>
              
              <div className="flex items-center gap-4 w-full justify-center">
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={loading || executing}
                  className="max-w-xs"
                />
                {selectedFile && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    {selectedFile.name}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button 
            onClick={processSpreadsheet} 
            disabled={!selectedFile || loading || executing}
            size="lg"
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {loading ? 'Processando Planilha...' : 'Analisar Planilha e Cruzar Dados'}
          </Button>

          {report && report.summary.usersToRevoke > 0 && (
            <Button
              onClick={executeRevocation}
              disabled={loading || executing}
              size="lg"
              className="w-full"
              variant="destructive"
            >
              {executing ? '⚙️ Executando Remoção...' : `🚨 Executar Remoção (${report.summary.usersToRevoke} usuários)`}
            </Button>
          )}
        </CardContent>
      </Card>

      {report && (
        <>
          {report.spreadsheet && (
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertTitle>📊 Dados da Planilha</AlertTitle>
              <AlertDescription className="space-y-2">
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="font-semibold">Total de Linhas:</p>
                    <p className="text-2xl">{report.spreadsheet.totalRows}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-green-600">✅ Vendas Pagas:</p>
                    <p className="text-2xl text-green-600">{report.spreadsheet.validPaidEmails}</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Total com Acesso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.summary.currentUsersWithAccess}</div>
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
                <div className="text-2xl font-bold text-green-600">{report.summary.legitimateBuyers}</div>
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
                <div className="text-2xl font-bold text-red-600">{report.summary.usersToRevoke}</div>
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
                <div className="text-2xl font-bold text-yellow-600">{report.summary.adminsProtected}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">
                ⚠️ Usuários que PERDERÃO acesso ({report.summary.usersToRevoke})
              </CardTitle>
              <CardDescription>
                Estes usuários têm acesso mas NÃO constam na planilha de vendas legítimas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report.system.usersToRevoke.length === 0 ? (
                <Alert>
                  <AlertTitle>✅ Nenhum usuário a remover</AlertTitle>
                  <AlertDescription>
                    Todos os usuários com acesso estão na planilha de vendas!
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
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.system.usersToRevoke.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.subscription_status}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default RevokeAccessDryRun;
