import { AlertCircle, XCircle, Shield, Wifi, CreditCard, RefreshCw, ExternalLink, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export type ErrorType = 'limit' | 'balance' | 'policy' | 'network' | 'unknown';

interface GenerationErrorCardProps {
  errorType: ErrorType;
  errorMessage?: string;
  featureType: 'video' | 'creative';
  hasByok?: boolean;
  onRetry?: () => void;
  onClose?: () => void;
}

const errorConfig = {
  limit: {
    icon: CreditCard,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    title: 'Limite Atingido',
    defaultMessage: 'Você atingiu o limite de uso para esta funcionalidade.'
  },
  balance: {
    icon: AlertCircle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    title: 'Saldo Esgotado',
    defaultMessage: 'O saldo disponível para geração foi esgotado.'
  },
  policy: {
    icon: Shield,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    title: 'Conteúdo Bloqueado',
    defaultMessage: 'O prompt foi bloqueado pelos filtros de segurança.'
  },
  network: {
    icon: Wifi,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    title: 'Erro de Conexão',
    defaultMessage: 'Não foi possível conectar ao servidor. Verifique sua conexão.'
  },
  unknown: {
    icon: XCircle,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    borderColor: 'border-border',
    title: 'Erro Inesperado',
    defaultMessage: 'Algo deu errado. Tente novamente.'
  }
};

export function GenerationErrorCard({
  errorType,
  errorMessage,
  featureType,
  hasByok = false,
  onRetry,
  onClose
}: GenerationErrorCardProps) {
  const navigate = useNavigate();
  const config = errorConfig[errorType];
  const Icon = config.icon;

  const renderActions = () => {
    switch (errorType) {
      case 'limit':
        return (
          <>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            )}
            {featureType === 'video' && (
              <Button size="sm" onClick={() => navigate('/app/video-addons')}>
                <CreditCard className="h-4 w-4 mr-2" />
                Comprar Créditos
              </Button>
            )}
            {!hasByok && (
              <Button size="sm" variant="secondary" onClick={() => navigate('/app/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Conectar Fal.ai
              </Button>
            )}
          </>
        );

      case 'balance':
        return (
          <>
            {hasByok ? (
              <Button size="sm" asChild>
                <a href="https://fal.ai/billing" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Adicionar Créditos Fal.ai
                </a>
              </Button>
            ) : (
              <>
                <Button size="sm" onClick={() => navigate('/app/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Conectar Minha Chave
                </Button>
                {onRetry && (
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                )}
              </>
            )}
          </>
        );

      case 'policy':
        return (
          <>
            {onRetry && (
              <Button size="sm" onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar com Outro Prompt
              </Button>
            )}
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Fechar
              </Button>
            )}
          </>
        );

      case 'network':
      case 'unknown':
      default:
        return (
          <>
            {onRetry && (
              <Button size="sm" onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            )}
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Fechar
              </Button>
            )}
          </>
        );
    }
  };

  return (
    <div className={`rounded-xl border-2 ${config.borderColor} ${config.bgColor} p-6 text-center space-y-4 animate-in fade-in duration-300`}>
      <div className={`w-16 h-16 mx-auto rounded-full ${config.bgColor} flex items-center justify-center`}>
        <Icon className={`h-8 w-8 ${config.color}`} />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{config.title}</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {errorMessage || config.defaultMessage}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center pt-2">
        {renderActions()}
      </div>
    </div>
  );
}
