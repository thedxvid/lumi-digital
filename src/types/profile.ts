export interface ProfileAnalysisInput {
  image: string;
  niche: string;
  product: string;
  targetAudience: string;
  communication: string;
  goals: string;
  platform: 'Instagram' | 'LinkedIn' | 'TikTok' | 'Twitter' | 'Facebook' | 'YouTube' | 'Outro';
  profileType: 'Pessoal' | 'Marca' | 'Influencer' | 'Empresa' | 'Serviço';
  additionalNotes?: string;
}

export interface BlindSpot {
  titulo: string;
  descricao: string;
  impacto: 'alto' | 'medio' | 'baixo';
  solucao: string;
}

export interface PriorityRecommendation {
  prioridade: number;
  acao: string;
  justificativa: string;
  impacto_esperado: string;
  tempo_implementacao: string;
}

export interface ProfileAnalysisOutput {
  resumo_executivo: string;
  pontuacao_geral: number;
  analise_visual: {
    foto_perfil: string;
    bio: string;
    destaques: string;
    elementos_visuais: string;
  };
  analise_conteudo: {
    qualidade: string;
    frequencia: string;
    variedade: string;
    engajamento_potencial: string;
  };
  analise_comunicacao: {
    tom_voz: string;
    consistencia: string;
    alinhamento_publico: string;
    diferenciacao: string;
  };
  pontos_fortes: string[];
  pontos_cegos: BlindSpot[];
  recomendacoes_prioritarias: PriorityRecommendation[];
  plano_acao_30_dias: {
    semana_1: string[];
    semana_2: string[];
    semana_3: string[];
    semana_4: string[];
  };
  benchmarks: {
    o_que_falta: string[];
    tendencias: string[];
  };
}

export interface SavedProfileAnalysis {
  id: string;
  user_id: string;
  profile_image: string;
  input_data: ProfileAnalysisInput;
  analysis_result: ProfileAnalysisOutput;
  platform: string;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
}
