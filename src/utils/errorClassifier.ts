import type { ErrorType } from '@/components/shared/GenerationErrorCard';

export interface ClassifiedError {
  errorType: ErrorType;
  errorMessage: string;
}

/**
 * Classifica erros de APIs/edge functions em tipos padronizados
 * para exibição consistente ao usuário.
 */
export function classifyError(error: any, context?: string): ClassifiedError {
  const message = typeof error === 'string'
    ? error.toLowerCase()
    : (error?.message || error?.error || '').toLowerCase();
  const statusCode = error?.status || error?.statusCode;

  // 1. Rate limit (429)
  if (statusCode === 429 || message.includes('429') ||
      message.includes('rate limit') || message.includes('too many')) {
    return {
      errorType: 'limit',
      errorMessage: 'Limite de requisições atingido. Aguarde alguns minutos e tente novamente.',
    };
  }

  // 2. Payment / credits (402)
  if (statusCode === 402 || message.includes('402') ||
      message.includes('crédito') || message.includes('credit') ||
      message.includes('saldo') || message.includes('balance') ||
      message.includes('exhausted')) {
    return {
      errorType: 'balance',
      errorMessage: 'Créditos insuficientes. Verifique seu plano ou adicione créditos.',
    };
  }

  // 3. Usage limits (string-based from edge functions)
  if (message.includes('limite') || message.includes('limit') ||
      message.includes('quota') || message.includes('allowance')) {
    return {
      errorType: 'limit',
      errorMessage: context
        ? `Você atingiu o limite de ${context}. Conecte sua chave API ou aguarde a renovação.`
        : 'Você atingiu o limite de uso para esta funcionalidade.',
    };
  }

  // 4. Content policy
  if (message.includes('filtros') || message.includes('bloqueado') ||
      message.includes('policy') || message.includes('segurança') ||
      message.includes('content_policy') || message.includes('moderation')) {
    return {
      errorType: 'policy',
      errorMessage: 'O conteúdo foi bloqueado pelos filtros de segurança. Reformule usando termos mais genéricos.',
    };
  }

  // 5. Auth errors (401, 403)
  if (statusCode === 401 || statusCode === 403 ||
      message.includes('unauthorized') || message.includes('forbidden')) {
    return {
      errorType: 'unknown',
      errorMessage: 'Erro de autenticação. Faça login novamente.',
    };
  }

  // 6. Network errors
  if (message.includes('fetch') || message.includes('network') ||
      message.includes('econnrefused') || message.includes('timeout') ||
      message.includes('conexão') || message.includes('failed to fetch') ||
      message.includes('err_network') || message.includes('aborted')) {
    return {
      errorType: 'network',
      errorMessage: 'Erro de conexão. Verifique sua internet e tente novamente.',
    };
  }

  // 7. Server errors (500+)
  if (statusCode >= 500) {
    return {
      errorType: 'unknown',
      errorMessage: 'O servidor está temporariamente indisponível. Tente novamente em alguns instantes.',
    };
  }

  // 8. Default unknown
  return {
    errorType: 'unknown',
    errorMessage: context
      ? `Erro ao ${context}. Tente novamente.`
      : 'Erro inesperado. Tente novamente.',
  };
}
