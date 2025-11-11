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
    description: 'Para profissionais que precisam de mais poder',
    prices: {
      1: 197,
      3: 471,
      6: 822,
    },
    features: [
      'Tudo do Plano Básico',
      '30 imagens criativas por dia',
      '900 imagens criativas por mês',
      '10 análises de perfil por dia',
      '300 análises de perfil por mês',
      '10 carrosséis por mês',
      '15 vídeos por mês (até 8s, 1080p)',
      'Suporte VIP',
      'Acesso antecipado a novos recursos',
    ],
    limits: {
      creativeDailyImages: 30,
      creativeMonthlyImages: 900,
      profileDailyAnalysis: 10,
      monthlyCarousels: 10,
      monthlyVideos: 15,
    },
  },
];

export const videoAddons: VideoAddonConfig[] = [
  {
    type: 'plus_10',
    credits: 10,
    price: 59.90,
    name: 'Pacote +10 Vídeos',
  },
  {
    type: 'plus_20',
    credits: 20,
    price: 99.90,
    name: 'Pacote +20 Vídeos',
  },
  {
    type: 'plus_30',
    credits: 30,
    price: 129.90,
    name: 'Pacote +30 Vídeos',
  },
];

export const getPricePerMonth = (totalPrice: number, months: number): number => {
  return totalPrice / months;
};

export const getSavingsPercentage = (monthlyPrice: number, multiMonthPrice: number, months: number): number => {
  const fullPrice = monthlyPrice * months;
  return Math.round(((fullPrice - multiMonthPrice) / fullPrice) * 100);
};
