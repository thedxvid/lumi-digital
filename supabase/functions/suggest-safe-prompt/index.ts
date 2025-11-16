import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt || prompt.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: 'Prompt muito curto para reformular' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Reformulando prompt:', prompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente especializado em reformular prompts de geração de vídeo para remover conteúdo que pode ser bloqueado por filtros de segurança.

REGRAS IMPORTANTES:
1. Remova todas as marcas comerciais (Rolex, Mercedes, Apple, etc.) e substitua por descrições genéricas
2. Remova nomes de produtos específicos e use termos gerais
3. Mantenha a essência da descrição visual
4. Mantenha a mesma língua do prompt original
5. Seja específico em ações e movimentos, mas genérico em marcas
6. Evite qualquer conteúdo sensível ou que possa ser considerado inapropriado

EXEMPLOS:
- "um Rolex no pulso" → "um relógio elegante no pulso"
- "dirigindo uma Ferrari" → "dirigindo um carro esportivo vermelho"
- "tomando Coca-Cola" → "tomando um refrigerante"
- "usando iPhone" → "usando um smartphone"

Retorne APENAS o prompt reformulado, sem explicações adicionais.`
          },
          {
            role: 'user',
            content: `Reformule este prompt removendo marcas e conteúdo sensível:\n\n${prompt}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos Lovable AI insuficientes.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Erro ao reformular prompt. Tente novamente.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const suggestedPrompt = data.choices[0].message.content.trim();

    console.log('Prompt reformulado:', suggestedPrompt);

    return new Response(
      JSON.stringify({ 
        original: prompt,
        suggested: suggestedPrompt
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in suggest-safe-prompt function:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao processar solicitação' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
