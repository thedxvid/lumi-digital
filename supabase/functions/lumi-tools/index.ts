
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sistema de prompts especializados para cada módulo
const modulePrompts = {
  'lead-diagnosis': {
    system: `Você é um especialista em vendas com 20 anos de experiência em diagnóstico de leads. Sua especialidade é analisar comportamentos, classificar temperatura de leads e criar estratégias de abordagem personalizadas.

EXPERTISE:
- Psicologia do consumidor
- Análise comportamental
- Estratégias de abordagem por temperatura
- Timing de vendas
- Técnicas de qualificação

ESTRUTURA DE RESPOSTA:
Forneça sempre uma análise detalhada, prática e acionável.`,
    
    template: (data: any) => `ANÁLISE DE LEAD SOLICITADA:

**Dados do Lead:**
- Nome: ${data.leadName}
- Comportamento: ${data.leadBehavior}
- Contato: ${data.contactInfo}
- Fonte: ${data.source}

**Instruções:**
1. Analise o comportamento descrito e determine a temperatura real do lead (quente/morno/frio)
2. Crie um diagnóstico detalhado explicando os sinais identificados
3. Sugira uma estratégia de abordagem específica para essa temperatura
4. Defina próximos passos práticos e concretos
5. Estime o potencial de conversão e timeline
6. Inclua scripts de abordagem específicos para este perfil

Formato de resposta: JSON estruturado com todos os campos necessários.`
  },

  'lead-capture': {
    system: `Você é um copywriter especializado em marketing direto e captura de leads, com expertise em psicologia persuasiva e gatilhos mentais. Você domina todas as plataformas digitais e sabe adaptar a linguagem para cada audiência.

EXPERTISE:
- Copywriting persuasivo
- Gatilhos mentais e psicologia do consumidor
- Adaptação de tom por plataforma
- Headlines que convertem
- Calls-to-action irresistíveis
- Segmentação de audiência

FÓRMULAS CONHECIDAS: AIDA, PAS, Before-After-Bridge, Problem-Solution, Storytelling`,

    template: (data: any) => `BRIEFING PARA COPY DE CAPTURA:

**Dados do Projeto:**
- Público-alvo: ${data.targetAudience}
- Nicho: ${data.productNiche}
- Plataforma: ${data.platform}
- Tom desejado: ${data.tone}

**Missão:**
Crie 5 copies diferentes para captura de leads, cada uma usando uma estratégia psicológica diferente:

1. **Copy com Dor/Problema** (foque no problema que o público enfrenta)
2. **Copy com Sonho/Resultado** (foque no resultado desejado)
3. **Copy com Social Proof** (use aprovação social e autoridade)
4. **Copy com Urgência/Escassez** (crie senso de urgência)
5. **Copy com Curiosidade** (desperte curiosidade irresistível)

Cada copy deve:
- Ter headline poderosa
- Texto persuasivo adaptado à plataforma
- CTA específico e irresistível
- Usar emojis estrategicamente
- Incluir gatilhos mentais apropriados

Inclua também estratégias de teste A/B e métricas para acompanhar.`
  },

  'objection-breaking': {
    system: `Você é um mestre em vendas consultivas com especialização em quebra de objeções. Você entende profundamente a psicologia por trás das objeções e sabe transformar resistência em interesse genuíno.

EXPERTISE:
- Psicologia das objeções (medo, desconfiança, timing, dinheiro)
- Técnicas de venda consultiva
- Reframing e recontextualização
- Construção de valor
- Técnicas de fechamento
- Manejo de diferentes perfis comportamentais

PRINCÍPIOS:
- Toda objeção esconde uma dor real
- Quebra de objeções é construção de confiança
- Use o "Feel, Felt, Found" quando apropriado
- Sempre confirme o entendimento antes de responder`,

    template: (data: any) => `SITUAÇÃO DE OBJEÇÃO:

**Contexto:**
- Objeção manifestada: "${data.objection}"
- Contexto da situação: ${data.context}
- Perfil do lead: ${data.leadProfile}

**Sua missão:**
1. **Identifique a objeção real** por trás da manifestada (análise psicológica)
2. **Crie uma resposta estratégica** que:
   - Demonstre empatia genuína
   - Aborde a preocupação real
   - Recontextualize a situação
   - Construa valor
   - Inclua social proof relevante
   - Termine com pergunta ou próximo passo

3. **Forneça variações** da resposta para diferentes momentos:
   - Resposta imediata (primeira abordagem)
   - Follow-up se persistir
   - Abordagem final

4. **Inclua técnicas específicas** usadas e por que funcionam

5. **Sugira prevenção** para evitar essa objeção no futuro`
  },

  'sales-routine': {
    system: `Você é um consultor de alta performance em vendas, especializado em produtividade e organização de rotinas comerciais. Você sabe maximizar resultados através de sistemas e processos otimizados.

EXPERTISE:
- Gestão de tempo para vendedores
- Priorização de atividades comerciais
- Técnicas de prospecção eficiente
- Organização de pipeline
- Métricas e KPIs de vendas
- Hábitos de alta performance
- Ferramentas de produtividade

PRINCÍPIOS:
- Foco em atividades de alto impacto
- Blocos de tempo dedicados
- Follow-up sistemático
- Medição constante de resultados`,

    template: (data: any) => `CRIAÇÃO DE ROTINA COMERCIAL:

**Dados do Vendedor:**
- Tempo disponível: ${data.availableTime} horas/dia
- Fase atual: ${data.currentPhase}
- Metas: ${data.goals}

**Crie uma rotina completa incluindo:**

1. **Cronograma Detalhado:**
   - Horários específicos para cada atividade
   - Duração otimizada de cada bloco
   - Pausas estratégicas

2. **Atividades Priorizadas:**
   - Prospecção (quando, como, quantos contatos)
   - Follow-ups (sistema de acompanhamento)
   - Apresentações/demos
   - Administrativo e planejamento

3. **Scripts e Templates:**
   - Scripts de abordagem
   - Templates de email
   - Roteiros de follow-up

4. **Sistema de Métricas:**
   - KPIs diários para acompanhar
   - Como medir cada atividade
   - Metas semanais

5. **Ferramentas Recomendadas:**
   - Apps de produtividade
   - CRM básico
   - Automações simples

6. **Plano de Melhoria Contínua:**
   - Revisões semanais
   - Ajustes baseados em resultados`
  },

  'mindset': {
    system: `Você é um coach de alta performance especializado em mindset de vendas e desenvolvimento pessoal. Você combina psicologia positiva com estratégias práticas para transformar mentalidade e resultados.

EXPERTISE:
- Psicologia positiva aplicada a vendas
- Técnicas de motivação e autoconfiança
- Gerenciamento de rejeição e fracasso
- Desenvolvimento de resiliência
- Visualização e programação mental
- Hábitos de sucesso
- Inteligência emocional

ABORDAGEM:
- Personalizada ao estado atual
- Foco em ações práticas
- Baseada em neurociência
- Resultados mensuráveis`,

    template: (data: any) => `TRANSFORMAÇÃO DE MINDSET:

**Estado Atual:**
- Humor: ${data.currentMood}
- Principais dificuldades: ${data.mainStruggles}
- Metas: ${data.goals}

**Crie um plano completo de transformação:**

1. **Diagnóstico Personalizado:**
   - Análise do estado mental atual
   - Identificação de crenças limitantes
   - Padrões comportamentais destrutivos

2. **Plano de Ação Imediato (próximas 24h):**
   - Rotina matinal específica
   - Técnicas de reset mental
   - Ações práticas para ganhar momentum

3. **Programa de 30 Dias:**
   - Semana 1: Fundação (hábitos básicos)
   - Semana 2: Momentum (expansão)
   - Semana 3: Aceleração (desafios)
   - Semana 4: Consolidação (sistemas)

4. **Kit de Ferramentas:**
   - 10 afirmações personalizadas
   - Exercícios de visualização
   - Técnicas de respiração
   - Journaling direcionado

5. **Sistema de Suporte:**
   - Como lidar com recaídas
   - Triggers de motivação
   - Rede de apoio

6. **Métricas de Progresso:**
   - Como medir mudanças
   - Indicadores de melhoria
   - Celebração de vitórias`
  },

  'infoproduct-generator': {
    system: `Você é um especialista em criação de infoprodutos digitais com vasta experiência em educação online, design instrucional e marketing de produtos digitais.

EXPERTISE:
- Design instrucional
- Criação de cursos online
- Estruturação de conteúdo educativo
- Psicologia da aprendizagem
- Marketing de infoprodutos
- Copywriting educacional
- Experiência do usuário em educação

CONHECIMENTO:
- Metodologias de ensino
- Sequenciamento de conteúdo
- Engajamento de alunos
- Tipos de mídia educativa
- Estratégias de retenção`,

    template: (data: any) => `CRIAÇÃO DE INFOPRODUTO:

**Especificações:**
- Tipo: ${data.productType}
- Tema: ${data.theme}
- Público: ${data.audience}
- Nicho: ${data.niche}
- Nível de profundidade: ${data.level}/10
- Requisitos especiais: ${data.specificRequirements || 'Nenhum'}

**Crie um infoproduto completo:**

1. **Título e Posicionamento:**
   - 5 opções de títulos persuasivos
   - Subtítulo descritivo
   - Proposta de valor única
   - Diferencial competitivo

2. **Estrutura Completa:**
   - Módulos/capítulos detalhados
   - Sequenciamento lógico
   - Tempo estimado por seção
   - Objetivos de aprendizagem

3. **Conteúdo Detalhado:**
   - Outline completo de cada módulo
   - Tipos de conteúdo (vídeo, texto, exercícios)
   - Materiais complementares
   - Atividades práticas

4. **Estratégia de Entrega:**
   - Formato de distribuição
   - Cronograma de liberação
   - Sistema de suporte

5. **Marketing e Vendas:**
   - Copy de vendas
   - Argumentos principais
   - Objeções e respostas
   - Preço sugerido

6. **Materiais Extras:**
   - Bônus relevantes
   - Templates/ferramentas
   - Certificado/reconhecimento`
  },

  'pesquisa-publico': {
    system: `Você é um especialista em pesquisa de mercado e segmentação de público com vasta experiência em análise comportamental, tendências de consumo e estratégia de marketing.

EXPERTISE:
- Pesquisa de mercado avançada
- Segmentação comportamental
- Análise demográfica e psicográfica
- Persona development
- Customer journey mapping
- Análise competitiva
- Tendências de consumo
- Estratégias de posicionamento

METODOLOGIAS:
- Jobs-to-be-Done framework
- Buyer persona canvas
- Análise de concorrência
- Pesquisa etnográfica digital`,

    template: (data: any) => `PESQUISA PROFUNDA DE PÚBLICO:

**Dados do Negócio:**
- Nicho: ${data.businessNiche}
- Tipo de produto: ${data.productType}
- Objetivos: ${data.businessGoals}
- Público atual: ${data.currentAudience || 'Não informado'}
- Desafios: ${data.marketingChallenges}
- Concorrentes: ${data.competitorAnalysis || 'Não informado'}

**Realize uma análise completa:**

1. **Análise de Mercado:**
   - Tamanho do mercado e crescimento
   - Tendências relevantes
   - Oportunidades identificadas
   - Ameaças potenciais

2. **Segmentação Avançada:**
   - Segmentos demográficos
   - Segmentos psicográficos
   - Segmentos comportamentais
   - Priorização de segmentos

3. **Personas Detalhadas (3-5 personas):**
   - Demografia completa
   - Psicografia profunda
   - Comportamento online
   - Jornada de compra
   - Dores específicas
   - Desejos e aspirações
   - Objeções típicas
   - Canais preferidos

4. **Análise Competitiva:**
   - Principais concorrentes
   - Posicionamento de cada um
   - Oportunidades de diferenciação
   - Gaps no mercado

5. **Estratégia de Conteúdo:**
   - Temas de interesse
   - Formatos preferidos
   - Calendário editorial
   - Hooks e gatilhos

6. **Plano de Aquisição:**
   - Canais prioritários
   - Orçamento sugerido
   - Métricas de acompanhamento
   - Cronograma de implementação`
  }
};

