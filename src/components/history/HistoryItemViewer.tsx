
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, MessageSquare, Download, Copy, Star } from 'lucide-react';
import { formatAssetContent } from '@/utils/historyDataFormatter';
import { toast } from 'sonner';

interface HistoryItem {
  id: string;
  title: string;
  type: 'module' | 'chat';
  subtype?: string;
  created_at: string;
  data?: any;
}

interface HistoryItemViewerProps {
  item: HistoryItem;
  onViewDetails: (item: HistoryItem) => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  className?: string;
}

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

export function HistoryItemViewer({ 
  item, 
  onViewDetails, 
  onToggleFavorite,
  isFavorite = false,
  className = "" 
}: HistoryItemViewerProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  };

  const getPreviewContent = () => {
    if (item.type === 'chat') {
      return item.data?.messages?.[0]?.content || 'Conversa com Lumi';
    }

    if (item.type === 'module' && item.data) {
      try {
        const formatted = formatAssetContent(item.data);
        return formatted.preview;
      } catch (error) {
        console.error('Erro ao formatar preview:', error);
        return 'Erro ao carregar preview';
      }
    }

    return 'Conteúdo não disponível';
  };

  const handleCopyContent = () => {
    try {
      const content = getPreviewContent();
      navigator.clipboard.writeText(content);
      toast.success('Conteúdo copiado!');
    } catch (error) {
      toast.error('Erro ao copiar conteúdo');
    }
  };

  const previewContent = getPreviewContent();
  const truncatedPreview = previewContent.length > 150 
    ? `${previewContent.substring(0, 150)}...` 
    : previewContent;

  return (
    <Card className={`hover:shadow-md transition-shadow overflow-hidden ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base truncate flex-1 break-words line-clamp-1">{item.title}</CardTitle>
              {onToggleFavorite && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite();
                  }}
                  className="shrink-0 h-8 w-8 p-0"
                >
                  <Star 
                    className={`w-4 h-4 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} 
                  />
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDate(item.created_at)}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 flex-shrink-0 ml-2 sm:ml-4">
            {item.type === 'chat' ? (
              <Badge variant="secondary" className="text-xs gap-1">
                <MessageSquare className="w-3 h-3" />
                Chat
              </Badge>
            ) : (
              <>
                {item.subtype && (
                  <Badge variant="outline" className="text-xs">
                    {assetTypeNames[item.subtype] || item.subtype}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  {moduleNames[item.data?.module_used] || item.data?.module_used}
                </Badge>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 break-words">
          {truncatedPreview}
        </p>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(item)}
              className="gap-1"
            >
              <Eye className="w-3 h-3" />
              Ver Detalhes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyContent}
              className="gap-1"
            >
              <Copy className="w-3 h-3" />
              Copiar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
