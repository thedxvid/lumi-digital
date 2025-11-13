import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { images, prompt, config } = await req.json()

    console.log('Creative Engine request:', { 
      imageCount: images?.length, 
      promptLength: prompt?.length,
      hasConfig: !!config
    })

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required and must be a string')
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error('At least one image is required')
    }

    if (images.length > 10) {
      throw new Error('Maximum 10 images allowed')
    }

    // Get Lovable API key from environment variables
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured')
    }

    // Build enhanced prompt with config if provided
    let enhancedPrompt = prompt;
    
    if (config) {
      enhancedPrompt = `🎨 CREATIVE DESIGN BRIEF - CRITICAL INSTRUCTIONS 🎨

═══════════════════════════════════════════════════════
⚠️ TOP PRIORITY: TEXT ACCURACY - NO EXCEPTIONS ⚠️
═══════════════════════════════════════════════════════

YOU ARE CREATING: ${config.creativeType} creative
FORMAT: ${config.format}
OBJECTIVE: ${config.objective}
TARGET MARKET: ${config.market}
AUDIENCE: ${config.targetAudience}

VISUAL SPECIFICATIONS:
→ Style: ${config.visualStyle}
→ Color Palette: ${config.colorPalette}
→ Typography: ${config.typography}
→ Tone: ${config.tone}

═══════════════════════════════════════════════════════
🔴 ABSOLUTE TEXT RENDERING REQUIREMENTS 🔴
═══════════════════════════════════════════════════════

MANDATORY RULES - FAILURE TO FOLLOW WILL BREAK THE CREATIVE:

1. COPY TEXT EXACTLY - Character by character, including:
   ✓ Portuguese accents: á é í ó ú â ê ô à ã õ
   ✓ Cedilla: ç
   ✓ ALL punctuation: ! ? . , : ; - " ' ( )
   ✓ Spacing and line breaks EXACTLY as provided
   ✓ Capital and lowercase letters EXACTLY as written

2. DO NOT under ANY circumstance:
   ✗ Fix grammar or spelling
   ✗ Change word order
   ✗ Add or remove words
   ✗ Apply autocorrection
   ✗ Translate anything
   ✗ Substitute similar characters
   ✗ "Improve" the text in any way

3. TEXT MUST BE:
   → Clearly readable (good contrast)
   → Properly positioned on the design
   → Well-spaced and legible
   → Using the specified typography: ${config.typography}

═══════════════════════════════════════════════════════
📝 TEXT CONTENT TO RENDER EXACTLY AS WRITTEN
═══════════════════════════════════════════════════════
${config.mainText ? `
▶ MAIN TEXT (Primary headline):
"${config.mainText}"
↳ Make this the MOST prominent text element
↳ Large, bold, eye-catching
↳ Character-by-character accuracy REQUIRED
` : ''}
${config.secondaryText ? `
▶ SECONDARY TEXT (Supporting information):
"${config.secondaryText}"
↳ Medium size, readable
↳ Supports the main message
↳ Character-by-character accuracy REQUIRED
` : ''}
${config.callToAction ? `
▶ CALL-TO-ACTION (CTA button/text):
"${config.callToAction}"
↳ Clear, actionable, prominent
↳ Use contrasting colors
↳ Character-by-character accuracy REQUIRED
` : ''}

═══════════════════════════════════════════════════════
🎨 DESIGN EXECUTION GUIDELINES
═══════════════════════════════════════════════════════

LAYOUT:
• Professional and visually striking
• Follow ${config.creativeType} best practices
• Optimized for ${config.format} format
• Hierarchy: Main Text → Secondary Text → CTA

COLOR:
• Apply ${config.colorPalette} palette consistently
• Ensure excellent text contrast (WCAG AA minimum)
• Use colors to guide attention flow

COMPOSITION:
• Integrate provided images seamlessly
• Create visual balance and harmony
• Draw attention to key message areas
• Professional, polished result

BRAND CONSISTENCY:
• Maintain ${config.tone} tone throughout
• Suitable for ${config.objective} objective
• Resonates with ${config.targetAudience}

═══════════════════════════════════════════════════════

ADDITIONAL CONTEXT:
${prompt}

FINAL REMINDER: Render all text EXACTLY character-by-character as provided above. Text accuracy is non-negotiable.`;
    }

    // Prepare the message content with images
    const imageContent = images.map((img: string) => ({
      type: "image_url",
      image_url: {
        url: img // Can be base64 or URL
      }
    }))

    const messageContent = [
      {
        type: "text",
        text: enhancedPrompt
      },
      ...imageContent
    ]

    console.log('Calling Lovable AI Gateway for image generation...')
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: "user",
            content: messageContent
          }
        ],
        modalities: ["image", "text"]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Lovable AI Gateway error:', response.status, errorText)
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Muitas requisições ao mesmo tempo. Tente novamente em alguns instantes.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        )
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'Créditos de IA esgotados. Por favor, adicione mais créditos.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        )
      }

      throw new Error(`AI Gateway error: ${response.status}`)
    }

    const data = await response.json()
    console.log('AI response received:', JSON.stringify(data, null, 2))

    // Extract the generated image from the response
    const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url

    if (!generatedImage) {
      console.error('Failed to extract image. Response structure:', {
        hasChoices: !!data.choices,
        hasMessage: !!data.choices?.[0]?.message,
        hasImages: !!data.choices?.[0]?.message?.images,
        messageContent: data.choices?.[0]?.message?.content,
        fullResponse: JSON.stringify(data)
      })
      throw new Error('No image generated by AI')
    }

    return new Response(
      JSON.stringify({ 
        generatedImage,
        description: data.choices?.[0]?.message?.content || 'Criativo gerado com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Creative Engine error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro ao processar criativo'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})