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

    console.log('Enhancing prompt:', prompt.substring(0, 100), 'Context:', context)

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured')
    }

    let systemPrompt: string;
    let maxChars = 500;

    // Sistema de prompts especializados baseado no contexto
    if (context === 'identity-preservation-carousel') {
      // Contexto especial para preservação de identidade (modo "gerar com referência")
      maxChars = 800;
      systemPrompt = `You are an expert prompt engineer for AI image generation with IDENTITY PRESERVATION.

The user is providing reference photos of themselves and wants to appear in a new scene/scenario.

YOUR TASK: Transform their prompt into a detailed instruction that:

1. ALWAYS output the enhanced prompt in ENGLISH
2. CRITICAL IDENTITY PRESERVATION - Include these EXACT instructions:
   - "ANALYZE the facial structure, skin tone, hair color, hair style, and body type from the reference photos"
   - "Generate a COMPLETELY NEW image where this EXACT person appears naturally in the requested scene"
   - "DO NOT copy-paste or cut the body from the reference photo"
   - "Create a natural, realistic pose appropriate for the scene"
   - "MAINTAIN the person's exact facial features, eye color, nose shape, and overall appearance"
   - "The clothing and pose can be different from the reference"
   - "Make it look like a real professional photograph of THIS person in the new setting"

3. Make the scene description more specific and vivid
4. Add professional photography terms: "shot on professional camera", "natural lighting", "shallow depth of field"
5. Add realism modifiers: "photorealistic", "hyperrealistic", "lifelike details"
6. Include composition details for professional quality
7. Maximum ${maxChars} characters
8. DO NOT add explanations - just output the enhanced prompt

EXAMPLE INPUT: "me coloque em frente a uma mansão"
EXAMPLE OUTPUT: "ANALYZE my facial structure, skin tone, hair color/style, and body type from the reference photos. Generate a COMPLETELY NEW professional photograph where I appear standing confidently in front of a luxurious modern mansion with manicured gardens. DO NOT copy-paste my body - create a natural, relaxed pose appropriate for the setting. MAINTAIN my exact facial features and overall appearance. Shot on professional camera, soft natural lighting, shallow depth of field, photorealistic, hyperrealistic skin texture, 8k quality. The mansion should have elegant architecture with warm golden hour lighting."`;
    } else {
      // Contexto padrão para geração de imagens
      systemPrompt = `You are an expert prompt engineer specializing in AI image generation. Your task is to transform user prompts into highly detailed, optimized prompts for PHOTOREALISTIC image generation.

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
11. Maximum ${maxChars} characters

${context ? `Context: This is for a ${context} creative - ensure photorealistic commercial quality.` : ''}

Transform the user's prompt into a professional, PHOTOREALISTIC image generation prompt with realistic lighting, shadows, and textures.`;
    }

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
        max_tokens: 800
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

    console.log('Enhanced prompt:', enhancedPrompt.substring(0, 150))

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