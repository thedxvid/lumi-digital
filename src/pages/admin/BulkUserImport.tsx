import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, Users, Filter } from 'lucide-react';
import { parseExcelFile, mapOfferToPlan, downloadCSV, type ImportedUser, type ParsedData } from '@/utils/excelParser';

export default function BulkUserImport() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'waiting' | 'refused'>('paid');
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [defaultDuration, setDefaultDuration] = useState<1 | 3 | 6>(3);
  const [results, setResults] = useState<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione um arquivo Excel (.xlsx ou .xls)',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    setLoading(true);

    try {
      const data = await parseExcelFile(selectedFile);
      setParsedData(data);
      toast({
        title: 'Arquivo processado',
        description: `${data.users.length} usuários encontrados`,
      });
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: 'Erro ao processar',
        description: 'Não foi possível ler o arquivo Excel',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredUsers = () => {
    if (!parsedData) return [];
    
    let filtered = parsedData.users;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => u.status === filterStatus);
    }
    
    if (removeDuplicates) {
      const seen = new Set<string>();
      filtered = filtered.filter(u => {
        if (seen.has(u.email)) return false;
        seen.add(u.email);
        return true;
      });
    }
    
    return filtered;
  };

  const processUsers = async () => {
    const usersToProcess = getFilteredUsers();
    
    if (usersToProcess.length === 0) {
      toast({
        title: 'Nenhum usuário',
        description: 'Não há usuários para processar com os filtros selecionados',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    setProgress(0);

    const processResults = {
      total: usersToProcess.length,
      created: 0,
      failed: 0,
      emailsSent: 0,
      emailsFailed: 0,
      details: [] as any[],
    };

    for (let i = 0; i < usersToProcess.length; i++) {
      const user = usersToProcess[i];
      const planConfig = mapOfferToPlan(user.offer, user.value);
      
      try {
        const { data, error } = await supabase.functions.invoke('create-multiple-users', {
          body: {
            users: [{
              email: user.email,
              fullName: user.name,
            }],
            planType: planConfig.planType,
            durationMonths: planConfig.durationMonths,
          },
        });

        if (error) throw error;

        const result = data?.results?.[0];
        
        if (result?.success) {
          processResults.created++;
          if (result.emailSent) processResults.emailsSent++;
          else processResults.emailsFailed++;
          
          processResults.details.push({
            email: user.email,
            nome: user.name,
            status: 'Criado',
            plano: `Basic - ${planConfig.durationMonths} meses`,
            senha: result.temporaryPassword,
            emailEnviado: result.emailSent ? 'Sim' : 'Não',
          });
        } else {
          throw new Error(result?.error || 'Erro desconhecido');
        }
      } catch (error: any) {
        processResults.failed++;
        processResults.details.push({
          email: user.email,
          nome: user.name,
          status: 'Erro',
          erro: error.message,
        });
      }

      setProgress(((i + 1) / usersToProcess.length) * 100);
      
      // Delay para evitar rate limiting
      if (i < usersToProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setResults(processResults);
    setProcessing(false);

    toast({
      title: 'Processamento concluído',
      description: `${processResults.created} usuários criados, ${processResults.failed} falharam`,
    });
  };

  const downloadReport = () => {
    if (!results) return;
    downloadCSV(results.details, `relatorio-importacao-${Date.now()}`);
  };

  const filteredUsers = getFilteredUsers();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Importação em Lote</h1>
        <p className="text-muted-foreground">Importe usuários via Excel e crie contas automaticamente</p>
      </div>

      {/* Upload Section */}
      {!parsedData && (
        <Card>
          <CardHeader>
            <CardTitle>Upload de Arquivo</CardTitle>
            <CardDescription>Selecione um arquivo Excel (.xlsx ou .xls) com os dados dos usuários</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={loading}
                className="max-w-md mx-auto"
              />
              <p className="text-sm text-muted-foreground mt-4">
                Arraste um arquivo ou clique para selecionar
              </p>
            </div>
            {loading && (
              <div className="mt-4">
                <Progress value={50} className="w-full" />
                <p className="text-sm text-center mt-2 text-muted-foreground">Processando arquivo...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Section */}
      {parsedData && !results && (
        <div className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{parsedData.stats.total}</div>
                <p className="text-sm text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{parsedData.stats.paid}</div>
                <p className="text-sm text-muted-foreground">Pagos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">{parsedData.stats.waiting}</div>
                <p className="text-sm text-muted-foreground">Aguardando</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{parsedData.stats.refused}</div>
                <p className="text-sm text-muted-foreground">Recusados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{filteredUsers.length}</div>
                <p className="text-sm text-muted-foreground">A Processar</p>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          {parsedData.duplicates.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {parsedData.duplicates.length} emails duplicados encontrados
              </AlertDescription>
            </Alert>
          )}

          {parsedData.invalidEmails.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {parsedData.invalidEmails.length} emails inválidos encontrados
              </AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros e Configurações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="paid">Apenas Pagos</SelectItem>
                      <SelectItem value="waiting">Aguardando</SelectItem>
                      <SelectItem value="refused">Recusados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Duração Padrão</label>
                  <Select value={defaultDuration.toString()} onValueChange={(v) => setDefaultDuration(parseInt(v) as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 mês</SelectItem>
                      <SelectItem value="3">3 meses</SelectItem>
                      <SelectItem value="6">6 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="duplicates"
                      checked={removeDuplicates}
                      onCheckedChange={(checked) => setRemoveDuplicates(checked as boolean)}
                    />
                    <label htmlFor="duplicates" className="text-sm font-medium">
                      Remover duplicados
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Preview ({filteredUsers.length} usuários)
                </span>
                <Button onClick={() => setParsedData(null)} variant="outline" size="sm">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Novo Arquivo
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Oferta</TableHead>
                      <TableHead>Plano</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.slice(0, 50).map((user, index) => {
                      const plan = mapOfferToPlan(user.offer, user.value);
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.status === 'paid' ? 'default' : 'secondary'}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{user.offer}</TableCell>
                          <TableCell className="text-sm">Basic - {plan.durationMonths}m</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {filteredUsers.length > 50 && (
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Mostrando 50 de {filteredUsers.length} usuários
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Process Button */}
          <div className="flex justify-end gap-4">
            <Button onClick={processUsers} disabled={processing || filteredUsers.length === 0} size="lg">
              {processing ? 'Processando...' : `Processar ${filteredUsers.length} Usuários`}
            </Button>
          </div>

          {/* Progress */}
          {processing && (
            <Card>
              <CardContent className="pt-6">
                <Progress value={progress} className="w-full mb-2" />
                <p className="text-sm text-center text-muted-foreground">
                  Processando... {Math.round(progress)}%
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Results Section */}
      {results && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Processamento Concluído
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{results.total}</div>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{results.created}</div>
                  <p className="text-sm text-muted-foreground">Criados</p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{results.failed}</div>
                  <p className="text-sm text-muted-foreground">Falharam</p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{results.emailsSent}</div>
                  <p className="text-sm text-muted-foreground">Emails Enviados</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={downloadReport} variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Relatório Completo
                </Button>
                <Button onClick={() => { setResults(null); setParsedData(null); }} className="w-full">
                  Nova Importação
                </Button>
              </div>

              {/* Details Table */}
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Email Enviado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.details.map((detail: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{detail.email}</TableCell>
                        <TableCell>{detail.nome}</TableCell>
                        <TableCell>
                          <Badge variant={detail.status === 'Criado' ? 'default' : 'destructive'}>
                            {detail.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{detail.plano || '-'}</TableCell>
                        <TableCell>{detail.emailEnviado || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
