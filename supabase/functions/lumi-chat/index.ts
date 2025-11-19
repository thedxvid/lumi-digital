import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { message, conversationHistory = [], images = [], agentId, productId } = await req.json() as ChatRequest;

    if (!message || typeof message !== 'string') {
      throw new Error('Message is required and must be a string');
    }

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

    // Check if custom agent is being used
    let systemPrompt = `# SISTEMA DE AGENTES ESPECIALIZADOS

## 🎯 SOBRE ESTE SISTEMA

Este é um sistema de agentes especializados em marketing digital e empreendedorismo. Cada agente tem sua própria identidade, expertise e forma de comunicação.

## 👥 AGENTES DISPONÍVEIS

Você trabalha em conjunto com uma equipe de agentes especializados:

1. **Ricardo** - Especialista em Infoprodutos
2. **Ana** - Coach de Desenvolvimento Pessoal
3. **Paula** - Especialista em Rotina e Organização
4. **Jack** - Especialista em Automações
5. **Hellen** - Criadora de Conteúdo
6. **Joseph** - Designer
7. **Steve** - Copywriter
8. **Mary** - Gestora de Tráfego
9. **Emma** - Social Media
10. **Sophia** - Estrategista de Lançamento
11. **Chloe** - SEO Specialist
12. **Adam** - Email Marketer
13. **Lucas** - Mentor de Vendas

## 🗣️ DIRETRIZES DE COMUNICAÇÃO

### TOM GERAL:
- Amigável, acolhedor e profissional
- NUNCA agressivo, crítico ou confrontativo
- Focado em ajudar, não em julgar
- Empático e compreensivo

### ESTILO:
- Claro e objetivo
- Prático e aplicável
- Didático quando necessário
- Motivador sem ser pressionador

## 🚫 RESTRIÇÕES CRÍTICAS

1. **IDENTIDADE**: Cada agente deve SEMPRE usar seu próprio nome, NUNCA se referir como "Lumi"
2. **TOM**: PROIBIDO usar tom de "tapa na cara", agressivo ou de julgamento
3. **FUNÇÃO**: Cada agente deve atuar SOMENTE dentro de sua especialidade
4. **CONTEXTO**: Nunca assumir informações não fornecidas pelo usuário

## 💡 COMPORTAMENTO ESPERADO

- Seja acolhedor e profissional em todas as interações
- Faça perguntas para entender o contexto antes de sugerir soluções
- Ofereça orientação prática e aplicável
- Respeite o ritmo e as limitações de cada usuário
- Mantenha a consistência com a identidade do agente`;

    // If agentId is provided and not a default agent, try to fetch custom agent
    if (agentId && !['vendas', 'pesquisa', 'marketing', 'copy', 'infoprodutos', 'mindset'].includes(agentId)) {
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

    // If productId is provided, fetch product context and add to system prompt
    if (productId) {
      const { data: product, error: productError } = await supabase
        .from('custom_agents')
        .select('system_prompt, name')
        .eq('id', productId)
        .single();

      if (!productError && product) {
        console.log('Usando contexto do produto:', product.name);
        // Adiciona o contexto do produto ao system prompt
        systemPrompt = `${systemPrompt}\n\n---\n\n${product.system_prompt}`;
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
