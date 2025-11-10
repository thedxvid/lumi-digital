
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Search, MessageSquare, FileText, Calendar, Bot, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLumiStore } from '@/hooks/useLumiStore';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GeneratedAsset {
  id: string;
  title: string;
  content: string;
  asset_type: string;
  module_used: string;
  created_at: string;
  input_data?: any;
}

interface HistoryItem {
  id: string;
  title: string;
  content: string;
  type: 'module' | 'chat';
  subtype?: string;
  created_at: string;
  data?: any;
}

interface ResultsHistoryProps {
  onViewResult: (asset: GeneratedAsset) => void;
}

export function ResultsHistory({ onViewResult }: ResultsHistoryProps) {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterModule, setFilterModule] = useState<string>('all');
  const { session } = useAuth();
  const { conversations } = useLumiStore();

  const moduleNames: Record<string, string> = {
    'lead-diagnosis': 'Diagnóstico de Leads',
    'lead-capture': 'Captação de Leads',
    'objection-breaking': 'Quebra de Objeções',
    'remarketing': 'Remarketing',
    'launch-plan': 'Plano de Lançamento',
    'sales-routine': 'Rotina de Vendas',
    'mindset': 'Mindset',
    'infoproduct-generator': 'Criação de Infoprodutos',
    'pesquisa-publico': 'Pesquisa de Público'
  };

  const assetTypeNames: Record<string, string> = {
    'copy': 'Copy/Texto',
    'script': 'Script',
    'email': 'Email',
    'post_social': 'Post Social',
    'sequencia': 'Sequência',
    'roteiro': 'Roteiro'
  };

  useEffect(() => {
    loadAllHistory();
  }, [session, conversations]);

  const loadAllHistory = async () => {
    console.log('🔍 Iniciando carregamento do histórico...');
    setLoading(true);
    
    try {
      const items: HistoryItem[] = [];

      // Carregar módulos gerados
      if (session?.user?.id) {
        console.log('🔄 Buscando assets gerados para o usuário:', session.user.id);
        
        const { data: assets, error } = await supabase
          .from('generated_assets')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Erro ao carregar assets:', error);
          toast.error('Erro ao carregar histórico de módulos: ' + error.message);
        } else {
          console.log('✅ Assets carregados com sucesso:', assets?.length || 0);
          
          assets?.forEach(asset => {
            items.push({
              id: asset.id,
              title: asset.title,
              content: getContentPreview(asset),
              type: 'module',
              subtype: asset.asset_type,
              created_at: asset.created_at,
              data: asset
            });
          });
        }
      } else {
        console.log('⚠️ Usuário não autenticado, pulando busca de assets');
      }

      // Adicionar conversas da Lumi
      console.log('💬 Processando conversas da Lumi:', conversations.length);
      conversations.forEach((conv) => {
        const firstMessageContent = conv.messages.length > 0 
          ? conv.messages[0].content 
          : 'Conversa sem mensagens';
        
        items.push({
          id: conv.id,
          title: conv.title,
          content: firstMessageContent,
          type: 'chat',
          subtype: 'lumi',
          created_at: new Date(conv.createdAt).toISOString(),
          data: conv
        });
      });

      // Ordenar por data (mais recentes primeiro)
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log('📊 Resumo final:', {
        totalItems: items.length,
        modules: items.filter(i => i.type === 'module').length,
        chats: items.filter(i => i.type === 'chat').length
      });
      
      setHistoryItems(items);
      
    } catch (error) {
      console.error('❌ Erro geral ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  // Função para gerar preview do conteúdo de forma mais inteligente
  const getContentPreview = (asset: GeneratedAsset): string => {
    // Tentar extrair uma preview útil baseada no tipo de módulo
    if (asset.input_data?.result) {
      const result = asset.input_data.result;
      
      // Para diagnóstico de leads
      if (result.diagnosis) {
        return result.diagnosis;
      }
      
      // Para quebra de objeções
      if (result.response) {
        return result.response;
      }
      
      // Para rotina de vendas
      if (result.routine && Array.isArray(result.routine)) {
        const taskCount = result.routine.length;
        return `Rotina com ${taskCount} tarefas (${result.totalTime || 'tempo não definido'})`;
      }
      
      // Para pesquisa de público
      if (result.target_audience) {
        return result.target_audience;
      }
      
      // Para mindset
      if (result.message) {
        return result.message;
      }
    }

    // Se input_data tem dados diretos
    if (asset.input_data && typeof asset.input_data === 'object') {
      if (asset.input_data.diagnosis) return asset.input_data.diagnosis;
      if (asset.input_data.response) return asset.input_data.response;
      if (asset.input_data.target_audience) return asset.input_data.target_audience;
      if (asset.input_data.message) return asset.input_data.message;
    }

    // Tentar fazer parse do content
    try {
      const parsed = JSON.parse(asset.content);
      if (parsed.diagnosis) return parsed.diagnosis;
      if (parsed.response) return parsed.response;
      if (parsed.routine) return `Rotina com ${parsed.routine.length} tarefas`;
    } catch {
      // Se não for JSON, usar o content direto
    }

    // Fallback para content simples
    return asset.content || 'Conteúdo não disponível';
  };

  const filteredItems = historyItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || item.type === filterType;
    
    const matchesModule = filterModule === 'all' || 
                         (item.type === 'module' && item.data?.module_used === filterModule);
    
    return matchesSearch && matchesType && matchesModule;
  });

  const uniqueModules = [...new Set(
    historyItems
      .filter(item => item.type === 'module')
      .map(item => item.data?.module_used)
      .filter(Boolean)
  )];

  const handleViewItem = (item: HistoryItem) => {
    console.log('👁️ Visualizando item:', item);
    
    if (item.type === 'module') {
      onViewResult(item.data as GeneratedAsset);
    } else if (item.type === 'chat') {
      toast.info('Redirecionando para a conversa...');
      // Implementar navegação para chat específico
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar no histórico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="module">Módulos</SelectItem>
            <SelectItem value="chat">Chats</SelectItem>
          </SelectContent>
        </Select>

        {(filterType === 'all' || filterType === 'module') && uniqueModules.length > 0 && (
          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Módulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os módulos</SelectItem>
              {uniqueModules.map(module => (
                <SelectItem key={module} value={module}>
                  {moduleNames[module] || module}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {historyItems.length === 0 ? 'Nenhum histórico ainda' : 'Nenhum resultado encontrado'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {historyItems.length === 0 
              ? 'Seus resultados e conversas aparecerão aqui após usar os módulos Lumi ou chat.'
              : 'Tente ajustar os filtros para encontrar o que procura.'
            }
          </p>
          
          {/* Status de debug */}
          {historyItems.length === 0 && (
            <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 justify-center mb-2">
                <AlertCircle className="w-4 h-4" />
                <span>Status do Sistema</span>
              </div>
              <p>Sessão: {session ? '✅ Ativo' : '❌ Inativo'}</p>
              <p>Conversas locais: {conversations.length}</p>
              <p>Usuário: {session?.user?.email || 'Não identificado'}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map(item => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {item.type === 'chat' ? (
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                      ) : (
                        <FileText className="w-4 h-4 text-green-500" />
                      )}
                      <CardTitle className="text-base truncate">{item.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(item.created_at), "dd 'de' MMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.type === 'chat' ? (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Bot className="w-3 h-3" />
                        Chat Lumi
                      </Badge>
                    ) : (
                      <>
                        <Badge variant="outline" className="text-xs">
                          {assetTypeNames[item.subtype!] || item.subtype}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {moduleNames[item.data?.module_used] || item.data?.module_used}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                    {item.content.length > 150 
                      ? `${item.content.substring(0, 150)}...` 
                      : item.content
                    }
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewItem(item)}
                    className="ml-4 gap-1 flex-shrink-0"
                  >
                    <Eye className="w-3 h-3" />
                    Ver {item.type === 'chat' ? 'Chat' : 'Resultado'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