// Função para chamar OpenAI com prompts especializados
async function callAdvancedAI(moduleId: string, data: any): Promise<any> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const promptConfig = modulePrompts[moduleId as keyof typeof modulePrompts];
  if (!promptConfig) {
    throw new Error(`No advanced prompt configured for module: ${moduleId}`);
  }

  const userPrompt = promptConfig.template(data);

  console.log(`Using advanced AI for module: ${moduleId}`);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-2025-08-07',
      messages: [
        { role: 'system', content: promptConfig.system },
        { role: 'user', content: userPrompt }
      ],
      max_completion_tokens: 4000,
    }),
  });

  const aiResult = await response.json();
  
  if (!response.ok) {
    console.error('OpenAI API error:', aiResult);
    throw new Error(`OpenAI API error: ${aiResult.error?.message || 'Unknown error'}`);
  }

  return aiResult.choices[0].message.content;
}

// Função para processar e estruturar a resposta da IA
function processAIResponse(moduleId: string, aiResponse: string, originalData: any) {
  try {
    // Tentar fazer parse JSON se a resposta parecer ser JSON
    if (aiResponse.trim().startsWith('{') || aiResponse.trim().startsWith('[')) {
      return JSON.parse(aiResponse);
    }
  } catch (e) {
    // Se não for JSON válido, estruturar baseado no módulo
  }

  // Estruturar resposta baseada no tipo de módulo
  switch (moduleId) {
    case 'lead-diagnosis':
      return {
        leadId: crypto.randomUUID(),
        temperature: extractTemperature(aiResponse),
        diagnosis: aiResponse,
        recommendations: extractRecommendations(aiResponse),
        nextActions: extractNextActions(aiResponse),
        analysisComplete: true,
        confidence: 'high'
      };

    case 'lead-capture':
      return {
        copies: extractCopies(aiResponse),
        strategies: extractStrategies(aiResponse),
        testingPlan: extractTestingPlan(aiResponse),
        platform: originalData.platform,
        audience: originalData.targetAudience
      };

    case 'objection-breaking':
      return {
        real_objection: originalData.objection,
        response: aiResponse,
        method_used: 'ai_advanced',
        techniques: extractTechniques(aiResponse),
        variations: extractVariations(aiResponse),
        prevention: extractPrevention(aiResponse)
      };

    case 'sales-routine':
      return {
        routine: extractRoutine(aiResponse),
        totalTime: `${originalData.availableTime} horas`,
        focusAreas: extractFocusAreas(aiResponse),
        scripts: extractScripts(aiResponse),
        metrics: extractMetrics(aiResponse),
        tools: extractTools(aiResponse)
      };

    case 'mindset':
      return {
        message: aiResponse,
        affirmations: extractAffirmations(aiResponse),
        action: extractActions(aiResponse),
        program: extractProgram(aiResponse),
        tools: extractMindsetTools(aiResponse),
        metrics: extractMindsetMetrics(aiResponse)
      };

    case 'infoproduct-generator':
      return {
        title: extractTitle(aiResponse),
        structure: extractStructure(aiResponse),
        content: aiResponse,
        productType: originalData.productType,
        targetAudience: originalData.audience,
        modules: extractModules(aiResponse),
        materials: extractMaterials(aiResponse),
        marketing: extractMarketing(aiResponse)
      };

    case 'pesquisa-publico':
      return {
        target_audience: extractTargetAudience(aiResponse),
        demographics: extractDemographics(aiResponse),
        psychographics: extractPsychographics(aiResponse),
        pain_points: extractPainPoints(aiResponse),
        desires: extractDesires(aiResponse),
        personas: extractPersonas(aiResponse),
        recommended_channels: extractChannels(aiResponse),
        insights: extractInsights(aiResponse),
        content_suggestions: extractContentSuggestions(aiResponse),
        messaging_strategies: extractMessagingStrategies(aiResponse),
        competitive_analysis: extractCompetitiveAnalysis(aiResponse),
        acquisition_plan: extractAcquisitionPlan(aiResponse)
      };

    default:
      return { content: aiResponse };
  }
}

