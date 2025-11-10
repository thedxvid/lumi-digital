import { SalesModule } from '@/types/sales';

export const leadDiagnosisModule: SalesModule = {
  id: 'lead-diagnosis',
  title: 'Diagnóstico de Leads',
  description: 'Analise o perfil do seu lead e descubra a temperatura ideal para abordá-lo',
  icon: '🌡️',
  color: 'from-red-500 to-orange-500',
  estimatedTime: '2-3 min',
  fields: [
    {
      name: 'leadName',
      label: 'Nome do Lead',
      type: 'text',
      placeholder: 'Ex: João Silva',
      description: 'Nome completo do lead',
      icon: '👤',
      required: true,
      validation: { minLength: 3, maxLength: 50 }
    },
    {
      name: 'leadBehavior',
      label: 'Comportamento do Lead',
      type: 'textarea',
      placeholder: 'Ex: Mostrou interesse no produto, fez perguntas sobre o preço...',
      description: 'Descreva o comportamento do lead durante a interação',
      icon: '🤔',
      required: true,
      validation: { minLength: 20, maxLength: 500 }
    },
    {
      name: 'contactInfo',
      label: 'Informações de Contato',
      type: 'text',
      placeholder: 'Ex: joao.silva@email.com, (11) 99999-9999',
      description: 'Email ou telefone do lead',
      icon: '📧',
      required: true,
      validation: { pattern: '^\\S+@\\S+\\.\\S+$' }
    },
    {
      name: 'source',
      label: 'Fonte do Lead',
      type: 'select',
      placeholder: 'Selecione a fonte',
      description: 'De onde o lead veio?',
      icon: '📍',
      required: true,
      options: [
        'Instagram',
        'Facebook',
        'LinkedIn',
        'WhatsApp',
        'Email Marketing',
        'Indicação',
        'Outro'
      ]
    }
  ],
  previewTemplate: `
👤 **Nome:** {{leadName}}
🤔 **Comportamento:** {{leadBehavior}}
📧 **Contato:** {{contactInfo}}
📍 **Fonte:** {{source}}

A LUMI irá analisar esses dados e determinar a temperatura do lead,
fornecendo um diagnóstico completo e recomendações de abordagem.
  `
};

export const leadCaptureModule: SalesModule = {
  id: 'lead-capture',
  title: 'Captura de Leads',
  description: 'Crie copies persuasivas para atrair leads qualificados',
  icon: '🧲',
  color: 'from-blue-500 to-purple-500',
  estimatedTime: '5-7 min',
  fields: [
    {
      name: 'targetAudience',
      label: 'Público-Alvo',
      type: 'text',
      placeholder: 'Ex: Empreendedores digitais, Estudantes de marketing...',
      description: 'Defina o público que você deseja atrair',
      icon: '🎯',
      required: true,
      validation: { minLength: 5, maxLength: 100 }
    },
    {
      name: 'productNiche',
      label: 'Nicho do Produto',
      type: 'text',
      placeholder: 'Ex: Marketing de conteúdo, E-commerce de moda...',
      description: 'Qual o nicho do seu produto ou serviço?',
      icon: '🏢',
      required: true,
      validation: { minLength: 5, maxLength: 100 }
    },
    {
      name: 'platform',
      label: 'Plataforma',
      type: 'select',
      placeholder: 'Selecione a plataforma',
      description: 'Onde você irá divulgar?',
      icon: '📱',
      required: true,
      options: [
        'Instagram',
        'Facebook',
        'LinkedIn',
        'WhatsApp',
        'Email Marketing',
        'Blog',
        'Outro'
      ]
    },
    {
      name: 'tone',
      label: 'Tom de Voz',
      type: 'select',
      placeholder: 'Selecione o tom',
      description: 'Qual o tom da sua copy?',
      icon: '📢',
      required: true,
      options: [
        'Informativo',
        'Persuasivo',
        'Divertido',
        'Urgente',
        'Empático',
        'Outro'
      ]
    }
  ],
  previewTemplate: `
🎯 **Público-Alvo:** {{targetAudience}}
🏢 **Nicho:** {{productNiche}}
📱 **Plataforma:** {{platform}}
📢 **Tom:** {{tone}}

A LUMI irá gerar copies criativas e persuasivas para capturar a atenção
do seu público-alvo na plataforma escolhida.
  `
};

