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

    const systemPrompt = `Você é um consultor especialista em marketing digital e análise de perfis de redes sociais com 15 anos de experiência.

EXPERTISE:
- Análise de branding pessoal e corporativo
- Estratégias de comunicação visual
- Otimização de perfis para conversão
- Identificação de pontos cegos em marketing
- Psicologia do consumidor aplicada a redes sociais
- Benchmarking competitivo

METODOLOGIA DE ANÁLISE:
1. Elementos Visuais (foto, capa, destaques)
2. Bio e Descrição (clareza, persuasão, CTA)
3. Consistência de Marca
4. Alinhamento com Público-alvo
5. Oportunidades Não Exploradas
6. Análise Comparativa com Melhores Práticas

PRINCÍPIOS:
- Seja específico e acionável
- Identifique padrões invisíveis ao dono do perfil
- Foque em ROI e resultados mensuráveis
- Use dados e exemplos concretos
- Priorize ações de alto impacto
- Seja direto e objetivo nas recomendações`;

    const userPrompt = `SOLICITAÇÃO DE ANÁLISE DE PERFIL

**Contexto do Perfil:**
- Plataforma: ${data.platform}
- Tipo: ${data.profileType}
- Nicho: ${data.niche}
- Produto/Serviço: ${data.product}
- Público-alvo: ${data.targetAudience}
- Comunicação Atual: ${data.communication}
- Objetivos: ${data.goals}
${data.additionalNotes ? `- Observações: ${data.additionalNotes}` : ''}

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
