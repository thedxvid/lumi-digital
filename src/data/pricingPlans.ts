import type { PlanConfig, VideoAddonConfig } from '@/types/subscription';

export const pricingPlans: PlanConfig[] = [
  {
    type: 'basic',
    name: 'Plano Básico',
    description: 'Perfeito para começar sua jornada de criação',
    prices: {
      1: 97,
      3: 231,
      6: 402,
    },
    features: [
      'Chat ilimitado com IA',
      '10 imagens criativas por dia',
      '300 imagens criativas por mês',
      '5 análises de perfil por dia',
      '150 análises de perfil por mês',
      '3 carrosséis por mês',
      'Suporte prioritário',
      'Sem geração de vídeos',
    ],
    limits: {
      creativeDailyImages: 10,
      creativeMonthlyImages: 300,
      profileDailyAnalysis: 5,
      monthlyCarousels: 3,
      monthlyVideos: 0,
    },
  },
  {
    type: 'pro',
    name: 'Plano PRO',
    description: 'Para criadores que precisam de vídeos de qualidade',
    prices: {
      1: 147,
      3: 441,
      6: 822,
    },
    features: [
      'Tudo do Plano Básico',
      '30 imagens criativas por dia',
      '900 imagens criativas por mês',
      '10 análises de perfil por dia',
      '300 análises de perfil por mês',
      '10 carrosséis por mês',
      '20 vídeos por mês com Kling v2.5 Turbo',
      'Vídeos até 10s em Full HD',
      'Movimento cinematográfico fluido',
      'Suporte VIP',
    ],
    limits: {
      creativeDailyImages: 30,
      creativeMonthlyImages: 900,
      profileDailyAnalysis: 10,
      monthlyCarousels: 10,
      monthlyVideos: 20,
    },
  },
  {
    type: 'pro_advanced',
    name: 'Plano PRO Advanced',
    description: 'Máxima qualidade com Veo 3.1 do Google',
    prices: {
      1: 247,
      3: 741,
      6: 1422,
    },
    features: [
      'Tudo do Plano PRO',
      'Acesso ao Veo 3.1 (Google AI)',
      '10 vídeos premium por mês',
      'Qualidade cinematográfica máxima',
      'Vídeos até 8s em Ultra HD',
      'Maior controle criativo',
      'Processamento prioritário',
      'Suporte VIP Premium',
      'Acesso antecipado a novos modelos',
    ],
    limits: {
      creativeDailyImages: 30,
      creativeMonthlyImages: 900,
      profileDailyAnalysis: 10,
      monthlyCarousels: 10,
      monthlyVideos: 10,
    },
  },
];

// Pacotes para Plano PRO (Kling v2.5 Turbo - $0.60/vídeo)
export const videoAddons: VideoAddonConfig[] = [
  {
    type: 'plus_10',
    credits: 10,
    price: 59.90,
    name: 'Pacote +10 Vídeos',
    planType: 'pro',
    description: 'Com Kling v2.5 Turbo Pro',
  },
  {
    type: 'plus_20',
    credits: 20,
    price: 99.90,
    name: 'Pacote +20 Vídeos',
    planType: 'pro',
    description: 'Com Kling v2.5 Turbo Pro',
  },
  {
    type: 'plus_30',
    credits: 30,
    price: 129.90,
    name: 'Pacote +30 Vídeos',
    planType: 'pro',
    description: 'Com Kling v2.5 Turbo Pro',
  },
];

// Pacotes para Plano PRO Advanced (Veo 3.1 - $3.20/vídeo ~5-6x mais caro)
export const videoAddonsAdvanced: VideoAddonConfig[] = [
  {
    type: 'advanced_5',
    credits: 5,
    price: 99.90,
    name: 'Pacote Premium +5 Vídeos',
    planType: 'pro_advanced',
    description: 'Com Veo 3.1 Google - Qualidade Máxima',
  },
  {
    type: 'advanced_10',
    credits: 10,
    price: 189.90,
    name: 'Pacote Premium +10 Vídeos',
    planType: 'pro_advanced',
    description: 'Com Veo 3.1 Google - Qualidade Máxima',
  },
  {
    type: 'advanced_15',
    credits: 15,
    price: 269.90,
    name: 'Pacote Premium +15 Vídeos',
    planType: 'pro_advanced',
    description: 'Com Veo 3.1 Google - Qualidade Máxima',
  },
];

// Todos os pacotes combinados
export const allVideoAddons = [...videoAddons, ...videoAddonsAdvanced];

export const getPricePerMonth = (totalPrice: number, months: number): number => {
  return totalPrice / months;
};

export const getSavingsPercentage = (monthlyPrice: number, multiMonthPrice: number, months: number): number => {
  const fullPrice = monthlyPrice * months;
  return Math.round(((fullPrice - multiMonthPrice) / fullPrice) * 100);
};