export const objectionBreakingModule: SalesModule = {
  id: 'objection-breaking',
  title: 'Quebra de Objeções',
  description: 'Supere as objeções dos seus leads e aumente suas conversões',
  icon: '🛡️',
  color: 'from-green-500 to-teal-500',
  estimatedTime: '3-5 min',
  fields: [
    {
      name: 'objection',
      label: 'Objeção do Lead',
      type: 'text',
      placeholder: 'Ex: Está muito caro, Não tenho tempo agora...',
      description: 'Qual a principal objeção do lead?',
      icon: '💬',
      required: true,
      validation: { minLength: 5, maxLength: 200 }
    },
    {
      name: 'context',
      label: 'Contexto da Objeção',
      type: 'textarea',
      placeholder: 'Ex: Lead perguntou o preço e disse que está caro...',
      description: 'Descreva o contexto em que a objeção surgiu',
      icon: 'ℹ️',
      required: true,
      validation: { minLength: 20, maxLength: 500 }
    },
    {
      name: 'leadProfile',
      label: 'Perfil do Lead',
      type: 'text',
      placeholder: 'Ex: Empreendedor, Estudante, Profissional liberal...',
      description: 'Qual o perfil do lead?',
      icon: '👤',
      required: true,
      validation: { minLength: 5, maxLength: 100 }
    }
  ],
  previewTemplate: `
💬 **Objeção:** {{objection}}
ℹ️ **Contexto:** {{context}}
👤 **Perfil:** {{leadProfile}}

A LUMI irá analisar a objeção, o contexto e o perfil do lead para
criar uma resposta persuasiva e superar a resistência.
  `
};

export const remarketingModule: SalesModule = {
  id: 'remarketing',
  title: 'Remarketing',
  description: 'Reative leads inativos e aumente suas chances de conversão',
  icon: '🔄',
  color: 'from-pink-600 to-red-600',
  estimatedTime: '5-7 min',
  fields: [
    {
      name: 'leadStatus',
      label: 'Status do Lead',
      type: 'select',
      placeholder: 'Selecione o status',
      description: 'Qual o status atual do lead?',
      icon: '🚦',
      required: true,
      options: [
        'saiu_grupo',
        'travado'
      ]
    },
    {
      name: 'lastInteraction',
      label: 'Última Interação',
      type: 'text',
      placeholder: 'Ex: 1 semana, 1 mês, 3 meses...',
      description: 'Há quanto tempo foi a última interação?',
      icon: '📅',
      required: true,
      validation: { minLength: 3, maxLength: 50 }
    },
    {
      name: 'productType',
      label: 'Tipo de Produto',
      type: 'text',
      placeholder: 'Ex: Curso online, Ebook, Mentoria...',
      description: 'Qual o tipo de produto que você oferece?',
      icon: '📦',
      required: true,
      validation: { minLength: 5, maxLength: 100 }
    }
  ],
  previewTemplate: `
🚦 **Status:** {{leadStatus}}
📅 **Última Interação:** {{lastInteraction}}
📦 **Produto:** {{productType}}

A LUMI irá criar estratégias de remarketing personalizadas para reativar
leads inativos e aumentar suas chances de conversão.
  `
};

export const launchPlanModule: SalesModule = {
  id: 'launch-plan',
  title: 'Plano de Lançamento',
  description: 'Crie um plano de lançamento estratégico para o seu produto',
  icon: '🚀',
  color: 'from-yellow-600 to-orange-600',
  estimatedTime: '8-10 min',
  fields: [
    {
      name: 'productName',
      label: 'Nome do Produto',
      type: 'text',
      placeholder: 'Ex: Curso de Marketing Digital, Ebook de Receitas...',
      description: 'Qual o nome do seu produto?',
      icon: '📦',
      required: true,
      validation: { minLength: 5, maxLength: 100 }
    },
    {
      name: 'productPrice',
      label: 'Preço do Produto',
      type: 'text',
      placeholder: 'Ex: R$ 997, R$ 47...',
      description: 'Qual o preço do seu produto?',
      icon: '💰',
      required: true,
      validation: { pattern: '^R\\$\\s?\\d+(\\.\\d{3})*(,\\d{2})?$' }
    },
    {
      name: 'launchDuration',
      label: 'Duração do Lançamento',
      type: 'number',
      placeholder: 'Ex: 7, 14, 21...',
      description: 'Quantos dias irá durar o lançamento?',
      icon: '📅',
      required: true,
      validation: { min: 7, max: 30 }
    },
    {
      name: 'audience',
      label: 'Público-Alvo',
      type: 'text',
      placeholder: 'Ex: Empreendedores, Estudantes, Profissionais...',
      description: 'Qual o público que você deseja atingir?',
      icon: '🎯',
      required: true,
      validation: { minLength: 5, maxLength: 100 }
    }
  ],
  previewTemplate: `
📦 **Produto:** {{productName}}
💰 **Preço:** {{productPrice}}
📅 **Duração:** {{launchDuration}} dias
🎯 **Público:** {{audience}}

A LUMI irá criar um plano de lançamento estratégico com um timeline
detalhado de ações para cada fase do lançamento.
  `
};

