
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, History, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
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

export function RecentResultsWidget() {
  const [recentAssets, setRecentAssets] = useState<GeneratedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();
  const navigate = useNavigate();

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
    loadRecentAssets();
  }, [session]);

  const loadRecentAssets = async () => {
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('generated_assets')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentAssets(data || []);
    } catch (error) {
      console.error('Error loading recent assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResult = (asset: GeneratedAsset) => {
    navigate('/app/history', { state: { selectedAsset: asset } });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5" />
            Últimos Resultados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recentAssets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5" />
            Últimos Resultados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Nenhum resultado ainda. Use os módulos Lumi para começar!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="w-5 h-5" />
          Últimos Resultados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentAssets.map(asset => (
          <div
            key={asset.id}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm truncate">{asset.title}</h4>
                <Badge variant="outline" className="text-xs">
                  {moduleNames[asset.module_used] || asset.module_used}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(asset.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewResult(asset)}
              className="gap-1 flex-shrink-0"
            >
              <Eye className="w-3 h-3" />
              Ver
            </Button>
          </div>
        ))}
        
        <div className="pt-2">
          <Button
            variant="outline"
            className="w-full gap-1"
            onClick={() => navigate('/app/history')}
          >
            Ver Todo Histórico
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
