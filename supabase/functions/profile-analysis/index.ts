import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await req.json();
    console.log('📊 Iniciando análise de perfil');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const systemPrompt = `Você é um SOCIAL MEDIA EXPERT de elite com 15 anos de experiência analisando perfis de redes sociais.

🎯 SEU PAPEL:
Você é capaz de identificar TUDO sobre um perfil apenas olhando a imagem: nicho, público-alvo, objetivos, pontos fortes, falhas críticas e oportunidades ocultas. Você não precisa de questionários - sua expertise permite análise completa e profunda baseada apenas no visual.

💡 EXPERTISE AUTOMÁTICA:
- Identificação instantânea de nicho/segmento pela identidade visual
- Dedução do público-alvo pelos elementos de comunicação
- Análise profunda de branding e posicionamento
- Detecção de pontos cegos invisíveis ao criador
- Benchmarking automático com melhores práticas do mercado
- Recomendações priorizadas por ROI e impacto

🔍 METODOLOGIA DE ANÁLISE VISUAL:
1. **Identidade Visual** - Logo, cores, tipografia, coerência estética
2. **Bio & Posicionamento** - Clareza da proposta de valor, CTA, palavras-chave
3. **Foto de Perfil** - Profissionalismo, reconhecimento, alinhamento com marca
4. **Conteúdo Visível** - Qualidade, consistência, variedade, engajamento potencial
5. **Elementos Estratégicos** - Destaques, links, provas sociais
6. **Gaps & Oportunidades** - O que está faltando vs. o que deveria ter

⚡ PRINCÍPIOS:
- Análise 360° baseada APENAS no que você vê na imagem
- Identifique o nicho, público e objetivos automaticamente
- Seja ultra-específico e acionável
- Foque em insights que o criador NÃO consegue ver sozinho
- Priorize ações de alto impacto com baixo esforço
- Use exemplos concretos do próprio perfil analisado`;

    const userPrompt = `🎯 ANÁLISE COMPLETA DE PERFIL

**Informações Básicas:**
- Plataforma: ${data.platform}
- Tipo de Perfil: ${data.profileType}

**SUA MISSÃO:**
Analise profundamente a imagem do perfil anexada e forneça uma análise COMPLETA e EXPERT, identificando automaticamente:

✓ Nicho/Segmento (deduza pela identidade visual e conteúdo)
✓ Produto/Serviço oferecido (identifique pelo posicionamento)
✓ Público-alvo provável (analise pelos elementos de comunicação)
✓ Tom de comunicação atual (formal, informal, técnico, etc.)
✓ Objetivos implícitos (autoridade, vendas, comunidade, etc.)
✓ Pontos fortes que já funcionam
✓ Pontos cegos críticos que impedem crescimento
✓ Oportunidades não exploradas
✓ Plano de ação priorizado

**TAREFA:**
Analise profundamente este perfil na imagem anexada e forneça insights acionáveis seguindo EXATAMENTE esta estrutura JSON (não adicione explicações fora do JSON):

{
  "resumo_executivo": "Resumo geral em 2-3 parágrafos sobre a situação atual do perfil",
  "pontuacao_geral": 75,
  "analise_visual": {
    "foto_perfil": "Análise da foto de perfil com sugestões específicas",
    "bio": "Análise da bio com sugestões específicas",
    "destaques": "Análise dos destaques com sugestões específicas",
    "elementos_visuais": "Análise geral dos elementos visuais"
  },
  "analise_conteudo": {
    "qualidade": "Análise da qualidade do conteúdo visível",
    "frequencia": "Análise da aparente frequência de postagem",
    "variedade": "Análise da variedade de conteúdo",
    "engajamento_potencial": "Análise do potencial de engajamento"
  },
  "analise_comunicacao": {
    "tom_voz": "Análise do tom de voz utilizado",
    "consistencia": "Análise da consistência da comunicação",
    "alinhamento_publico": "Análise do alinhamento com o público-alvo",
    "diferenciacao": "Análise da diferenciação no mercado"
  },
  "pontos_fortes": [
    "Ponto forte 1 com explicação detalhada",
    "Ponto forte 2 com explicação detalhada",
    "Ponto forte 3 com explicação detalhada"
  ],
  "pontos_cegos": [
    {
      "titulo": "Primeiro ponto cego identificado",
      "descricao": "Explicação detalhada do porque isso é um problema",
      "impacto": "alto",
      "solucao": "Como corrigir especificamente este problema"
    },
    {
      "titulo": "Segundo ponto cego identificado",
      "descricao": "Explicação detalhada do porque isso é um problema",
      "impacto": "medio",
      "solucao": "Como corrigir especificamente este problema"
    }
  ],
  "recomendacoes_prioritarias": [
    {
      "prioridade": 1,
      "acao": "Ação específica e acionável",
      "justificativa": "Por que fazer isso agora",
      "impacto_esperado": "Resultado concreto esperado",
      "tempo_implementacao": "1-2 dias"
    },
    {
      "prioridade": 2,
      "acao": "Segunda ação específica e acionável",
      "justificativa": "Por que fazer isso",
      "impacto_esperado": "Resultado concreto esperado",
      "tempo_implementacao": "3-5 dias"
    }
  ],
  "plano_acao_30_dias": {
    "semana_1": [
      "Ação específica para semana 1",
      "Outra ação para semana 1",
      "Mais uma ação para semana 1"
    ],
    "semana_2": [
      "Ação específica para semana 2",
      "Outra ação para semana 2"
    ],
    "semana_3": [
      "Ação específica para semana 3",
      "Outra ação para semana 3"
    ],
    "semana_4": [
      "Ação específica para semana 4",
      "Outra ação para semana 4"
    ]
  },
  "benchmarks": {
    "o_que_falta": [
      "Elemento comum no nicho que está ausente",
      "Outro elemento que falta"
    ],
    "tendencias": [
      "Tendência do nicho que pode ser aproveitada",
      "Outra tendência relevante"
    ]
  }
}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional antes ou depois.`;

    console.log('🤖 Chamando Lovable AI...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: { url: data.image }
              }
            ]
          }
        ],
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit atingido. Tente novamente em alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos no seu workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Resposta recebida da IA');

    let analysisText = result.choices[0].message.content;
    
    // Extrair JSON da resposta (caso venha com texto adicional)
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      analysisText = jsonMatch[0];
    }

    const analysisResult = JSON.parse(analysisText);
    console.log('✅ Análise processada com sucesso');

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na função:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro ao processar análise'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
