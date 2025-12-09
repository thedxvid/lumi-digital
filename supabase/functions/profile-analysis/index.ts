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
    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase environment variables not configured');
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const data = await req.json();
    console.log('📊 Iniciando análise de perfil para usuário:', user.id);

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

    const additionalImages: string[] = data.additionalImages || [];
    const hasAdditionalImages = additionalImages.length > 0;

    const userPrompt = `🎯 ANÁLISE COMPLETA DE PERFIL

**Informações Básicas:**
- Plataforma: ${data.platform}
- Tipo de Perfil: ${data.profileType}
${hasAdditionalImages ? `- Imagens Adicionais: ${additionalImages.length} screenshot(s) de posts/conteúdo fornecido(s)` : ''}

**SUA MISSÃO:**
Analise profundamente ${hasAdditionalImages ? 'TODAS as imagens fornecidas (perfil + posts/conteúdos)' : 'a imagem do perfil anexada'} e forneça uma análise COMPLETA e EXPERT, identificando automaticamente:

✓ Nicho/Segmento (deduza pela identidade visual e conteúdo)
✓ Produto/Serviço oferecido (identifique pelo posicionamento)
✓ Público-alvo provável (analise pelos elementos de comunicação)
✓ Tom de comunicação atual (formal, informal, técnico, etc.)
✓ Objetivos implícitos (autoridade, vendas, comunidade, etc.)
✓ Pontos fortes que já funcionam
✓ Pontos cegos críticos que impedem crescimento
✓ Oportunidades não exploradas
✓ Plano de ação priorizado
${hasAdditionalImages ? `
**ANÁLISE DE CONTEÚDO EXTRA:**
Além do perfil, analise também os posts/stories/conteúdos fornecidos para avaliar:
- Consistência visual entre perfil e conteúdo
- Qualidade e variedade dos posts
- Padrões de engajamento visíveis
- Alinhamento do conteúdo com posicionamento do perfil
` : ''}
**TAREFA:**
Analise profundamente este perfil${hasAdditionalImages ? ' e seus conteúdos' : ''} e forneça insights acionáveis estruturados.`;

    // Definição da estrutura de resposta usando tool calling
    const analysisSchema = {
      type: "function",
      function: {
        name: "profile_analysis",
        description: "Retorna análise completa e estruturada do perfil de redes sociais",
        parameters: {
          type: "object",
          properties: {
            resumo_executivo: {
              type: "string",
              description: "Resumo geral em 2-3 parágrafos sobre a situação atual do perfil"
            },
            pontuacao_geral: {
              type: "number",
              description: "Pontuação de 0 a 100 do perfil"
            },
            analise_visual: {
              type: "object",
              properties: {
                foto_perfil: { type: "string", description: "Análise da foto de perfil com sugestões específicas" },
                bio: { type: "string", description: "Análise da bio com sugestões específicas" },
                destaques: { type: "string", description: "Análise dos destaques com sugestões específicas" },
                elementos_visuais: { type: "string", description: "Análise geral dos elementos visuais" }
              },
              required: ["foto_perfil", "bio", "destaques", "elementos_visuais"]
            },
            analise_conteudo: {
              type: "object",
              properties: {
                qualidade: { type: "string", description: "Análise da qualidade do conteúdo visível" },
                frequencia: { type: "string", description: "Análise da aparente frequência de postagem" },
                variedade: { type: "string", description: "Análise da variedade de conteúdo" },
                engajamento_potencial: { type: "string", description: "Análise do potencial de engajamento" }
              },
              required: ["qualidade", "frequencia", "variedade", "engajamento_potencial"]
            },
            analise_comunicacao: {
              type: "object",
              properties: {
                tom_voz: { type: "string", description: "Análise do tom de voz utilizado" },
                consistencia: { type: "string", description: "Análise da consistência da comunicação" },
                alinhamento_publico: { type: "string", description: "Análise do alinhamento com o público-alvo" },
                diferenciacao: { type: "string", description: "Análise da diferenciação no mercado" }
              },
              required: ["tom_voz", "consistencia", "alinhamento_publico", "diferenciacao"]
            },
            pontos_fortes: {
              type: "array",
              items: { type: "string" },
              description: "Lista de 3-5 pontos fortes com explicação detalhada"
            },
            pontos_cegos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  descricao: { type: "string" },
                  impacto: { type: "string", enum: ["baixo", "medio", "alto"] },
                  solucao: { type: "string" }
                },
                required: ["titulo", "descricao", "impacto", "solucao"]
              },
              description: "Lista de pontos cegos identificados"
            },
            recomendacoes_prioritarias: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  prioridade: { type: "number" },
                  acao: { type: "string" },
                  justificativa: { type: "string" },
                  impacto_esperado: { type: "string" },
                  tempo_implementacao: { type: "string" }
                },
                required: ["prioridade", "acao", "justificativa", "impacto_esperado", "tempo_implementacao"]
              },
              description: "Lista de recomendações priorizadas"
            },
            plano_acao_30_dias: {
              type: "object",
              properties: {
                semana_1: { type: "array", items: { type: "string" } },
                semana_2: { type: "array", items: { type: "string" } },
                semana_3: { type: "array", items: { type: "string" } },
                semana_4: { type: "array", items: { type: "string" } }
              },
              required: ["semana_1", "semana_2", "semana_3", "semana_4"]
            },
            benchmarks: {
              type: "object",
              properties: {
                o_que_falta: { type: "array", items: { type: "string" } },
                tendencias: { type: "array", items: { type: "string" } }
              },
              required: ["o_que_falta", "tendencias"]
            }
          },
          required: [
            "resumo_executivo", 
            "pontuacao_geral", 
            "analise_visual", 
            "analise_conteudo", 
            "analise_comunicacao", 
            "pontos_fortes", 
            "pontos_cegos", 
            "recomendacoes_prioritarias", 
            "plano_acao_30_dias", 
            "benchmarks"
          ],
          additionalProperties: false
        }
      }
    };

    // Montar array de imagens para a API
    const imageContents: Array<{ type: 'image_url'; image_url: { url: string } }> = [
      { type: 'image_url', image_url: { url: data.image } }
    ];
    
    // Adicionar imagens extras se existirem
    for (const additionalImg of additionalImages) {
      imageContents.push({ type: 'image_url', image_url: { url: additionalImg } });
    }

    console.log(`🤖 Chamando Lovable AI com ${imageContents.length} imagem(ns)...`);
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
              ...imageContents
            ]
          }
        ],
        tools: [analysisSchema],
        tool_choice: { type: "function", function: { name: "profile_analysis" } },
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

    // Extrair resultado do tool call
    const toolCall = result.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error('❌ Estrutura de resposta inesperada:', JSON.stringify(result, null, 2));
      throw new Error('IA não retornou análise estruturada. Tente novamente.');
    }

    console.log('📦 Tool call recebido:', toolCall.function.name);
    const analysisResult = JSON.parse(toolCall.function.arguments);
    console.log('✅ Análise processada com sucesso');

    // Track API cost
    await supabase.from('api_cost_tracking').insert({
      user_id: user.id,
      feature_type: 'profile_analysis',
      api_provider: 'lovable_ai',
      cost_usd: 0.005,
      metadata: { platform: data.platform, profileType: data.profileType }
    });

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
