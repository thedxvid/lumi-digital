import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { config, customPrompt } = await req.json()

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured')
    }

    // Build prompt for copy generation
    const copyPrompt = `Você é um copywriter expert especializado em criativos para ${config.market}.

TAREFA: Gerar textos para um criativo publicitário com as seguintes especificações:

TIPO: ${config.creativeType}
FORMATO: ${config.format}
OBJETIVO: ${config.objective}
PÚBLICO-ALVO: ${config.targetAudience}
TOM: ${config.tone}

${customPrompt ? `CONTEXTO ADICIONAL: ${customPrompt}` : ''}

INSTRUÇÕES CRÍTICAS:
- Gere textos em português brasileiro
- Seja direto, impactante e persuasivo
- Use o tom especificado: ${config.tone}
- Foque no objetivo: ${config.objective}
- Headline deve ter no máximo 60 caracteres
- Texto secundário deve ter no máximo 120 caracteres
- CTA deve ter no máximo 30 caracteres
- NÃO use emojis ou símbolos especiais
- Use português correto com acentuação adequada

Retorne APENAS um objeto JSON no seguinte formato (sem markdown, sem explicações):
{
  "headline": "Texto principal curto e impactante",
  "secondary": "Texto secundário explicativo",
  "cta": "Chamada para ação clara"
}`

    console.log('Generating copy with GPT-5-mini...')

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          {
            role: "user",
            content: copyPrompt
          }
        ],
        // temperature: 1, // Using default temperature for this model
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Lovable AI error:', response.status, errorText)
      throw new Error(`AI Gateway error: ${response.status}`)
    }

    const data = await response.json()
    const generatedText = data.choices?.[0]?.message?.content

    if (!generatedText) {
      throw new Error('Failed to generate copy')
    }

    console.log('Raw generated text:', generatedText)

    // Extract JSON from the response
    let copyData
    try {
      // Try to find JSON in the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        copyData = JSON.parse(jsonMatch[0])
      } else {
        copyData = JSON.parse(generatedText)
      }
    } catch (e) {
      console.error('Failed to parse JSON:', e)
      // Fallback: try to extract manually
      copyData = {
        headline: config.mainText || "Título impactante",
        secondary: config.secondaryText || "Texto secundário",
        cta: config.callToAction || "Saiba mais"
      }
    }

    console.log('Generated copy:', copyData)

    return new Response(
      JSON.stringify(copyData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-copy:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
