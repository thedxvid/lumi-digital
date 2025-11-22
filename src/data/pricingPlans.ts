import type { PlanConfig, VideoAddonConfig } from '@/types/subscription';

export const pricingPlans: PlanConfig[] = [
  {
    type: 'basic',
    name: 'Plano Básico',
    description: 'Tudo que você precisa para criar conteúdo profissional',
    prices: {
      1: 1397,
      3: 1397,
      6: 1397,
    },
    features: [
      'Chat ilimitado com IA',
      '10 imagens criativas por dia',
      '300 imagens criativas por mês',
      '5 análises de perfil por dia',
      '150 análises de perfil por mês',
      '3 carrosséis por mês',
      '🎬 Vídeos Kling (image-to-video)',
      '⚡ Compre mais créditos quando precisar',
      'Suporte prioritário',
      '✨ Acesso por 1 ano completo',
    ],
    limits: {
      creativeDailyImages: 10,
      creativeMonthlyImages: 300,
      profileDailyAnalysis: 5,
      monthlyCarousels: 3,
      monthlyVideos: 0,
    },
  },
];

export const videoAddons: VideoAddonConfig[] = [
  {
    type: 'plus_10',
    credits: 10,
    price: 59.90,
    name: 'Pacote +10 Vídeos',
    planType: 'basic',
    description: 'Sora 2 e Kling v2.5',
  },
  {
    type: 'plus_20',
    credits: 20,
    price: 99.90,
    name: 'Pacote +20 Vídeos',
    planType: 'basic',
    description: 'Sora 2 e Kling v2.5',
  },
  {
    type: 'plus_30',
    credits: 30,
    price: 129.90,
    name: 'Pacote +30 Vídeos ⭐',
    planType: 'basic',
    description: 'Sora 2 e Kling v2.5 - Mais Popular',
  },
];

export const allVideoAddons = videoAddons;

export const getPricePerMonth = (totalPrice: number, months: number): number => {
  return totalPrice / months;
};

export const getSavingsPercentage = (monthlyPrice: number, multiMonthPrice: number, months: number): number => {
  const fullPrice = monthlyPrice * months;
  return Math.round(((fullPrice - multiMonthPrice) / fullPrice) * 100);
};
