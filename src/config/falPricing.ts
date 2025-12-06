// Preços da Fal.ai por modelo (em USD)
// Atualizado em: Dezembro 2024
// Fonte: https://fal.ai/pricing

export const FAL_PRICING = {
  // Imagens (por imagem)
  'nano-banana': 0.039,
  'nano-banana-pro': 0.039,
  'flux-pro': 0.05,
  'flux-dev': 0.025,
  
  // Vídeos - Kling (por segundo)
  'kling-2.5-turbo': 0.07,        // ~$0.35 por 5s
  'kling-2.5-pro': 0.14,          // ~$0.70 por 5s
  'kling-1.6-turbo': 0.05,        // ~$0.25 por 5s
  
  // Vídeos - Veo3 (por segundo)  
  'veo3': 0.40,                   // ~$2.00 por 5s
  'veo3-fast': 0.40,              // ~$2.00 por 5s
  
  // Vídeos - Outros
  'ovi': 0.20,                    // por vídeo (flat)
  'minimax-video': 0.30,          // por vídeo (flat)
} as const;

export type FalModel = keyof typeof FAL_PRICING;

// Modelos de vídeo que cobram por segundo
const PER_SECOND_MODELS = ['kling-2.5-turbo', 'kling-2.5-pro', 'kling-1.6-turbo', 'veo3', 'veo3-fast'];

// Modelos de vídeo com preço fixo
const FLAT_RATE_MODELS = ['ovi', 'minimax-video'];

/**
 * Estima o custo de geração de vídeo
 * @param model - Modelo do vídeo
 * @param durationSeconds - Duração em segundos (padrão: 5)
 */
export const estimateVideoCost = (model: string, durationSeconds: number = 5): number => {
  // Normalizar nome do modelo
  const normalizedModel = model.toLowerCase().replace(/_/g, '-');
  
  // Encontrar preço base
  let priceKey = Object.keys(FAL_PRICING).find(key => 
    normalizedModel.includes(key) || key.includes(normalizedModel)
  );
  
  if (!priceKey) {
    // Fallback baseado em padrões conhecidos
    if (normalizedModel.includes('kling')) priceKey = 'kling-2.5-turbo';
    else if (normalizedModel.includes('veo')) priceKey = 'veo3';
    else return 0.10; // Custo padrão desconhecido
  }
  
  const price = FAL_PRICING[priceKey as FalModel];
  
  // Modelos com preço fixo
  if (FLAT_RATE_MODELS.includes(priceKey)) {
    return price;
  }
  
  // Modelos por segundo
  return price * durationSeconds;
};

/**
 * Estima o custo de geração de imagem
 * @param model - Modelo da imagem (opcional)
 */
export const estimateImageCost = (model?: string): number => {
  if (!model) return FAL_PRICING['nano-banana-pro'];
  
  const normalizedModel = model.toLowerCase().replace(/_/g, '-');
  
  const priceKey = Object.keys(FAL_PRICING).find(key => 
    normalizedModel.includes(key) || key.includes(normalizedModel)
  );
  
  return priceKey ? FAL_PRICING[priceKey as FalModel] : FAL_PRICING['nano-banana-pro'];
};

/**
 * Estima o custo de um carrossel
 * @param slideCount - Número de slides
 * @param model - Modelo usado (opcional)
 */
export const estimateCarouselCost = (slideCount: number, model?: string): number => {
  return estimateImageCost(model) * slideCount;
};

/**
 * Formata custo em USD para exibição
 */
export const formatCostUSD = (cost: number): string => {
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
};

/**
 * Formata custo em BRL para exibição (taxa aproximada)
 */
export const formatCostBRL = (costUSD: number, exchangeRate: number = 6.0): string => {
  const costBRL = costUSD * exchangeRate;
  return `R$ ${costBRL.toFixed(2)}`;
};
