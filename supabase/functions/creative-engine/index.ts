import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // Get user info and determine API tier
    const authHeader = req.headers.get('authorization')
    let apiTier = 'standard' // default
    let userId: string | null = null
    let userHasByok = false
    let userFalKey: string | null = null

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
      if (user) {
        userId = user.id

        // Check user's api_tier from usage_limits
        const { data: limits } = await supabase
          .from('usage_limits')
          .select('api_tier, plan_type')
          .eq('user_id', user.id)
          .single()

        if (limits) {
          apiTier = limits.api_tier || 'standard'
          console.log(`🎨 User ${user.id} - Plan: ${limits.plan_type}, API Tier: ${apiTier}`)
        }

        // Check if user has admin role (admins use PRO API)
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single()

        if (roles) {
          apiTier = 'pro'
          console.log('👑 Admin user detected - using PRO API')
        }

        // Check if user has BYOK Fal.ai key configured
        const { data: userApiKey } = await supabase
          .from('user_api_keys')
          .select('api_key_encrypted, is_active, is_valid')
          .eq('user_id', user.id)
          .eq('provider', 'fal_ai')
          .eq('is_active', true)
          .single()

        if (userApiKey?.is_valid) {
          userHasByok = true
          // Decrypt the key - use the same encryption key as frontend
          const encryptionKey = 'lumi-api-key-secret-2024'
          const { data: decryptedKey } = await supabase.rpc('decrypt_api_key', {
            encrypted_text: userApiKey.api_key_encrypted,
            encryption_key: encryptionKey
          })
          if (decryptedKey) {
            userFalKey = decryptedKey
            apiTier = 'pro' // BYOK users can use PRO API
            console.log('🔑 User has BYOK Fal.ai key - using PRO API')
          }
        }
      }
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
    console.log(`🖼️ Using API tier: ${apiTier}`)
    
    // Get dimensions based on format
    const formatDimensions: Record<string, string> = {
      'square': '1080x1080',
      'vertical': '1080x1350',
      'horizontal': '1200x675',
      'story-vertical': '1080x1920',
      'ad-square': '1200x1200',
      'ad-horizontal': '1200x628',
      'ad-vertical': '1080x1350',
      'banner-wide': '1920x1080',
      'banner-ultra': '2560x1080',
      'banner-custom': '1920x1080',
      'email-standard': '600x800',
      'product-square': '1000x1000',
      'product-vertical': '1000x1333',
      'infographic-vertical': '800x2000',
      'infographic-horizontal': '2000x800',
      'free-square': '1080x1080',
      'free-custom': '1080x1080'
    };

    const dimensions = config?.format ? formatDimensions[config.format] || '1080x1080' : '1080x1080';
    const [width, height] = dimensions.split('x').map(Number);
    const aspectRatio = (width / height).toFixed(2);
    
    let enhancedPrompt = prompt;
    
    if (config) {
      // PRO tier ALWAYS uses full creative freedom with native text generation
      // The Nano Banana PRO model can render text directly from prompts
      if (apiTier === 'pro') {
        // Build text elements section only if specific fields are provided
        const textElements: string[] = [];
        if (config.mainText) textElements.push(`📌 MAIN TEXT/HEADLINE: "${config.mainText}"`);
        if (config.secondaryText) textElements.push(`📝 SECONDARY TEXT: "${config.secondaryText}"`);
        if (config.callToAction) textElements.push(`🔘 CALL TO ACTION BUTTON: "${config.callToAction}"`);
        
        // PRO tier: Full creative freedom with Nano Banana PRO - NEVER block text
        enhancedPrompt = `🎨 CREATIVE COMPOSITION

YOU ARE CREATING: ${config.creativeType} creative
FORMAT: ${config.format}
DIMENSIONS: ${dimensions} pixels (Aspect Ratio ${aspectRatio}:1)
${width > height ? 'ORIENTATION: Horizontal/Landscape' : width < height ? 'ORIENTATION: Vertical/Portrait' : 'ORIENTATION: Square'}

${textElements.length > 0 ? `TEXT ELEMENTS TO INCLUDE:\n${textElements.join('\n')}` : ''}

COMPOSITION REQUIREMENTS:
• Create image in EXACTLY ${dimensions} dimensions (${width}x${height} pixels)
• Maintain ${aspectRatio}:1 aspect ratio precisely
• Create a visually striking, professional composition
• Integrate provided images seamlessly if any
${textElements.length > 0 ? `• Render all text elements clearly, legibly, and beautifully integrated
• Use appropriate typography hierarchy (headline larger, secondary smaller)
• Ensure text contrasts well with background
• Make the CTA button stand out if provided` : '• Include any text elements described in the visual direction below'}

VISUAL DIRECTION:
${config.customPrompt || prompt}

OUTPUT SIZE: ${width}x${height} pixels`;
      } else {
        // STANDARD tier: Generate base image WITHOUT text (text added via canvas later)
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
    }

    let baseImage: string | undefined

    // Route to appropriate API based on tier
    if (apiTier === 'pro') {
      // Use Fal.ai Nano Banana PRO
      console.log('🚀 Using Fal.ai Nano Banana PRO API')
      
      const falApiKey = userHasByok && userFalKey ? userFalKey : Deno.env.get('FAL_KEY')
      
      if (!falApiKey) {
        throw new Error('Fal.ai API key not configured')
      }

      // Map aspect ratio for Fal.ai
      const falAspectRatio = width > height ? 'landscape_16_9' : 
                            width < height ? 'portrait_9_16' : 
                            'square_hd';

      // Use the synchronous endpoint directly for immediate results
      const falResponse = await fetch('https://fal.run/fal-ai/nano-banana-pro', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${falApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          image_size: falAspectRatio,
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          enable_safety_checker: true
        })
      })

      if (!falResponse.ok) {
        const errorText = await falResponse.text()
        console.error('Fal.ai API error:', falResponse.status, errorText)
        
        if (falResponse.status === 429) {
          return new Response(
            JSON.stringify({ 
              error: 'Muitas requisições ao mesmo tempo. Tente novamente em alguns instantes.'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
          )
        }

        if (falResponse.status === 402 || falResponse.status === 401) {
          return new Response(
            JSON.stringify({ 
              error: 'Créditos Fal.ai esgotados ou chave inválida. Verifique sua configuração.'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
          )
        }

        throw new Error(`Fal.ai API error: ${falResponse.status}`)
      }

      const falData = await falResponse.json()
      console.log('📦 Fal.ai response keys:', JSON.stringify(Object.keys(falData)))
      
      // Handle both sync and queue responses
      let imageData = falData
      
      // If we got a queue response, poll for the result
      if (falData.status && falData.response_url) {
        console.log('⏳ Got queue response, polling for result...')
        let attempts = 0
        const maxAttempts = 60 // Max 60 seconds
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const statusResponse = await fetch(falData.response_url, {
            headers: { 'Authorization': `Key ${falApiKey}` }
          })
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            console.log('📦 Poll response status:', statusData.status)
            
            if (statusData.status === 'COMPLETED' || statusData.images) {
              imageData = statusData
              break
            } else if (statusData.status === 'FAILED') {
              throw new Error('Fal.ai generation failed')
            }
          }
          attempts++
        }
        
        if (attempts >= maxAttempts) {
          throw new Error('Fal.ai generation timed out')
        }
      }
      
      // Extract image from the result
      baseImage = imageData.images?.[0]?.url || 
                  imageData.images?.[0]?.image_url ||
                  imageData.output?.images?.[0]?.url ||
                  (typeof imageData.images?.[0] === 'string' ? imageData.images[0] : undefined)

      console.log('✅ Fal.ai Nano Banana PRO image generated, baseImage exists:', !!baseImage)

      // Track API cost for Fal.ai
      if (userId) {
        await supabase.from('api_cost_tracking').insert({
          user_id: userId,
          feature_type: 'creative_image',
          api_provider: userHasByok ? 'fal_ai_byok' : 'fal_ai',
          cost_usd: userHasByok ? 0 : 0.003, // BYOK users don't cost us
          metadata: { format: config?.format, prompt: prompt.substring(0, 100), model: 'nano-banana-pro' }
        })
      }

    } else {
      // Use Lovable AI Gateway (standard tier)
      console.log('🌐 Using Lovable AI Gateway (gemini-2.5-flash-image-preview)')
      
      const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
      if (!lovableApiKey) {
        throw new Error('Lovable API key not configured')
      }

      // Prepare the message content with images
      const imageContent = images.map((img: string) => ({
        type: "image_url",
        image_url: { url: img }
      }))

      const messageContent = [
        { type: "text", text: enhancedPrompt },
        ...imageContent
      ]

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [{ role: "user", content: messageContent }],
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
      baseImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url

      console.log('✅ Lovable AI Gateway image generated successfully')

      // Track API cost for Lovable AI
      if (userId) {
        await supabase.from('api_cost_tracking').insert({
          user_id: userId,
          feature_type: 'creative_image',
          api_provider: 'lovable_ai',
          cost_usd: 0.0015,
          metadata: { format: config?.format, prompt: prompt.substring(0, 100) }
        })
      }
    }

    if (!baseImage) {
      console.error('Failed to extract base image')
      throw new Error('Failed to extract generated image from AI response')
    }

    console.log('🎉 Base image generated successfully')

    return new Response(
      JSON.stringify({ 
        baseImage,
        suggestedCopy: copyData || null,
        description: 'Creative base generated successfully',
        apiTier
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