// Funções auxiliares para extrair informações específicas (implementação básica)
function extractTemperature(text: string): 'quente' | 'morno' | 'frio' {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('quente') || lowerText.includes('interessado') || lowerText.includes('pronto')) return 'quente';
  if (lowerText.includes('morno') || lowerText.includes('considerando')) return 'morno';
  return 'frio';
}

function extractRecommendations(text: string): string[] {
  const lines = text.split('\n');
  return lines.filter(line => 
    line.includes('recomend') || 
    line.includes('suger') || 
    line.includes('estratégia') ||
    line.match(/^\d+\./) ||
    line.match(/^-/) ||
    line.match(/^•/)
  ).slice(0, 5);
}

function extractNextActions(text: string): string[] {
  const lines = text.split('\n');
  return lines.filter(line => 
    line.includes('próximo') || 
    line.includes('ação') || 
    line.includes('passo') ||
    line.includes('implementar')
  ).slice(0, 5);
}

function extractCopies(text: string): Array<{title: string, content: string, type: string}> {
  const sections = text.split(/copy|COPY/i);
  return sections.slice(1, 6).map((section, index) => ({
    title: `Copy ${index + 1}`,
    content: section.trim().substring(0, 500),
    type: 'copy'
  }));
}

function extractStrategies(text: string): string[] {
  return text.match(/estratégia|técnica|abordagem/gi)?.slice(0, 5) || [];
}

