
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, Clock, ArrowRight } from 'lucide-react';
import { ModuleHistoryModal } from './ModuleHistoryModal';
import { useNavigate } from 'react-router-dom';

interface GeneratedAsset {
  id: string;
  title: string;
  content: string;
  asset_type: string;
  module_used: string;
  created_at: string;
  input_data?: any;
}

interface HistoryQuickAccessProps {
  moduleId: string;
  moduleName: string;
  onReuseInputs: (inputData: any) => void;
}

export function HistoryQuickAccess({ moduleId, moduleName, onReuseInputs }: HistoryQuickAccessProps) {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const navigate = useNavigate();

  const handleViewResult = (asset: GeneratedAsset) => {
    setShowHistoryModal(false);
    // Navegar para o histórico com o resultado selecionado
    navigate('/app/history', { state: { selectedAsset: asset } });
  };

  const handleViewAllHistory = () => {
    navigate('/app/history', { state: { filterModule: moduleId } });
  };

  return (
    <>
      <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Resultados Anteriores
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-3">
            Acesse seus resultados anteriores deste módulo ou reutilize dados de entrada.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistoryModal(true)}
              className="gap-1"
            >
              <History className="w-3 h-3" />
              Ver Últimos Resultados
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewAllHistory}
              className="gap-1"
            >
              Ver Todo Histórico
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <ModuleHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        moduleId={moduleId}
        moduleName={moduleName}
        onViewResult={handleViewResult}
        onReuseInputs={onReuseInputs}
      />
    </>
  );
}
