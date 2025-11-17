export interface TimeEstimate {
  min: number; // segundos
  max: number; // segundos
  average: number; // segundos
  message: string;
}

export const getVideoGenerationEstimate = (
  apiProvider: string,
  duration: string
): TimeEstimate => {
  const durationNum = parseInt(duration);
  
  // Estimativas baseadas em dados reais das APIs
  const estimates: Record<string, Record<string, TimeEstimate>> = {
    'fal_sora_v2_text': {
      '4s': { min: 30, max: 45, average: 37, message: 'Gerando vídeo com Sora 2...' },
      '6s': { min: 40, max: 55, average: 47, message: 'Gerando vídeo com Sora 2...' },
      '8s': { min: 45, max: 60, average: 52, message: 'Gerando vídeo com Sora 2...' },
    },
    'fal_sora_v2_image': {
      '4s': { min: 25, max: 35, average: 30, message: 'Animando imagem com Sora 2...' },
      '6s': { min: 30, max: 45, average: 37, message: 'Animando imagem com Sora 2...' },
      '8s': { min: 35, max: 50, average: 42, message: 'Animando imagem com Sora 2...' },
    },
    'fal_kling_v25_turbo': {
      '4s': { min: 20, max: 30, average: 25, message: 'Gerando vídeo com Kling Turbo...' },
      '5s': { min: 25, max: 35, average: 30, message: 'Gerando vídeo com Kling Turbo...' },
      '10s': { min: 35, max: 50, average: 42, message: 'Gerando vídeo com Kling Turbo...' },
    },
    'fal_kling_v25_pro': {
      '4s': { min: 30, max: 45, average: 37, message: 'Gerando vídeo com Kling Pro...' },
      '5s': { min: 35, max: 50, average: 42, message: 'Gerando vídeo com Kling Pro...' },
      '10s': { min: 45, max: 65, average: 55, message: 'Gerando vídeo com Kling Pro...' },
    },
  };

  const providerEstimates = estimates[apiProvider] || estimates['fal_kling_v25_turbo'];
  const durationKey = `${durationNum}s`;
  
  return providerEstimates[durationKey] || providerEstimates['5s'] || {
    min: 30,
    max: 50,
    average: 40,
    message: 'Gerando vídeo...'
  };
};

export const getProgressMessage = (elapsedSeconds: number, estimate: TimeEstimate): string => {
  const progress = Math.min((elapsedSeconds / estimate.average) * 100, 95);
  
  if (progress < 20) {
    return 'Iniciando geração...';
  } else if (progress < 40) {
    return 'Criando cenas...';
  } else if (progress < 60) {
    return 'Adicionando movimento...';
  } else if (progress < 80) {
    return 'Processando frames...';
  } else if (progress < 95) {
    return 'Finalizando vídeo...';
  } else {
    return 'Quase pronto...';
  }
};
