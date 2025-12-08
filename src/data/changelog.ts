export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description?: string;
  highlights: string[];
  type: 'feature' | 'improvement' | 'fix';
}

export const changelog: ChangelogEntry[] = [
  {
    version: "1.3.0",
    date: "2024-12-08",
    title: "Kling v2.6 Pro - Vídeos com Áudio!",
    description: "Novo modelo de geração de vídeos mais realista e com áudio integrado",
    highlights: [
      "🔊 Vídeos agora são gerados COM ÁUDIO automaticamente",
      "Novo modelo Kling v2.6 Pro com qualidade ultra-realista",
      "Movimentos mais naturais e cinematográficos",
      "Melhor preservação de detalhes faciais e corporais"
    ],
    type: 'feature'
  },
  {
    version: "1.2.0",
    date: "2024-12-07",
    title: "Seletor de Cor para Texto do Carrossel",
    description: "Personalize as cores dos textos nos seus carrosséis",
    highlights: [
      "Escolha entre 8 cores pré-definidas para os textos",
      "Adicione cores personalizadas com código hexadecimal",
      "Color picker visual nativo do navegador disponível",
      "Preview em tempo real da cor selecionada"
    ],
    type: 'feature'
  },
  {
    version: "1.1.0",
    date: "2024-12-05",
    title: "Melhorias no Gerador de Carrossel",
    description: "Novos recursos para criação de carrosséis",
    highlights: [
      "Campos de texto disponíveis em todos os modos de geração",
      "Limite de caracteres aumentado para textos",
      "Preservação de identidade em fotos de referência",
      "Botão 'Melhorar Prompt' com IA integrada"
    ],
    type: 'feature'
  },
  {
    version: "1.0.0",
    date: "2024-12-01",
    title: "Lançamento Inicial",
    description: "Bem-vindo à plataforma LUMI!",
    highlights: [
      "Gerador de criativos com IA",
      "Criação de carrosséis para redes sociais",
      "Análise de perfil com inteligência artificial",
      "Geração de vídeos com IA"
    ],
    type: 'feature'
  }
];

export const getLatestVersion = () => changelog[0];
export const CHANGELOG_STORAGE_KEY = 'lumi-changelog-last-seen';
