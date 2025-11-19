import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('authorization')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const token = authHeader?.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { slideNumber, totalSlides, content, theme, tone, isLastSlide, callToAction } = await req.json()

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured')
    }

    // Build prompt for carousel copy generation
    const copyPrompt = `Você é um copywriter expert especializado em carrosséis para Instagram.

TAREFA: Gerar textos para o slide ${slideNumber} de ${totalSlides} de um carrossel.

CONTEXTO DO SLIDE:
${content}

ESPECIFICAÇÕES:
- Tema: ${theme}
- Tom: ${tone}
${isLastSlide ? `- Este é o ÚLTIMO slide, deve incluir CTA: "${callToAction}"` : ''}
${slideNumber === 1 ? '- Este é o PRIMEIRO slide, deve ser cativante e chamar atenção' : ''}

INSTRUÇÕES CRÍTICAS:
- Gere textos em português brasileiro
- Seja direto, impactante e persuasivo
- Use o tom especificado: ${tone}
- Headline deve ter no máximo 80 caracteres
- Texto secundário deve ter no máximo 150 caracteres
- CTA deve ter no máximo 30 caracteres (se aplicável)
- NÃO use emojis ou símbolos especiais
- Use português correto com acentuação adequada
- Ortografia perfeita é OBRIGATÓRIA
- Cada slide deve fazer sentido sozinho mas ser parte da sequência

Retorne APENAS um objeto JSON no seguinte formato (sem markdown, sem explicações):
{
  "headline": "Texto principal curto e impactante",
  "secondary": "Texto secundário explicativo",
  "cta": "${isLastSlide ? 'Chamada para ação clara' : ''}"
}`

    console.log(`Generating copy for slide ${slideNumber}/${totalSlides}...`)

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
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        copyData = JSON.parse(jsonMatch[0])
      } else {
        copyData = JSON.parse(generatedText)
      }
    } catch (e) {
      console.error('Failed to parse JSON:', e)
      // Fallback
      copyData = {
        headline: content.substring(0, 80),
        secondary: content.substring(0, 150),
        cta: isLastSlide ? callToAction || "Saiba mais" : ""
      }
    }

    console.log('Generated copy:', copyData)

    return new Response(
      JSON.stringify(copyData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-carousel-copy:', error)
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
