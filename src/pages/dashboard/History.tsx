
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UnifiedHistory } from '@/components/history/UnifiedHistory';
import { SalesModuleResults } from '@/components/sales/SalesModuleResults';
import { useSalesModules } from '@/hooks/useSalesModules';

interface HistoryItem {
  id: string;
  title: string;
  type: 'module' | 'chat';
  subtype?: string;
  created_at: string;
  data?: any;
}

const History = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(
    location.state?.selectedAsset ? {
      id: location.state.selectedAsset.id,
      title: location.state.selectedAsset.title,
      type: 'module' as const,
      subtype: location.state.selectedAsset.asset_type,
      created_at: location.state.selectedAsset.created_at,
      data: location.state.selectedAsset
    } : null
  );
  
  const { saveAsset } = useSalesModules();

  const handleViewResult = (item: HistoryItem) => {
    console.log('👁️ Visualizando item do histórico:', item);
    
    if (item.type === 'module') {
      setSelectedItem(item);
    } else if (item.type === 'chat') {
      // Redirecionar para o chat específico
      navigate('/app/chat', { state: { conversationId: item.id } });
    }
  };

  const handleBackToList = () => {
    setSelectedItem(null);
    // Limpar state da navegação
    navigate('/app/history', { replace: true });
  };

  const handleSendToChat = (prompt: string) => {
    navigate('/app/chat', { state: { prompt } });
  };

  const mockSaveAsset = async (assetData: any) => {
    console.log('💾 Asset já está salvo:', assetData);
  };

  const getResultsData = (item: HistoryItem) => {
    if (item.type !== 'module' || !item.data) {
      return null;
    }

    const asset = item.data;
    
    // Tentar extrair dados na ordem de prioridade
    if (asset.input_data?.result) {
      return asset.input_data.result;
    }

    if (asset.input_data && typeof asset.input_data === 'object') {
      return asset.input_data;
    }

    if (asset.content) {
      try {
        return JSON.parse(asset.content);
      } catch {
        return { content: asset.content, title: asset.title };
      }
    }

    return { content: 'Conteúdo não disponível', title: asset.title };
  };

  console.log('🏠 History Page - Estado:', {
    selectedItem: selectedItem?.id || 'Nenhum',
    locationState: location.state
  });

  return (
    <div className="w-full bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full px-4 sm:px-6 lg:max-w-7xl lg:mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => selectedItem ? handleBackToList() : navigate('/app')} 
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {selectedItem ? 'Voltar ao Histórico' : 'Voltar ao Dashboard'}
          </Button>

          {selectedItem ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Resultado Salvo</CardTitle>
                <p className="text-muted-foreground">
                  Visualizando: {selectedItem.title}
                </p>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const resultsData = getResultsData(selectedItem);
                    
                    if (!resultsData) {
                      return (
                        <div className="text-center py-8 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
                          <p className="text-muted-foreground">
                            Não foi possível carregar o conteúdo deste resultado.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <SalesModuleResults
                        moduleId={selectedItem.data?.module_used || 'generic'}
                        results={resultsData}
                        onSaveAsset={mockSaveAsset}
                        onSendToChat={handleSendToChat}
                      />
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Histórico</CardTitle>
                <p className="text-muted-foreground">
                  Todos os seus resultados e conversas organizados em um só lugar.
                </p>
              </CardHeader>
              
              <CardContent>
                <UnifiedHistory onViewResult={handleViewResult} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
