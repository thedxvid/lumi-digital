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
      enhancedPrompt = `Create a professional ${config.creativeType} creative with the following specifications:

OBJECTIVE: ${config.objective}
TARGET: ${config.market} - ${config.targetAudience}
FORMAT: ${config.format}

VISUAL STYLE:
- Style: ${config.visualStyle}
- Color Palette: ${config.colorPalette}
- Typography: ${config.typography}
- Tone: ${config.tone}

⚠️ CRITICAL TEXT RENDERING INSTRUCTIONS - HIGHEST PRIORITY ⚠️
YOU MUST FOLLOW THESE RULES EXACTLY:
- Reproduce ALL text EXACTLY as written below, character by character
- Pay SPECIAL ATTENTION to Portuguese special characters: ç ã õ á é í ó ú â ê ô à ñ
- DO NOT change, rephrase, correct, or "fix" any words under ANY circumstance
- DO NOT apply spell checking or autocorrection
- Maintain EXACT spelling, including ALL accents, cedillas, and tildes
- If uncertain about any character, use the EXACT Unicode character provided
- Text accuracy is MORE IMPORTANT than visual perfection
- Even if a word looks wrong to you, render it EXACTLY as provided

CONTENT TO RENDER EXACTLY (CHARACTER-BY-CHARACTER):
${config.mainText ? `- Main Text: "${config.mainText}" ← RENDER EXACTLY AS WRITTEN, DO NOT ALTER ANY CHARACTER` : ''}
${config.secondaryText ? `- Secondary Text: "${config.secondaryText}" ← RENDER EXACTLY AS WRITTEN, DO NOT ALTER ANY CHARACTER` : ''}
${config.callToAction ? `- Call-to-Action: "${config.callToAction}" ← RENDER EXACTLY AS WRITTEN, DO NOT ALTER ANY CHARACTER` : ''}

DESIGN REQUIREMENTS:
- Create a visually striking and professional creative
- Ensure text is readable and well-positioned
- Use the specified color palette and visual style
- Make it suitable for ${config.objective} objective
- Target the ${config.targetAudience} audience
- Follow ${config.creativeType} best practices
- Apply ${config.typography} typography principles

REMEMBER: TEXT ACCURACY IS THE TOP PRIORITY. Render every character exactly as provided above.

Use the provided images as base and integrate them seamlessly into the design.
${prompt}`;
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