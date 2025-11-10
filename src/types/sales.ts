
// Types for the sales modules and Supabase tables

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  contact?: string;
  source?: string;
  behavior_notes?: string;
  temperature: 'quente' | 'morno' | 'frio';
  status: 'ativo' | 'travado' | 'saiu_grupo' | 'convertido';
  last_interaction?: string;
  created_at: string;
  updated_at: string;
  // New fields
  pipeline_stage_id?: string;
  deal_value?: number;
  next_contact_date?: string;
  lead_score?: number;
  origin_campaign_id?: string;
  whatsapp_number?: string;
  tags?: string[];
}

export interface GeneratedAsset {
  id: string;
  user_id: string;
  title: string;
  content: string;
  asset_type: 'copy' | 'script' | 'email' | 'post_social' | 'sequencia' | 'roteiro' | 'ebook' | 'curso' | 'webinar' | 'template' | 'checklist' | 'guia';
  module_used: string;
  input_data?: any;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  product_name?: string;
  campaign_data: any;
  status: 'rascunho' | 'ativa' | 'pausada' | 'finalizada';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  task_type: string;
  status: 'pendente' | 'em_andamento' | 'concluida';
  due_date?: string;
  priority?: number;
  module_generated?: string;
  created_at: string;
  updated_at: string;
}

// Module input/output types
export interface LeadDiagnosisInput {
  leadName: string;
  leadBehavior: string;
  contactInfo: string;
  source: string;
}

export interface LeadDiagnosisOutput {
  leadId?: string;
  temperature: 'quente' | 'morno' | 'frio';
  diagnosis: string;
  recommendations: string[];
  nextActions: string[];
}

export interface LeadCaptureInput {
  targetAudience: string;
  productNiche: string;
  platform: string;
  tone: string;
}

export interface LeadCaptureOutput {
  copies: Array<{
    title: string;
    content: string;
    type: 'copy' | 'script';
  }>;
}

export interface ObjectionBreakingInput {
  objection: string;
  context: string;
  leadProfile: string;
}

export interface ObjectionBreakingOutput {
  real_objection: string;
  response: string;
}

export interface RemarketingInput {
  leadStatus: 'saiu_grupo' | 'travado';
  lastInteraction: string;
  productType: string;
}

export interface RemarketingOutput {
  strategies: Array<{
    title: string;
    content: string;
    timing: string;
  }>;
}

export interface LaunchPlanInput {
  productName: string;
  productPrice: string;
  launchDuration: number;
  audience: string;
}

export interface LaunchPlanOutput {
  campaignId?: string;
  timeline: {
    pre_launch: Array<{ day: number; action: string; content: string }>;
    launch: Array<{ day: number; action: string; content: string }>;
    post_launch: Array<{ day: number; action: string; content: string }>;
  };
}

export interface SalesRoutineInput {
  availableTime: number;
  currentPhase: string;
  goals: string;
}

export interface SalesRoutineOutput {
  routine: Array<{
    time: string;
    task: string;
    priority: number;
  }>;
  totalTime: string;
  focusAreas: string[];
}

export interface MindsetInput {
  currentMood: 'desanimado' | 'inseguro' | 'motivado';
  mainStruggles: string;
  goals: string;
}

export interface MindsetOutput {
  message: string;
  affirmations: string[];
  action: string;
}

// Novo tipo para Pesquisa de Público
export interface AudienceResearchInput {
  businessNiche: string;
  currentAudience: string;
  productType: string;
  businessGoals: string;
  marketingChallenges: string;
  competitorAnalysis?: string;
}

export interface AudienceResearchOutput {
  target_audience: string;
  demographics: {
    age_range: string;
    gender: string;
    location: string;
    income_level: string;
    education: string;
  };
  psychographics: {
    interests: string[];
    values: string[];
    lifestyle: string;
    behavior_patterns: string[];
  };
  pain_points: string[];
  desires: string[];
  personas: Array<{
    name: string;
    description: string;
    goals: string[];
    challenges: string[];
  }>;
  recommended_channels: string[];
  insights: string;
  content_suggestions: string[];
  messaging_strategies: string[];
}

// Novos tipos para Infoprodutos
export interface InfoproductInput {
  productType: 'ebook' | 'curso' | 'webinar' | 'template' | 'checklist' | 'guia';
  theme: string;
  audience: string;
  niche: string;
  level: number; // 1-10 slider
  specificRequirements?: string;
}

export interface InfoproductOutput {
  title: string;
  structure: string;
  content: string;
  productType: string;
  targetAudience: string;
  estimatedPages?: number;
  estimatedDuration?: string;
  keyTopics: string[];
  downloadLinks?: string[];
}

// Enhanced field definition with more metadata and validation
export interface SalesModuleField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'combobox' | 'tags' | 'slider' | 'date';
  placeholder?: string;
  description?: string;
  icon?: string;
  options?: string[];
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  conditional?: {
    field: string;
    value: any;
  };
  preview?: boolean;
  autoSave?: boolean;
  step?: number; // For multi-step forms
  group?: string; // Group related fields
}

// Enhanced module definition
export interface SalesModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  fields: SalesModuleField[];
  steps?: Array<{
    title: string;
    description: string;
    fields: string[];
  }>;
  previewTemplate?: string;
  estimatedTime?: string;
}

// Tipos específicos para o seletor de infoprodutos
export interface InfoproductType {
  id: 'ebook' | 'curso' | 'webinar' | 'template' | 'checklist' | 'guia';
  title: string;
  description: string;
  icon: string;
  color: string;
  estimatedTime: string;
  features: string[];
}
