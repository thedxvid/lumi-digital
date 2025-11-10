
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, AlertCircle, Loader2, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLumiStore } from '@/hooks/useLumiStore';
import { toast } from 'sonner';
import { HistoryItemViewer } from './HistoryItemViewer';

interface HistoryItem {
  id: string;
  title: string;
  type: 'module' | 'chat';
  subtype?: string;
  created_at: string;
  data?: any;
}

interface UnifiedHistoryProps {
  onViewResult: (item: HistoryItem) => void;
}

export function UnifiedHistory({ onViewResult }: UnifiedHistoryProps) {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  useEffect(() => {
    loadHistory();
  }, [session, conversations]);

  const loadHistory = async () => {
    console.log('🔄 Carregando histórico unificado...');
    setLoading(true);
    setError(null);

    try {
      const items: HistoryItem[] = [];

      // Carregar módulos do Supabase
      if (session?.user?.id) {
        console.log('📊 Carregando assets do usuário:', session.user.id);
        
        const { data: assets, error: assetsError } = await supabase
          .from('generated_assets')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (assetsError) {
          console.error('❌ Erro ao carregar assets:', assetsError);
          setError(`Erro ao carregar módulos: ${assetsError.message}`);
        } else {
          console.log('✅ Assets carregados:', assets?.length || 0);
          
          assets?.forEach(asset => {
            items.push({
              id: asset.id,
              title: asset.title,
              type: 'module',
              subtype: asset.asset_type,
              created_at: asset.created_at,
              data: asset
            });
          });
        }
      }

      // Adicionar conversas da Lumi
      console.log('💬 Adicionando conversas da Lumi:', conversations.length);
      conversations.forEach((conv) => {
        items.push({
          id: conv.id,
          title: conv.title,
          type: 'chat',
          subtype: 'lumi',
          created_at: new Date(conv.createdAt).toISOString(),
          data: conv
        });
      });

      // Ordenar por data
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log('📋 Resumo do histórico:', {
        total: items.length,
        modules: items.filter(i => i.type === 'module').length,
        chats: items.filter(i => i.type === 'chat').length
      });
      
      setHistoryItems(items);
      
    } catch (error) {
      console.error('❌ Erro geral ao carregar histórico:', error);
      setError('Erro inesperado ao carregar histórico');
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (itemId: string) => {
    const item = historyItems.find(i => i.id === itemId);
    if (!item || item.type !== 'module') return;

    try {
      const { error } = await supabase
        .from('generated_assets')
        .update({ is_favorite: !item.data?.is_favorite })
        .eq('id', itemId);

      if (error) throw error;

      // Update local state
      setHistoryItems(prev => prev.map(i => 
        i.id === itemId && i.type === 'module'
          ? { ...i, data: { ...i.data, is_favorite: !i.data?.is_favorite } }
          : i
      ));

      toast.success(item.data?.is_favorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Erro ao atualizar favorito');
    }
  };

  const filteredItems = historyItems.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.type === 'chat' && item.data?.messages?.some((msg: any) => 
        msg.content.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    
    const matchesType = filterType === 'all' || item.type === filterType;
    
    const matchesModule = filterModule === 'all' || 
                         (item.type === 'module' && item.data?.module_used === filterModule);
    
    const matchesFavorites = !showFavoritesOnly || 
                            (item.type === 'module' && item.data?.is_favorite);
    
    return matchesSearch && matchesType && matchesModule && matchesFavorites;
  });

  const uniqueModules = [...new Set(
    historyItems
      .filter(item => item.type === 'module')
      .map(item => item.data?.module_used)
      .filter(Boolean)
  )];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando histórico...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Erro ao carregar histórico</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button 
          onClick={loadHistory}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar no histórico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={showFavoritesOnly ? 'default' : 'outline'}
            size="icon"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            title="Mostrar apenas favoritos"
            className="flex-shrink-0"
          >
            <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
          </Button>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="flex-1 sm:w-[150px]">
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
              <SelectTrigger className="flex-1 sm:w-[200px]">
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
      </div>

      {/* Lista de itens */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {historyItems.length === 0 ? 'Nenhum histórico encontrado' : 'Nenhum resultado para os filtros'}
          </h3>
          <p className="text-muted-foreground">
            {historyItems.length === 0 
              ? 'Seus resultados aparecerão aqui após usar os módulos ou chat.'
              : 'Tente ajustar os filtros para encontrar o que procura.'
            }
          </p>
          
          {/* Debug info para quando não há dados */}
          {historyItems.length === 0 && (
            <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg max-w-md mx-auto">
              <div className="space-y-1">
                <p>🔍 Debug Info:</p>
                <p>Sessão: {session ? '✅' : '❌'}</p>
                <p>Conversas locais: {conversations.length}</p>
                <p>Usuário: {session?.user?.email || 'N/A'}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map(item => (
            <HistoryItemViewer
              key={item.id}
              item={item}
              onViewDetails={onViewResult}
              onToggleFavorite={item.type === 'module' ? () => toggleFavorite(item.id) : undefined}
              isFavorite={item.type === 'module' ? item.data?.is_favorite : false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