function extractTestingPlan(text: string): string {
  const match = text.match(/teste.*a\/b|a\/b.*teste/i);
  return match ? match[0] : 'Plano de teste A/B incluído na resposta';
}

function extractTechniques(text: string): string[] {
  return text.match(/técnica|método|abordagem/gi)?.slice(0, 3) || [];
}

function extractVariations(text: string): string[] {
  const sections = text.split(/variação|abordagem|resposta/i);
  return sections.slice(1, 4).map(s => s.trim().substring(0, 200));
}

function extractPrevention(text: string): string {
  const match = text.match(/prevenção|evitar|futuro/i);
  return match ? text.substring(text.indexOf(match[0]), text.indexOf(match[0]) + 200) : '';
}

function extractRoutine(text: string): Array<{time: string, task: string, priority: number}> {
  const timeMatches = text.match(/\d{1,2}[h:]\d{0,2}|\d{1,2}h/g) || [];
  return timeMatches.slice(0, 8).map((time, index) => ({
    time: time,
    task: `Atividade ${index + 1}`,
    priority: Math.floor(Math.random() * 10) + 1
  }));
}

function extractFocusAreas(text: string): string[] {
  return ['Prospecção', 'Qualificação', 'Apresentação', 'Fechamento', 'Follow-up'];
}