export const salesRoutineModule: SalesModule = {
  id: 'sales-routine',
  title: 'Rotina de Vendas',
  description: 'Organize seu dia a dia e maximize seus resultados',
  icon: '🗓️',
  color: 'from-indigo-500 to-cyan-500',
  estimatedTime: '3-5 min',
  fields: [
    {
      name: 'availableTime',
      label: 'Tempo Disponível',
      type: 'number',
      placeholder: 'Ex: 2, 4, 6...',
      description: 'Quantas horas você tem disponível por dia?',
      icon: '⏱️',
      required: true,
      validation: { min: 1, max: 8 }
    },
    {
      name: 'currentPhase',
      label: 'Fase Atual',
      type: 'select',
      placeholder: 'Selecione a fase',
      description: 'Em qual fase você está?',
      icon: '📊',
      required: true,
      options: [
        'prospecção',
        'qualificação',
        'negociação',
        'fechamento',
        'pós-venda'
      ]
    },
    {
      name: 'goals',
      label: 'Metas',
      type: 'text',
      placeholder: 'Ex: Aumentar leads, Fechar vendas...',
      description: 'Quais são suas metas para o dia?',
      icon: '🎯',
      required: true,
      validation: { minLength: 5, maxLength: 100 }
    }
  ],
  previewTemplate: `
⏱️ **Tempo:** {{availableTime}} horas
📊 **Fase:** {{currentPhase}}
🎯 **Metas:** {{goals}}

A LUMI irá criar uma rotina de vendas personalizada para você,
organizando suas tarefas e prioridades para maximizar seus resultados.
  `
};

export const mindsetModule: SalesModule = {
  id: 'mindset',
  title: 'Mindset de Vendas',
  description: 'Transforme sua mentalidade e alcance seus objetivos',
  icon: '🧠',
  color: 'from-purple-600 to-indigo-600',
  estimatedTime: '2-3 min',
  fields: [
    {
      name: 'currentMood',
      label: 'Humor Atual',
      type: 'select',
      placeholder: 'Selecione o humor',
      description: 'Como você está se sentindo hoje?',
      icon: '😊',
      required: true,
      options: [
        'desanimado',
        'inseguro',
        'motivado'
      ]
    },
    {
      name: 'mainStruggles',
      label: 'Principais Dificuldades',
      type: 'textarea',
      placeholder: 'Ex: Falta de confiança, Medo da rejeição...',
      description: 'Quais são suas principais dificuldades?',
      icon: '😓',
      required: true,
      validation: { minLength: 20, maxLength: 500 }
    },
    {
      name: 'goals',
      label: 'Metas',
      type: 'text',
      placeholder: 'Ex: Bater a meta, Aumentar a confiança...',
      description: 'Quais são suas metas?',
      icon: '🎯',
      required: true,
      validation: { minLength: 5, maxLength: 100 }
    }
  ],
  previewTemplate: `
😊 **Humor:** {{currentMood}}
😓 **Dificuldades:** {{mainStruggles}}
🎯 **Metas:** {{goals}}

A LUMI irá transformar sua mentalidade com mensagens inspiradoras,
afirmações positivas e ações práticas para você alcançar seus objetivos.
  `
};

export const infoproductGeneratorModule: SalesModule = {
  id: 'infoproduct-generator',
  title: 'Gerador de Infoprodutos',
  description: 'Crie infoprodutos de alta qualidade em minutos',
  icon: '💡',
  color: 'from-orange-500 to-yellow-500',
  estimatedTime: '5-7 min',
  fields: [
    {
      name: 'productType',
      label: 'Tipo de Infoproduto',
      type: 'select',
      placeholder: 'Selecione o tipo',
      description: 'Qual tipo de infoproduto você quer criar?',
      icon: '📚',
      required: true,
      options: [
        'ebook',
        'curso',
        'webinar',
        'template',
        'checklist',
        'guia'
      ]
    },
    {
      name: 'theme',
      label: 'Tema',
      type: 'text',
      placeholder: 'Ex: Marketing Digital, Finanças Pessoais...',
      description: 'Qual o tema do seu infoproduto?',
      icon: '🏷️',
      required: true,
      validation: { minLength: 5, maxLength: 100 }
    },
    {
      name: 'audience',
      label: 'Público-Alvo',
      type: 'text',
      placeholder: 'Ex: Empreendedores, Estudantes, Profissionais...',
      description: 'Qual o público que você quer atingir?',
      icon: '🎯',
      required: true,
      validation: { minLength: 5, maxLength: 100 }
    },
    {
      name: 'niche',
      label: 'Nicho',
      type: 'text',
      placeholder: 'Ex: Marketing de Conteúdo, E-commerce...',
      description: 'Qual o nicho do seu infoproduto?',
      icon: '🏢',
      required: true,
      validation: { minLength: 5, maxLength: 100 }
    },
    {
      name: 'level',
      label: 'Nível de Profundidade',
      type: 'slider',
      description: 'Qual o nível de profundidade do seu infoproduto?',
      icon: '📊',
      required: true,
      validation: { min: 1, max: 10 }
    },
    {
      name: 'specificRequirements',
      label: 'Requisitos Específicos',
      type: 'textarea',
      placeholder: 'Ex: Incluir exemplos práticos, Criar um template...',
      description: 'Quais são os requisitos específicos?',
      icon: '📝',
      required: false,
      validation: { maxLength: 500 }
    }
  ],
  previewTemplate: `
📚 **Tipo:** {{productType}}
🏷️ **Tema:** {{theme}}
🎯 **Público:** {{audience}}
🏢 **Nicho:** {{niche}}
📊 **Nível:** {{level}}
📝 **Requisitos:** {{specificRequirements}}

A LUMI irá criar um infoproduto de alta qualidade com base nas suas
informações, incluindo título, estrutura, conteúdo e design.
  `
};

