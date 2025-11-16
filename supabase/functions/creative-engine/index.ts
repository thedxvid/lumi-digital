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

    console.log('Creative Engine request (Hybrid Mode):', { 
      imageCount: images?.length, 
      promptLength: prompt?.length,
      hasConfig: !!config
    })

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required and must be a string')
    }

    if (!images || !Array.isArray(images)) {
      throw new Error('Images must be an array (can be empty)')
    }

    if (images.length > 10) {
      throw new Error('Maximum 10 images allowed')
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured')
    }

    // STEP 1: Generate copy using LLM (if config provided)
    let copyData = null
    if (config) {
      console.log('Step 1: Generating copy with LLM...')
      try {
        const copyResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-copy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || '',
          },
          body: JSON.stringify({ config, customPrompt: prompt })
        })

        if (copyResponse.ok) {
          copyData = await copyResponse.json()
          console.log('Generated copy:', copyData)
        } else {
          console.warn('Copy generation failed, using config values')
        }
      } catch (e) {
        console.warn('Copy generation error:', e)
      }

      // Fallback to config values if copy generation failed
      if (!copyData) {
        copyData = {
          headline: config.mainText || '',
          secondary: config.secondaryText || '',
          cta: config.callToAction || ''
        }
      }
    }

    // STEP 2: Generate base image WITHOUT text
    console.log('Step 2: Generating base image without text...')
    
    let enhancedPrompt = prompt;
    
    if (config) {
      enhancedPrompt = `🎨 VISUAL COMPOSITION ONLY - NO TEXT

IMPORTANT: Create a pure visual composition WITHOUT any text, words, or letters.

YOU ARE CREATING: ${config.creativeType} creative
FORMAT: ${config.format}
OBJECTIVE: ${config.objective}
TARGET MARKET: ${config.market}
AUDIENCE: ${config.targetAudience}

VISUAL SPECIFICATIONS:
→ Style: ${config.visualStyle}
→ Color Palette: ${config.colorPalette}
→ Tone: ${config.tone}

COMPOSITION REQUIREMENTS:
• Create a visually striking background/composition
• Use the specified color palette: ${config.colorPalette}
• Apply the visual style: ${config.visualStyle}
• Leave clear space for text overlay (will be added later)
• Professional, polished visual result
• Integrate provided images seamlessly
• DO NOT include any text, letters, words, or typography

ADDITIONAL CONTEXT:
${prompt}

CRITICAL: This is a BASE IMAGE ONLY. Text will be overlaid programmatically later.`;
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
    console.log('AI response received')

    // Extract the base image from the response
    const baseImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url

    if (!baseImage) {
      console.error('Failed to extract base image')
      throw new Error('Failed to extract generated image from AI response')
    }

    console.log('Base image generated successfully')

    // STEP 3: Compose final creative with text overlay
    let finalImage = baseImage
    let description = data.choices?.[0]?.message?.content || 'Creative generated successfully'

    if (copyData && config) {
      console.log('Step 3: Composing final creative with text overlay...')
      try {
        const composeResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/compose-creative`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || '',
          },
          body: JSON.stringify({ 
            baseImage, 
            copy: copyData,
            config 
          })
        })

        if (composeResponse.ok) {
          const composeData = await composeResponse.json()
          finalImage = composeData.image
          description = composeData.description
          console.log('Final creative composed successfully')
        } else {
          console.warn('Composition failed, returning base image')
        }
      } catch (e) {
        console.warn('Composition error:', e, '- returning base image')
      }
    }

    return new Response(
      JSON.stringify({ 
        generatedImage: finalImage,
        description,
        hybrid: !!copyData
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