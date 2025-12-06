import { Wallet, TrendingUp, Info, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBYOKCosts } from '@/hooks/useBYOKCosts';
import { formatCostUSD } from '@/config/falPricing';
import { useNavigate } from 'react-router-dom';

interface BYOKCostIndicatorProps {
  estimatedCost: number;
  featureType: 'image' | 'carousel' | 'video';
  model?: string;
  slideCount?: number;
  compact?: boolean;
}

export const BYOKCostIndicator = ({ 
  estimatedCost, 
  featureType,
  model,
  slideCount,
  compact = false
}: BYOKCostIndicatorProps) => {
  const { hasBYOK, costs, isLoading } = useBYOKCosts();
  const navigate = useNavigate();

  // Não mostrar se usuário não tem BYOK
  if (!hasBYOK) return null;

  const featureLabels = {
    image: 'imagem',
    carousel: slideCount ? `carrossel (${slideCount} slides)` : 'carrossel',
    video: 'vídeo',
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1 cursor-help border-amber-500/50 text-amber-600 dark:text-amber-400">
              <Wallet className="h-3 w-3" />
              ~{formatCostUSD(estimatedCost)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium">Custo estimado: {formatCostUSD(estimatedCost)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Será debitado da sua conta Fal.ai
            </p>
            <div className="mt-2 pt-2 border-t text-xs">
              <p>Hoje: {formatCostUSD(costs.today)}</p>
              <p>Este mês: {formatCostUSD(costs.month)}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className="p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-amber-500/20">
            <Wallet className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">BYOK Ativo</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Você está usando sua própria chave Fal.ai. 
                      Os custos serão debitados diretamente da sua conta.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-muted-foreground">
              Esta {featureLabels[featureType]}: <span className="font-semibold text-amber-600 dark:text-amber-400">~{formatCostUSD(estimatedCost)}</span>
              {model && <span className="ml-1 opacity-70">({model})</span>}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>Hoje</span>
          </div>
          <p className="text-sm font-semibold">
            {isLoading ? '...' : formatCostUSD(costs.today)}
          </p>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center justify-between text-xs">
        <div className="flex gap-3 text-muted-foreground">
          <span>Semana: {formatCostUSD(costs.week)}</span>
          <span>Mês: {formatCostUSD(costs.month)}</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2 text-xs gap-1"
          onClick={() => navigate('/app/settings')}
        >
          Ver histórico
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
};
