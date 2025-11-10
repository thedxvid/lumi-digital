
// Utilitário para formatação segura de dados do histórico

interface FormattedContent {
  preview: string;
  fullContent: string;
  type: 'text' | 'json' | 'structured';
}

export function formatAssetContent(asset: any): FormattedContent {
  console.log('🔧 Formatando conteúdo do asset:', asset.id, asset.module_used);

  // Formatadores específicos por módulo
  const moduleFormatters: Record<string, (data: any) => FormattedContent> = {
    'objection-breaking': formatObjectionBreaking,
    'lead-diagnosis': formatLeadDiagnosis,
    'sales-routine': formatSalesRoutine,
    'pesquisa-publico': formatAudienceResearch,
    'mindset': formatMindset,
    'infoproduct-generator': formatInfoproduct,
    'lead-capture': formatLeadCapture,
    'remarketing': formatRemarketing,
    'launch-plan': formatLaunchPlan
  };

  const formatter = moduleFormatters[asset.module_used];
  if (formatter) {
    try {
      return formatter(asset);
    } catch (error) {
      console.error('❌ Erro no formatador específico:', error);
    }
  }

  // Formatador genérico
  return formatGeneric(asset);
}

function formatObjectionBreaking(asset: any): FormattedContent {
  const data = extractResultData(asset);
  
  if (data.real_objection && data.response) {
    return {
      preview: `Objeção: "${data.real_objection.substring(0, 100)}..."`,
      fullContent: `**Objeção Real:** ${data.real_objection}\n\n**Resposta:** ${data.response}`,
      type: 'structured'
    };
  }

  return formatGeneric(asset);
}

function formatLeadDiagnosis(asset: any): FormattedContent {
  const data = extractResultData(asset);
  
  if (data.diagnosis) {
    return {
      preview: data.diagnosis.substring(0, 150),
      fullContent: `**Diagnóstico:** ${data.diagnosis}\n\n**Temperatura:** ${data.temperature || 'Não definida'}`,
      type: 'structured'
    };
  }

  return formatGeneric(asset);
}

function formatSalesRoutine(asset: any): FormattedContent {
  const data = extractResultData(asset);
  
  if (data.routine && Array.isArray(data.routine)) {
    const taskCount = data.routine.length;
    const preview = `Rotina com ${taskCount} tarefas`;
    const fullContent = data.routine
      .map((task: any, index: number) => `${index + 1}. ${task.time || task.task || JSON.stringify(task)}`)
      .join('\n');
    
    return {
      preview,
      fullContent: `**Rotina de Vendas:**\n\n${fullContent}`,
      type: 'structured'
    };
  }

  return formatGeneric(asset);
}

function formatAudienceResearch(asset: any): FormattedContent {
  const data = extractResultData(asset);
  
  if (data.target_audience) {
    return {
      preview: `Público-alvo: ${data.target_audience.substring(0, 100)}...`,
      fullContent: `**Público-alvo:** ${data.target_audience}`,
      type: 'structured'
    };
  }

  return formatGeneric(asset);
}

function formatMindset(asset: any): FormattedContent {
  const data = extractResultData(asset);
  
  if (data.message) {
    return {
      preview: data.message.substring(0, 150),
      fullContent: `**Mensagem de Mindset:** ${data.message}`,
      type: 'structured'
    };
  }

  return formatGeneric(asset);
}

function formatInfoproduct(asset: any): FormattedContent {
  const data = extractResultData(asset);
  
  if (data.title) {
    return {
      preview: `Infoproduto: ${data.title}`,
      fullContent: `**Título:** ${data.title}\n\n**Estrutura:** ${data.structure || 'Não definida'}`,
      type: 'structured'
    };
  }

  return formatGeneric(asset);
}

function formatLeadCapture(asset: any): FormattedContent {
  const data = extractResultData(asset);
  
  if (data.copies && Array.isArray(data.copies)) {
    return {
      preview: `${data.copies.length} copy(s) de captação gerada(s)`,
      fullContent: data.copies.map((copy: any, index: number) => 
        `**Copy ${index + 1}:**\n${copy.content || copy.title || JSON.stringify(copy)}`
      ).join('\n\n'),
      type: 'structured'
    };
  }

  return formatGeneric(asset);
}

function formatRemarketing(asset: any): FormattedContent {
  const data = extractResultData(asset);
  
  if (data.strategies && Array.isArray(data.strategies)) {
    return {
      preview: `${data.strategies.length} estratégia(s) de remarketing`,
      fullContent: data.strategies.map((strategy: any, index: number) => 
        `**Estratégia ${index + 1}:** ${strategy.title || strategy.content || JSON.stringify(strategy)}`
      ).join('\n\n'),
      type: 'structured'
    };
  }

  return formatGeneric(asset);
}

function formatLaunchPlan(asset: any): FormattedContent {
  const data = extractResultData(asset);
  
  if (data.timeline) {
    const phases = Object.keys(data.timeline).length;
    return {
      preview: `Plano de lançamento com ${phases} fases`,
      fullContent: `**Plano de Lançamento:**\n\n${JSON.stringify(data.timeline, null, 2)}`,
      type: 'structured'
    };
  }

  return formatGeneric(asset);
}

function formatGeneric(asset: any): FormattedContent {
  const data = extractResultData(asset);
  
  if (typeof data === 'string') {
    return {
      preview: data.substring(0, 150),
      fullContent: data,
      type: 'text'
    };
  }

  // Para objetos, criar uma representação legível
  const jsonString = JSON.stringify(data, null, 2);
  return {
    preview: `Dados estruturados (${Object.keys(data).length} propriedades)`,
    fullContent: jsonString,
    type: 'json'
  };
}

function extractResultData(asset: any): any {
  // Tentar extrair dados na ordem de prioridade
  if (asset.input_data?.result) {
    return asset.input_data.result;
  }
  
  if (asset.input_data && typeof asset.input_data === 'object') {
    return asset.input_data;
  }
  
  if (asset.content) {
    try {
      return JSON.parse(asset.content);
    } catch {
      return asset.content;
    }
  }
  
  return asset;
}

export function safeStringify(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      console.error('Erro ao converter objeto para string:', error);
      return '[Objeto - não foi possível exibir]';
    }
  }
  
  return String(value);
}
