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
    
    // Get dimensions based on format
    const formatDimensions: Record<string, string> = {
      // Social Post
      'square': '1080x1080',
      'vertical': '1080x1350',
      'horizontal': '1200x675',
      // Story
      'story-vertical': '1080x1920',
      // Ad
      'ad-square': '1200x1200',
      'ad-horizontal': '1200x628',
      'ad-vertical': '1080x1350',
      // Banner
      'banner-wide': '1920x1080',
      'banner-ultra': '2560x1080',
      'banner-custom': '1920x1080',
      // Email
      'email-standard': '600x800',
      // Product
      'product-square': '1000x1000',
      'product-vertical': '1000x1333',
      // Infographic
      'infographic-vertical': '800x2000',
      'infographic-horizontal': '2000x800',
      // Free
      'free-square': '1080x1080',
      'free-custom': '1080x1080'
    };

    const dimensions = config?.format ? formatDimensions[config.format] || '1080x1080' : '1080x1080';
    const [width, height] = dimensions.split('x').map(Number);
    const aspectRatio = (width / height).toFixed(2);
    
    let enhancedPrompt = prompt;
    
    if (config) {
      enhancedPrompt = `🎨 VISUAL COMPOSITION ONLY - NO TEXT

IMPORTANT: Create a pure visual composition WITHOUT any text, words, or letters.

YOU ARE CREATING: ${config.creativeType} creative
FORMAT: ${config.format}
DIMENSIONS: ${dimensions} pixels (Aspect Ratio ${aspectRatio}:1)
${width > height ? 'ORIENTATION: Horizontal/Landscape' : width < height ? 'ORIENTATION: Vertical/Portrait' : 'ORIENTATION: Square'}

COMPOSITION REQUIREMENTS:
• Create image in EXACTLY ${dimensions} dimensions (${width}x${height} pixels)
• Maintain ${aspectRatio}:1 aspect ratio precisely
• Create a visually striking background/composition
• Professional, polished visual result
• Leave clear space for text overlay (will be added later)
• Integrate provided images seamlessly if any
• DO NOT include any text, letters, words, or typography

${config.customPrompt ? `ADDITIONAL DETAILS:\n${config.customPrompt}\n` : ''}

ADDITIONAL CONTEXT:
${prompt}

CRITICAL: This is a BASE IMAGE ONLY. Text will be overlaid programmatically later.
OUTPUT SIZE: ${width}x${height} pixels`;
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

    // Return base image only + suggested copy (if generated)
    const description = data.choices?.[0]?.message?.content || 'Creative base generated successfully'

    // Track API cost
    const authHeader = req.headers.get('authorization')
    if (authHeader) {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
      const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
      const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
      if (user) {
        await supabaseClient.from('api_cost_tracking').insert({
          user_id: user.id,
          feature_type: 'creative_image',
          api_provider: 'lovable_ai',
          cost_usd: 0.0015,
          metadata: { format: config?.format, prompt: prompt.substring(0, 100) }
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        baseImage,
        suggestedCopy: copyData || null,
        description
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