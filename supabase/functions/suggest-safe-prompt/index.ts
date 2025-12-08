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
    const { prompt, mode = 'safe' } = await req.json();

    if (!prompt || prompt.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: 'Prompt muito curto para processar' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing prompt in ${mode} mode:`, prompt);

    let systemPrompt = '';
    
    if (mode === 'safe') {
      systemPrompt = `Você é um assistente especializado em reformular prompts de geração de vídeo para remover conteúdo que pode ser bloqueado por filtros de segurança.

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

Retorne APENAS o prompt reformulado, sem explicações adicionais.`;
    } else if (mode === 'enhance') {
      systemPrompt = `Você é um especialista em engenharia de prompts para geração de vídeo AI (Kling/Veo). Sua tarefa é melhorar prompts seguindo as melhores práticas.

REGRA CRÍTICA - GERAR EM PORTUGUÊS:
- O prompt melhorado DEVE ser escrito em PORTUGUÊS para que o usuário possa visualizar e editar
- Preserve DIÁLOGOS e FALAS exatamente como escritos, na língua original

DIRETRIZES OBRIGATÓRIAS:

1. **ESTRUTURA CINEMATOGRÁFICA:**
   - Comece com enquadramento (Plano geral, Plano médio, Close-up, etc)
   - Especifique ângulo de câmera (Nível dos olhos, Ângulo baixo, Ângulo alto)
   - Uma ação clara e específica por vídeo
   - Um movimento de câmera claro (ou "câmera estática")

2. **DETALHES VISUAIS:**
   - Sujeito principal com 2-3 características visuais distintas
   - 3-5 cores âncora específicas (ex: "azul profundo, dourado, verde floresta")
   - Qualidade e fonte de luz específica (ex: "luz suave da manhã através das janelas")

3. **LINGUAGEM PRECISA:**
   - Use verbos específicos: "corre rapidamente" ao invés de "se move"
   - Use substantivos concretos: "prédio de cinco andares" ao invés de "prédio grande"
   - Evite linguagem vaga: "bonito", "legal", "bom"

4. **FÍSICA REALISTA:**
   - Descreva movimentos plausíveis que poderiam acontecer na duração do vídeo

EXEMPLO COM DIÁLOGO (PRESERVAR FALAS):
ENTRADA: "Uma entrevista de rua. Apresentador: 'Você ouviu a notícia?' Pessoa: 'Sim! É incrível!'"
SAÍDA: "Plano médio, estilo documentário de entrevista de rua em um centro urbano movimentado. Um apresentador profissional segurando um microfone conversa com uma pessoa vestida casualmente. Luz natural do dia, fundo urbano com pedestres. Diálogo - Apresentador: 'Você ouviu a notícia?' Pessoa: 'Sim! É incrível!' Câmera na mão, estética de documentário realista."

FORMATO DE SAÍDA:
Retorne APENAS o prompt melhorado em PORTUGUÊS, preservando diálogos. Seja específico, cinematográfico e detalhado.`;
    }

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
            content: mode === 'safe' 
              ? `Reformule este prompt removendo marcas e conteúdo sensível:\n\n${prompt}`
              : `Melhore este prompt seguindo as melhores práticas de geração de vídeo AI:\n\n${prompt}`
          }
        ],
        max_tokens: 800,
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
        JSON.stringify({ error: 'Erro ao processar prompt. Tente novamente.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const processedPrompt = data.choices[0].message.content.trim();

    console.log('Prompt processed:', processedPrompt);

    return new Response(
      JSON.stringify({ 
        original: prompt,
        suggested: processedPrompt,
        mode
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
