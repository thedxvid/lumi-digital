
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Copy, RotateCcw, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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

interface ModuleHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  moduleName: string;
  onViewResult: (asset: GeneratedAsset) => void;
  onReuseInputs: (inputData: any) => void;
}

export function ModuleHistoryModal({
  isOpen,
  onClose,
  moduleId,
  moduleName,
  onViewResult,
  onReuseInputs
}: ModuleHistoryModalProps) {
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    if (isOpen && moduleId) {
      loadModuleHistory();
    }
  }, [isOpen, moduleId, session]);

  const loadModuleHistory = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('generated_assets')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('module_used', moduleId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error loading module history:', error);
      toast.error('Erro ao carregar histórico do módulo');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Conteúdo copiado!');
    } catch (error) {
      toast.error('Erro ao copiar conteúdo');
    }
  };

  const handleReuseInputs = (asset: GeneratedAsset) => {
    if (asset.input_data) {
      onReuseInputs(asset.input_data);
      onClose();
      toast.success('Dados preenchidos no formulário!');
    } else {
      toast.error('Não há dados de entrada salvos para este resultado');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Histórico - {moduleName}
          </DialogTitle>
          <p className="text-muted-foreground">
            Últimos resultados gerados com este módulo
          </p>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Carregando histórico...</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhum resultado encontrado para este módulo ainda.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assets.map(asset => (
              <Card key={asset.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{asset.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(asset.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {asset.asset_type}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {asset.content.length > 120 
                      ? `${asset.content.substring(0, 120)}...` 
                      : asset.content
                    }
                  </p>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewResult(asset)}
                      className="gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Ver Completo
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyContent(asset.content)}
                      className="gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copiar
                    </Button>
                    
                    {asset.input_data && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReuseInputs(asset)}
                        className="gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reutilizar Dados
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