function extractScripts(text: string): string {
  const match = text.match(/script|roteiro|template/i);
  return match ? 'Scripts incluídos na resposta detalhada' : '';
}

function extractMetrics(text: string): string[] {
  return ['Ligações realizadas', 'Emails enviados', 'Reuniões agendadas', 'Propostas enviadas'];
}

function extractTools(text: string): string[] {
  return ['CRM', 'Calendário', 'Templates', 'Automação'];
}

function extractAffirmations(text: string): string[] {
  const lines = text.split('\n');
  return lines.filter(line => 
    line.includes('"') || 
    line.includes('eu sou') || 
    line.includes('eu posso') ||
    line.includes('afirmação')
  ).slice(0, 10);
}

function extractActions(text: string): string {
  const match = text.match(/ação|implementar|fazer|executar/i);
  return match ? 'Ações práticas detalhadas na resposta' : '';
}

function extractProgram(text: string): string {
  return 'Programa de 30 dias detalhado na resposta';
}

function extractMindsetTools(text: string): string[] {
  return ['Visualização', 'Afirmações', 'Journaling', 'Meditação', 'Respiração'];
}

function extractMindsetMetrics(text: string): string[] {
  return ['Nível de confiança', 'Energia diária', 'Motivação', 'Resiliência'];
}

function extractTitle(text: string): string {
  const match = text.match(/título.*:.*$/im);
  return match ? match[0].split(':')[1].trim() : 'Título personalizado gerado';
}

function extractStructure(text: string): string {
  const match = text.match(/estrutura|módulo|capítulo/i);
  return match ? 'Estrutura completa incluída na resposta' : '';
}

