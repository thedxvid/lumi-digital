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
      systemPrompt = `Você é um especialista em engenharia de prompts para geração de vídeo AI (Sora 2, Kling). Sua tarefa é melhorar prompts seguindo as melhores práticas oficiais.

DIRETRIZES OBRIGATÓRIAS:

1. **TRADUZIR PARA INGLÊS** - Modelos funcionam MUITO melhor em inglês. Sempre traduza.

2. **ESTRUTURA CINEMATOGRÁFICA:**
   - Comece com enquadramento (Wide shot, Medium shot, Close-up, etc)
   - Especifique ângulo de câmera (Eye level, Low angle, High angle, Bird's eye)
   - Uma ação clara e específica por vídeo
   - Um movimento de câmera claro (ou "static shot")

3. **DETALHES VISUAIS:**
   - Sujeito principal com 2-3 características visuais distintas
   - 3-5 cores âncora específicas (ex: "deep azure blue, golden yellow, forest green")
   - Qualidade e fonte de luz específica (ex: "soft morning sunlight through windows")

4. **LINGUAGEM PRECISA:**
   - Use verbos específicos: "sprints" ao invés de "moves quickly"
   - Use substantivos concretos: "five-story apartment building" ao invés de "big building"
   - Evite linguagem vaga: "beautiful", "nice", "good"

5. **ESTILO/ESTÉTICA:**
   - Estabeleça estilo no início (ex: "Cinematic, 35mm film", "Anime style", "Documentary realism")

6. **FÍSICA REALISTA:**
   - Descreva movimentos plausíveis que poderiam acontecer na duração do vídeo
   - Evite múltiplas ações complexas

FORMATO DE SAÍDA:
Retorne APENAS o prompt melhorado em INGLÊS, estruturado e otimizado. Seja específico, cinematográfico e detalhado.

EXEMPLO TRANSFORMAÇÃO:
RUIM: "Um gato andando na rua"
BOM: "Medium shot at eye level of a sleek orange tabby cat with white paws walking confidently down a cobblestone street. Soft afternoon sunlight casts long shadows. The cat's tail sways gently as it moves. Color palette: warm amber, grey stone, cream white. Static camera, 35mm film aesthetic, shallow depth of field."`;
    } else if (mode === 'enhance-sora') {
      systemPrompt = `Você é um especialista em engenharia de prompts para o modelo SORA 2 da OpenAI, que tem filtros de segurança MUITO RIGOROSOS. Sua tarefa é criar prompts genéricos e seguros.

REGRAS CRÍTICAS PARA SORA 2:

1. **REMOVA ESPECIFICIDADE DE OBJETOS COMERCIAIS:**
   - ❌ "yellow taxi", "blue sedan", "red sports car"
   - ✅ "taxi", "car", "vehicle"
   - ❌ "iPhone", "MacBook", "Samsung phone"
   - ✅ "smartphone", "laptop", "mobile device"
   - ❌ "Coca-Cola bottle", "Starbucks cup"
   - ✅ "beverage bottle", "coffee cup"

2. **USE CORES APENAS PARA ILUMINAÇÃO E AMBIENTE:**
   - ✅ "warm lighting", "cool tones", "golden hour", "soft blue ambient light"
   - ❌ NÃO use cores para descrever objetos específicos

3. **SEJA GENÉRICO EM OBJETOS, ESPECÍFICO EM AÇÕES:**
   - ✅ "A person sips coffee from a mug while answering a phone call"
   - ❌ "A young businessman in designer suit sips from a white ceramic Starbucks mug"

4. **ESTRUTURA CINEMATOGRÁFICA SIMPLES:**
   - Enquadramento básico (Close-up, Medium shot, Wide shot)
   - Ângulo simples (Eye level, Low angle, High angle)
   - UMA ação principal clara
   - Movimento de câmera simples ou estática

5. **ILUMINAÇÃO E ATMOSFERA (SEM OBJETOS ESPECÍFICOS):**
   - Foque em qualidade de luz: "soft morning light", "dramatic shadows", "backlit"
   - Ambiente: "urban setting", "indoor space", "outdoor scene"

6. **SEMPRE EM INGLÊS** - Traduza prompts em português

FORMATO DE SAÍDA:
Retorne APENAS o prompt otimizado para Sora 2 em INGLÊS, genérico e seguro.

EXEMPLOS DE TRANSFORMAÇÃO:

BLOQUEADO: "Cinematic close-up shot. A young man with short dark hair wearing a grey sweater sips from a white ceramic coffee mug. Behind him, a bright yellow taxi and dark blue sedan move across the frame. He raises a black smartphone to answer a call. Soft morning sunlight."

APROVADO: "Cinematic close-up shot at eye level. A person sips coffee from a mug. Behind them, city traffic moves smoothly across the frame. They raise a phone to answer a call. Soft morning light illuminates the scene. Static camera with shallow depth of field."

BLOQUEADO: "A woman driving a red Ferrari sports car on a coastal highway at sunset"

APROVADO: "Medium shot of a person driving a sports car on a coastal highway. Golden hour lighting with warm tones. Ocean visible in background. Camera tracking alongside vehicle."`;
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