// Novo módulo de Pesquisa de Público
export const audienceResearchModule: SalesModule = {
  id: 'pesquisa-publico',
  title: 'Pesquisa de Público',
  description: 'Análise completa do seu público-alvo com personas, demografia e insights estratégicos',
  icon: '🎯',
  color: 'from-purple-500 to-pink-500',
  estimatedTime: '8-12 min',
  fields: [
    {
      name: 'businessNiche',
      label: 'Nicho do seu negócio',
      type: 'text',
      placeholder: 'Ex: Consultoria empresarial, E-commerce de moda, Coaching...',
      description: 'Descreva em que área seu negócio atua',
      icon: '🏢',
      required: true,
      validation: { minLength: 5, maxLength: 100 }
    },
    {
      name: 'currentAudience',
      label: 'Público atual (se houver)',
      type: 'textarea',
      placeholder: 'Descreva quem são seus clientes atuais, suas características...',
      description: 'Se já tem clientes, conte sobre eles para aprimorarmos a análise',
      icon: '👥',
      required: false,
      validation: { maxLength: 500 }
    },
    {
      name: 'productType',
      label: 'Tipo de produto/serviço',
      type: 'select',
      placeholder: 'Selecione o tipo principal',
      description: 'Categoria principal do que você oferece',
      icon: '📦',
      required: true,
      options: [
        'Infoproduto (curso online, ebook)',
        'Consultoria/Mentoria',
        'Produto físico',
        'Serviço presencial',
        'Software/App',
        'Afiliação',
        'Outro'
      ]
    },
    {
      name: 'businessGoals',
      label: 'Objetivos principais',
      type: 'tags',
      placeholder: 'Digite e pressione Enter',
      description: 'Quais são seus principais objetivos? (ex: aumentar vendas, expandir mercado)',
      icon: '🎯',
      required: true,
      validation: { min: 1, max: 5 }
    },
    {
      name: 'marketingChallenges',
      label: 'Principais desafios no marketing',
      type: 'textarea',
      placeholder: 'Ex: Não sei onde encontrar meu público, dificuldade para converter leads...',
      description: 'Conte sobre suas principais dificuldades para atrair e converter clientes',
      icon: '⚡',
      required: true,
      validation: { minLength: 20, maxLength: 500 }
    },
    {
      name: 'competitorAnalysis',
      label: 'Concorrentes (opcional)',
      type: 'textarea',
      placeholder: 'Cite alguns concorrentes e o que fazem de interessante...',
      description: 'Conhece concorrentes? Isso nos ajuda a identificar oportunidades',
      icon: '🏆',
      required: false,
      validation: { maxLength: 300 }
    }
  ],
  previewTemplate: `🎯 **Pesquisa de Público para: {{businessNiche}}**

**Produto/Serviço:** {{productType}}
**Objetivos:** {{businessGoals}}

**Desafios atuais:**
{{marketingChallenges}}

**Público atual:** {{currentAudience}}
**Concorrentes:** {{competitorAnalysis}}

A LUMI irá analisar esses dados e criar:
• Perfil demográfico detalhado
• Personas específicas com dores e desejos
• Canais de aquisição recomendados
• Estratégias de conteúdo personalizadas
• Insights para campanhas eficazes`,
  steps: [
    {
      title: 'Informações do Negócio',
      description: 'Conte sobre seu negócio e objetivos',
      fields: ['businessNiche', 'productType', 'businessGoals']
    },
    {
      title: 'Análise do Mercado',
      description: 'Público atual e desafios enfrentados',
      fields: ['currentAudience', 'marketingChallenges', 'competitorAnalysis']
    }
  ]
};

// Adicionar o novo módulo ao array principal
export const salesModules = [
  leadDiagnosisModule,
  leadCaptureModule,
  objectionBreakingModule,
  remarketingModule,
  launchPlanModule,
  salesRoutineModule,
  mindsetModule,
  infoproductGeneratorModule,
  audienceResearchModule
];