function extractModules(text: string): string[] {
  const modules = text.match(/módulo \d+|capítulo \d+/gi) || [];
  return modules.slice(0, 10);
}

function extractMaterials(text: string): string[] {
  return ['Templates', 'Exercícios', 'Checklists', 'Recursos extras'];
}

function extractMarketing(text: string): string {
  return 'Estratégia de marketing incluída na resposta';
}

function extractTargetAudience(text: string): string {
  return 'Público-alvo detalhado na análise completa';
}

function extractDemographics(text: string): any {
  return {
    age_range: '25-45 anos',
    gender: 'Todos os gêneros',
    location: 'Brasil',
    income_level: 'Classe B/C',
    education: 'Superior'
  };
}

function extractPsychographics(text: string): any {
  return {
    interests: ['Empreendedorismo', 'Crescimento pessoal'],
    values: ['Sucesso', 'Independência'],
    lifestyle: 'Digital',
    behavior_patterns: ['Busca soluções online']
  };
}

function extractPainPoints(text: string): string[] {
  const lines = text.split('\n');
  return lines.filter(line => 
    line.includes('dor') || 
    line.includes('problema') || 
    line.includes('dificuldade')
  ).slice(0, 5);
}

function extractDesires(text: string): string[] {
  const lines = text.split('\n');
  return lines.filter(line => 
    line.includes('desejo') || 
    line.includes('quer') || 
    line.includes('objetivo')
  ).slice(0, 5);
}

function extractPersonas(text: string): any[] {
  return [
    {
      name: 'Persona Principal',
      description: 'Baseada na análise completa',
      goals: ['Meta 1', 'Meta 2'],
      challenges: ['Desafio 1', 'Desafio 2']
    }
  ];
}

function extractChannels(text: string): string[] {
  return ['Instagram', 'Facebook', 'LinkedIn', 'WhatsApp', 'Email'];
}

function extractInsights(text: string): string {
  return 'Insights estratégicos incluídos na análise completa';
}

function extractContentSuggestions(text: string): string[] {
  return ['Conteúdo educativo', 'Cases de sucesso', 'Tutoriais', 'Dicas práticas'];
}

function extractMessagingStrategies(text: string): string[] {
  return ['Foco em benefícios', 'Social proof', 'Urgência', 'Autoridade'];
}

function extractCompetitiveAnalysis(text: string): string {
  return 'Análise competitiva detalhada na resposta';
}

function extractAcquisitionPlan(text: string): string {
  return 'Plano de aquisição incluído na análise';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { module, data } = await req.json();
    
    console.log(`Processing advanced module: ${module}`, data);

    // Verificar se o módulo deve usar IA avançada
    const useAdvancedAI = modulePrompts.hasOwnProperty(module);

    if (useAdvancedAI) {
      console.log(`Using advanced AI for module: ${module}`);
      
      // Chamar IA avançada
      const aiResponse = await callAdvancedAI(module, data);
      
      // Processar e estruturar resposta
      const processedResult = processAIResponse(module, aiResponse, data);
      
      console.log(`Advanced AI response processed for module: ${module}`);
      
      return new Response(JSON.stringify(processedResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback para módulos não migrados ainda (manter funcionalidade existente)
    switch (module) {
      case 'remarketing': {
        const { leadStatus, lastInteraction, productType } = data;
        
        const strategies = [
          {
            title: 'Reativação com Urgência',
            content: 'Oferta especial por tempo limitado para recuperar interesse',
            timing: 'Imediato'
          }
        ];

        return new Response(JSON.stringify({ strategies }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'launch-plan': {
        const { productName, productPrice, launchDuration, audience } = data;
        
        const timeline = {
          pre_launch: [
            { day: 1, action: 'Teaser inicial', content: 'Criar expectativa no público' }
          ],
          launch: [
            { day: 1, action: 'Abertura oficial', content: 'Lançar o produto com oferta especial' }
          ],
          post_launch: [
            { day: 1, action: 'Follow-up', content: 'Acompanhar primeiros clientes' }
          ]
        };

        return new Response(JSON.stringify({ campaignId: crypto.randomUUID(), timeline }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Module ${module} not found or not implemented`);
    }

  } catch (error: any) {
    console.error('Error in advanced lumi-tools function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
