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
    const { prompt, context } = await req.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Prompt is required')
    }

    console.log('Enhancing prompt:', prompt.substring(0, 100))

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured')
    }

    const systemPrompt = `You are an expert prompt engineer specializing in AI image generation. Your task is to transform user prompts into highly detailed, optimized prompts for PHOTOREALISTIC image generation.

RULES:
1. ALWAYS output the enhanced prompt in ENGLISH
2. Make the prompt more specific and descriptive
3. Add professional photography terms: "shot on professional camera", "commercial photography", "studio lighting"
4. ALWAYS include realism modifiers: "photorealistic", "hyperrealistic", "lifelike details", "natural textures"
5. Add realistic lighting details: "realistic shadows", "natural reflections", "accurate material properties"
6. Include composition and style details for professional marketing/advertising
7. Add quality modifiers: "8k", "ultra high resolution", "sharp focus", "professional product photography"
8. Keep the user's original intent but enhance for maximum photorealism
9. Format the output as a single, cohesive prompt
10. DO NOT add any explanations - just output the enhanced prompt
11. Maximum 500 characters

${context ? `Context: This is for a ${context} creative - ensure photorealistic commercial quality.` : ''}

Transform the user's prompt into a professional, PHOTOREALISTIC image generation prompt with realistic lighting, shadows, and textures.`

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Original prompt: "${prompt}"` }
        ],
        temperature: 0.7,
        max_tokens: 600
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI Gateway error:', response.status, errorText)
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Try again in a moment.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        )
      }
      
      throw new Error(`AI Gateway error: ${response.status}`)
    }

    const data = await response.json()
    const enhancedPrompt = data.choices?.[0]?.message?.content?.trim()

    if (!enhancedPrompt) {
      throw new Error('Failed to enhance prompt')
    }

    console.log('Enhanced prompt:', enhancedPrompt.substring(0, 100))

    return new Response(
      JSON.stringify({ enhancedPrompt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Enhance prompt error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to enhance prompt' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})