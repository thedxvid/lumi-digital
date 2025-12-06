import { Wallet, TrendingUp, Info, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBYOKCosts } from '@/hooks/useBYOKCosts';
import { useNavigate } from 'react-router-dom';

// Taxa de câmbio USD -> BRL (pode ser atualizada conforme necessário)
const USD_TO_BRL = 6.0;

const formatBRL = (costUSD: number): string => {
  const costBRL = costUSD * USD_TO_BRL;
  if (costBRL < 0.01) return `R$ ${costBRL.toFixed(4).replace('.', ',')}`;
  if (costBRL < 1) return `R$ ${costBRL.toFixed(2).replace('.', ',')}`;
  return `R$ ${costBRL.toFixed(2).replace('.', ',')}`;
};

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
              ~{formatBRL(estimatedCost)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium">Custo estimado: {formatBRL(estimatedCost)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Será debitado da sua conta pessoal
            </p>
            <div className="mt-2 pt-2 border-t text-xs">
              <p>Hoje: {formatBRL(costs.today)}</p>
              <p>Este mês: {formatBRL(costs.month)}</p>
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
              <span className="text-sm font-medium">Sua Chave API</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Você está usando sua própria chave de API. 
                      Os custos serão debitados diretamente da sua conta.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-muted-foreground">
              Esta {featureLabels[featureType]}: <span className="font-semibold text-amber-600 dark:text-amber-400">~{formatBRL(estimatedCost)}</span>
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
            {isLoading ? '...' : formatBRL(costs.today)}
          </p>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center justify-between text-xs">
        <div className="flex gap-3 text-muted-foreground">
          <span>Semana: {formatBRL(costs.week)}</span>
          <span>Mês: {formatBRL(costs.month)}</span>
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