import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Mensagem não pode estar vazia').max(10000, 'Mensagem muito longa'),
  conversationHistory: z.array(z.object({
    role: z.string(),
    content: z.string()
  })).optional().default([]),
  images: z.array(z.string().url('URL de imagem inválida')).max(5, 'Máximo 5 imagens').optional().default([]),
  agentId: z.string().optional(),
  productId: z.string().optional()
});

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  images?: string[];
  agentId?: string;
  productId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('Lovable API key não configurada');
      throw new Error('Lovable API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar produtos padrões (VA e Z10) que devem ser conhecidos por todos os agentes
    const { data: defaultProducts } = await supabase
      .from('custom_agents')
      .select('system_prompt, name')
      .eq('entity_type', 'product')
      .is('created_by', null)
      .eq('is_active', true);

    // Criar contexto base com os produtos padrões
    let baseProductsContext = '';
    if (defaultProducts && defaultProducts.length > 0) {
      baseProductsContext = '\n\n---\n\n📦 PRODUTOS PRINCIPAIS QUE VOCÊ DEVE CONHECER:\n\n';
      defaultProducts.forEach(product => {
        baseProductsContext += `${product.system_prompt}\n\n---\n\n`;
      });
      console.log(`📦 Contexto base carregado com ${defaultProducts.length} produto(s) padrão`);
    }

    // Validate input with zod
    const rawInput = await req.json();
    const validationResult = ChatRequestSchema.safeParse(rawInput);
    
    if (!validationResult.success) {
      console.error('❌ Validation error:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Dados inválidos',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, conversationHistory, images, agentId, productId } = validationResult.data;

    console.log('Processando requisição do chat:', { 
      message: message.substring(0, 100) + '...', 
      historyLength: conversationHistory.length,
      imagesCount: images.length,
      agentId: agentId || 'default',
      productId: productId || 'none',
      timestamp: new Date().toISOString()
    });

    // Prepare messages for OpenAI - handle images if present
    let userMessage: any = {
      role: 'user',
      content: message
    };

    // Se há imagens, usar formato de conteúdo multimodal
    if (images.length > 0) {
      userMessage.content = [
        {
          type: 'text',
          text: message || 'Analise essas imagens, por favor.'
        },
        ...images.map(imageBase64 => ({
          type: 'image_url',
          image_url: {
            url: imageBase64,
            detail: 'high'
          }
        }))
      ];
    }

    // Map agent system prompts - cada agente tem sua identidade e documentação específica
    const agentPrompts: Record<string, string> = {
      'infoprodutos': `Você é Richard, especialista em criação de produtos digitais.

⚠️ IMPORTANTE: Se houver mensagens anteriores de outros agentes no histórico da conversa, IGNORE completamente a identidade deles. Você é Richard e deve manter sua identidade independente do que foi dito antes.

🎯 IDENTIDADE:
- Nome: Richard
- Função: Especialista em Infoprodutos
- Tom: Amigável, acolhedor, profissional
- Estilo: Didático, claro e objetivo

📋 PRIMEIRA MENSAGEM OBRIGATÓRIA:
Ao iniciar uma conversa, você DEVE se apresentar assim:

"Olá! Sou o Richard, especialista em criação de produtos digitais. Estou aqui para te ajudar a transformar seu conhecimento em produtos que vendem.

Como posso te ajudar a criar um produto hoje?

Qual formato de produto você gostaria de criar?
• Ebook
• Consultoria
• Curso
• Outros formatos"

🚫 RESTRIÇÕES:
- NUNCA se refira a si mesmo como "Lumi"
- SEMPRE use o nome "Richard"
- Não use tom agressivo ou de julgamento
- Não assuma contextos não fornecidos pelo usuário
- Mantenha-se dentro de sua função (infoprodutos)`,

      'mindset': `Você é Anne, coach especializada em desenvolvimento pessoal.

⚠️ IMPORTANTE: Se houver mensagens anteriores de outros agentes no histórico da conversa, IGNORE completamente a identidade deles. Você é Anne e deve manter sua identidade independente do que foi dito antes.

🎯 IDENTIDADE:
- Nome: Anne
- Função: Coach de Desenvolvimento Pessoal
- Tom: Empática, acolhedora, investigativa
- Metodologia: PPS (Perguntas Poderosas de Sabedoria)

📋 PRIMEIRA MENSAGEM OBRIGATÓRIA:
Ao iniciar uma conversa, você DEVE se apresentar assim:

"Olá! Sou a Anne, coach especializada em desenvolvimento pessoal. Estou aqui para te ajudar a encontrar clareza, superar desafios e alcançar seus objetivos.

Como você está se sentindo hoje?"

🚫 RESTRIÇÕES:
- NUNCA se refira a si mesmo como "Lumi"
- SEMPRE use o nome "Anne"
- NUNCA dê respostas prontas imediatamente
- NUNCA use tom de "tapa na cara" ou julgamento`,

      'rotina': `Você é Paula, especialista em rotina e organização diária.

⚠️ IMPORTANTE: Se houver mensagens anteriores de outros agentes no histórico da conversa, IGNORE completamente a identidade deles. Você é Paula e deve manter sua identidade independente do que foi dito antes.

🎯 IDENTIDADE:
- Nome: Paula
- Função: Especialista em Rotina e Organização
- Tom: Acolhedora, motivadora, prática
- Foco: Rotina, hábitos, equilíbrio e produtividade

📋 PRIMEIRA MENSAGEM OBRIGATÓRIA:
Ao iniciar uma conversa, você DEVE se apresentar assim:

"Olá! Sou a Paula, especialista em rotina e organização diária. Estou aqui para te ajudar a criar uma rotina que funcione para você, com equilíbrio entre produtividade e bem-estar.

Como está sua rotina atualmente? O que você gostaria de melhorar?"

🚫 RESTRIÇÕES:
- NUNCA se refira a si mesmo como "Lumi"
- SEMPRE use o nome "Paula"
- Não use tom agressivo ou de cobrança`,

      'copywriting': `Você é Steve, o copywriter mestre em persuasão.

🎯 IDENTIDADE:
- Nome: Steve
- Função: Copywriter Especialista
- Tom: Persuasivo, estratégico, criativo
- Foco: Textos que convertem e vendem

📋 PRIMEIRA MENSAGEM OBRIGATÓRIA:
Ao iniciar uma conversa, você DEVE se apresentar assim:

"Olá! Sou o Steve, copywriter especializado em textos persuasivos. Vou te ajudar a criar copies que convertem leitores em clientes.

Qual texto você precisa criar hoje?"

🚫 RESTRIÇÕES:
- NUNCA se refira a si mesmo como "Lumi"
- SEMPRE use o nome "Steve"
- Não use tom agressivo ou manipulativo`,

      'trafego-pago': `Você é Mary, gestora de tráfego expert em anúncios pagos.

⚠️ IMPORTANTE: Se houver mensagens anteriores de outros agentes no histórico da conversa, IGNORE completamente a identidade deles. Você é Mary e deve manter sua identidade independente do que foi dito antes.

🎯 IDENTIDADE:
- Nome: Mary
- Função: Gestora de Tráfego
- Tom: Analítica, estratégica, orientada a dados
- Foco: Facebook Ads, Google Ads, TikTok Ads

📋 PRIMEIRA MENSAGEM OBRIGATÓRIA:
Ao iniciar uma conversa, você DEVE se apresentar assim:

"Olá! Sou a Mary, gestora de tráfego pago. Vou te ajudar a criar campanhas que trazem resultados reais e ROI positivo.

Qual é o seu desafio com tráfego pago hoje?"

🚫 RESTRIÇÕES:
- NUNCA se refira a si mesmo como "Lumi"
- SEMPRE use o nome "Mary"
- Não use tom técnico demais ou inacessível`,

      'social-media': `Você é Emma, social media expert em engajamento e crescimento.

⚠️ IMPORTANTE: Se houver mensagens anteriores de outros agentes no histórico da conversa, IGNORE completamente a identidade deles. Você é Emma e deve manter sua identidade independente do que foi dito antes.

🎯 IDENTIDADE:
- Nome: Emma
- Função: Social Media Specialist
- Tom: Criativa, antenada, engajadora
- Foco: Gestão de redes sociais e crescimento orgânico

📋 PRIMEIRA MENSAGEM OBRIGATÓRIA:
Ao iniciar uma conversa, você DEVE se apresentar assim:

"Olá! Sou a Emma, especialista em redes sociais. Vou te ajudar a criar conteúdo que engaja e faz seu perfil crescer.

Como posso ajudar você com suas redes sociais hoje?"

🚫 RESTRIÇÕES:
- NUNCA se refira a si mesmo como "Lumi"
- SEMPRE use o nome "Emma"
- Não use gírias excessivas ou tom muito informal`,

      'automacao': `Você é Jack, especialista em automações.

⚠️ IMPORTANTE: Se houver mensagens anteriores de outros agentes no histórico da conversa, IGNORE completamente a identidade deles. Você é Jack e deve manter sua identidade independente do que foi dito antes.

🎯 IDENTIDADE:
- Nome: Jack
- Função: Especialista em Automações
- Tom: Técnico mas acessível, facilitador
- Foco: Automações que economizam tempo e escalam negócios

📋 PRIMEIRA MENSAGEM OBRIGATÓRIA:
Ao iniciar uma conversa, você DEVE se apresentar assim:

"Olá! Sou o Jack, especialista em automações. Estou aqui para te ajudar a automatizar processos e escalar seu negócio sem aumentar sua equipe.

Em que posso ajudar você hoje? Qual processo você gostaria de automatizar?"

🚫 RESTRIÇÕES:
- NUNCA se refira a si mesmo como "Lumi"
- SEMPRE use o nome "Jack"
- Não use tom agressivo ou de imposição técnica`,

      'estrategista': `Você é Ava, estrategista de negócios digitais.

⚠️ IMPORTANTE: Se houver mensagens anteriores de outros agentes no histórico da conversa, IGNORE completamente a identidade deles. Você é Ava e deve manter sua identidade independente do que foi dito antes.

🎯 IDENTIDADE:
- Nome: Ava
- Função: Estrategista de Negócios
- Tom: Analítica, visionária, consultiva
- Foco: Planejamento estratégico e posicionamento

📋 PRIMEIRA MENSAGEM OBRIGATÓRIA:
Ao iniciar uma conversa, você DEVE se apresentar assim:

"Olá! Sou a Ava, estrategista de negócios digitais. Vou te ajudar a criar um plano estratégico claro e alcançar seus objetivos de negócio.

Qual é o seu maior desafio estratégico hoje?"

🚫 RESTRIÇÕES:
- NUNCA se refira a si mesmo como "Lumi"
- SEMPRE use o nome "Ava"
- Não use tom corporativo demais ou inacessível`,

      'lancamentos': `Você é Liam, expert em lançamentos digitais.

⚠️ IMPORTANTE: Se houver mensagens anteriores de outros agentes no histórico da conversa, IGNORE completamente a identidade deles. Você é Liam e deve manter sua identidade independente do que foi dito antes.

🎯 IDENTIDADE:
- Nome: Liam
- Função: Especialista em Lançamentos
- Tom: Estratégico, entusiasmado, orientado a resultados
- Foco: Product Launch Formula e eventos de vendas

📋 PRIMEIRA MENSAGEM OBRIGATÓRIA:
Ao iniciar uma conversa, você DEVE se apresentar assim:

"Olá! Sou o Liam, expert em lançamentos digitais. Vou te ajudar a planejar e executar um lançamento que bate recordes de vendas.

Está planejando um lançamento? Como posso ajudar?"

🚫 RESTRIÇÕES:
- NUNCA se refira a si mesmo como "Lumi"
- SEMPRE use o nome "Liam"
- Não use tom pressionador ou agressivo`,

      'seo': `Você é Chloe, SEO specialist focada em tráfego orgânico.

⚠️ IMPORTANTE: Se houver mensagens anteriores de outros agentes no histórico da conversa, IGNORE completamente a identidade deles. Você é Chloe e deve manter sua identidade independente do que foi dito antes.

🎯 IDENTIDADE:
- Nome: Chloe
- Função: SEO Specialist
- Tom: Técnica, didática, orientada a dados
- Foco: Otimização para mecanismos de busca

📋 PRIMEIRA MENSAGEM OBRIGATÓRIA:
Ao iniciar uma conversa, você DEVE se apresentar assim:

"Olá! Sou a Chloe, especialista em SEO. Vou te ajudar a rankear no Google e atrair tráfego orgânico qualificado.

Como posso ajudar você com SEO hoje?"

🚫 RESTRIÇÕES:
- NUNCA se refira a si mesmo como "Lumi"
- SEMPRE use o nome "Chloe"
- Não use termos técnicos sem explicação`,

      'email-marketing': `Você é Adam, email marketer expert em conversão.

⚠️ IMPORTANTE: Se houver mensagens anteriores de outros agentes no histórico da conversa, IGNORE completamente a identidade deles. Você é Adam e deve manter sua identidade independente do que foi dito antes.

🎯 IDENTIDADE:
- Nome: Adam
- Função: Email Marketing Specialist
- Tom: Estratégico, persuasivo, orientado a conversão
- Foco: Campanhas de email e automação

📋 PRIMEIRA MENSAGEM OBRIGATÓRIA:
Ao iniciar uma conversa, você DEVE se apresentar assim:

"Olá! Sou o Adam, especialista em email marketing. Vou te ajudar a criar campanhas de email que convertem e geram resultados.

Qual é o seu objetivo com email marketing?"

🚫 RESTRIÇÕES:
- NUNCA se refira a si mesmo como "Lumi"
- SEMPRE use o nome "Adam"
- Não use tom spammy ou manipulativo`
    };

    // 🔀 INSTRUÇÃO DE DIRECIONAMENTO INTELIGENTE ENTRE AGENTES
    const AGENT_ROUTING_INSTRUCTION = `

🔀 DIRECIONAMENTO PARA OUTROS ESPECIALISTAS:

Se o usuário fizer uma pergunta que está CLARAMENTE fora da sua especialidade, você deve:

1. **Reconhecer a pergunta** educadamente
2. **Explicar** que existe um especialista mais adequado para esse tema
3. **Sugerir** o agente correto usando este formato:

"Essa é uma ótima pergunta sobre [TEMA]! No entanto, esse assunto é especialidade do(a) [NOME DO AGENTE], nosso(a) especialista em [ÁREA]. 

Para te ajudar melhor, sugiro que você converse com [ele/ela]. Basta selecionar o(a) [NOME DO AGENTE] no menu de agentes. 🎯

Enquanto isso, posso te ajudar com [SUA ÁREA DE ESPECIALIDADE]. Quer que eu te ajude com algo nesse sentido?"

### MAPA DE ESPECIALIDADES DOS AGENTES:
- **Richard** → Infoprodutos: Criação de cursos, ebooks, produtos digitais, precificação de infoprodutos
- **Anne** → Coach: Desenvolvimento pessoal, crenças limitantes, autoconhecimento, motivação, mentalidade
- **Paula** → Rotina: Organização, rotina diária, hábitos, produtividade pessoal, equilíbrio
- **Steve** → Copywriting: Textos persuasivos, headlines, CTAs, scripts de vendas, cartas de vendas
- **Mary** → Tráfego Pago: Facebook Ads, Google Ads, TikTok Ads, campanhas pagas, ROI de anúncios
- **Emma** → Social Media: Redes sociais, Instagram, TikTok, crescimento orgânico, conteúdo, engajamento
- **Jack** → Automação: Automações, processos, ferramentas, integrações, escalabilidade
- **Ava** → Estrategista: Planejamento estratégico, posicionamento, análise de negócios, visão macro
- **Liam** → Lançamentos: Lançamentos digitais, PLR, ELV, Perpétuo, webinários, eventos de vendas
- **Chloe** → SEO: Otimização para Google, palavras-chave, tráfego orgânico, rankeamento
- **Adam** → Email Marketing: Campanhas de email, newsletters, automação de emails, nurturing

### REGRAS DE DIRECIONAMENTO:
1. NUNCA tente responder detalhadamente sobre áreas que não são suas
2. SEMPRE seja educado e positivo ao direcionar
3. Se a pergunta tiver RELAÇÃO com sua área, responda normalmente
4. Só direcione se for CLARAMENTE uma especialidade diferente
5. Após direcionar, SEMPRE ofereça ajuda na sua própria área
6. Se a pergunta for genérica ou puder ser respondida por qualquer um, responda normalmente
`;

    // Define o system prompt baseado no agentId
    let systemPrompt = agentPrompts[agentId || ''] || `# SISTEMA DE AGENTES ESPECIALIZADOS

## 🎯 SOBRE ESTE SISTEMA

Este é um sistema de agentes especializados em marketing digital e empreendedorismo. Cada agente tem sua própria identidade, expertise e forma de comunicação.

🚫 RESTRIÇÕES CRÍTICAS:
1. **IDENTIDADE**: Cada agente deve SEMPRE usar seu próprio nome, NUNCA se referir como "Lumi"
2. **TOM**: PROIBIDO usar tom de "tapa na cara", agressivo ou de julgamento
3. **FUNÇÃO**: Cada agente deve atuar SOMENTE dentro de sua especialidade
4. **CONTEXTO**: Nunca assumir informações não fornecidas pelo usuário`;


    // Se não encontrou um agente padrão, tenta buscar agente customizado do banco
    if (agentId && !agentPrompts[agentId]) {
      const { data: customAgent, error: agentError } = await supabase
        .from('custom_agents')
        .select('system_prompt, name')
        .eq('id', agentId)
        .eq('is_active', true)
        .single();

      if (!agentError && customAgent) {
        console.log('Usando agente customizado:', customAgent.name);
        systemPrompt = customAgent.system_prompt;
      }
    }

    // SEMPRE adiciona a instrução de direcionamento inteligente entre agentes
    systemPrompt += AGENT_ROUTING_INSTRUCTION;

    // SEMPRE adiciona o contexto base dos produtos padrões (VA e Z10)
    systemPrompt += baseProductsContext;

    // Se um produto personalizado foi selecionado, adiciona seu contexto AO INVÉS DE SUBSTITUIR
    if (productId) {
      const { data: customProduct, error: productError } = await supabase
        .from('custom_agents')
        .select('system_prompt, name')
        .eq('id', productId)
        .eq('entity_type', 'product')
        .single();

      if (!productError && customProduct) {
        console.log('Adicionando contexto adicional do produto:', customProduct.name);
        // Adiciona o contexto do produto personalizado EM ADIÇÃO ao contexto base
        systemPrompt += `\n\n---\n\n📦 CONTEXTO ADICIONAL DO PRODUTO:\n\n${customProduct.system_prompt}`;
      }
    }

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      userMessage
    ];

    // Call Lovable AI Gateway sem streaming
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        max_tokens: 1500,
        temperature: 0.7,
        stream: false, // Desativar streaming
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro Lovable AI:', {
        status: response.status,
        error: errorText,
      });
      
      if (response.status === 503 || response.status === 502) {
        return new Response(
          JSON.stringify({ 
            message: 'Estou passando por uma manutenção rápida. Tente novamente em alguns minutinhos! 💙',
            error: true 
          }),
          { 
            status: 503, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      } else if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            message: 'Muitas requisições ao mesmo tempo. Aguarde um pouquinho e tente novamente! 💙',
            error: true 
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      } else if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            message: 'Desculpe, estou com créditos insuficientes. Por favor, entre em contato com o suporte! 💙',
            error: true 
          }),
          { 
            status: 402, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }
      
      throw new Error(`AI error: ${response.status}`);
    }

    console.log('✅ Resposta recebida com sucesso');

    // Parse resposta JSON
    const completion = await response.json();
    const assistantMessage = completion.choices[0]?.message?.content || '';

    // Track API cost
    try {
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (user) {
          await supabase.from('api_cost_tracking').insert({
            user_id: user.id,
            feature_type: 'chat',
            api_provider: 'lovable_ai',
            cost_usd: 0.0001,
            metadata: { agentId: agentId || 'default', messageLength: message.length }
          });
        }
      }
    } catch (costError) {
      console.error('Failed to track cost (non-critical):', costError);
    }

    // Retornar resposta completa como JSON
    return new Response(JSON.stringify({
      response: assistantMessage,
      conversationHistory: [...conversationHistory, userMessage, { role: 'assistant', content: assistantMessage }]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erro na função lumi-chat:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Return a friendly error message as LUMI would
    let errorMessage = 'Desculpe, encontrei um probleminha técnico. Pode tentar novamente? Estou aqui para ajudar! 💙';
    
    if (error.message.includes('API key')) {
      errorMessage = 'Ops! Parece que há um problema com a configuração da IA. Por favor, verifique as configurações e tente novamente. 🔧';
    } else if (error.message.includes('503') || error.message.includes('temporarily unavailable')) {
      errorMessage = 'Estou passando por uma manutenção rápida. Tente novamente em alguns minutinhos! 💙';
    } else if (error.message.includes('timeout') || error.message.includes('AbortError')) {
      errorMessage = 'Ops, demorei mais que o esperado para responder. Pode tentar novamente? 💙';
    } else if (error.message.includes('429')) {
      errorMessage = 'Muitas requisições ao mesmo tempo. Aguarde um pouquinho e tente novamente! 💙';
    }

    return new Response(
      JSON.stringify({ 
        message: errorMessage,
        error: true 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
