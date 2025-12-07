import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SlideConfig {
  title: string;
  content: string;
  visualElements: string[];
  highlight?: string;
  imageMode: 'upload' | 'generate' | 'generate-with-reference';
  uploadedImageIndex: number | null;
  visualInstruction: string;
  headline?: string;
  secondaryText?: string;
  ctaText?: string;
  textColor?: string;
}

interface GenerateCarouselRequest {
  title: string;
  imageCount: number;
  theme: string;
  colorPalette: string;
  tone: string;
  callToAction?: string;
  slides: SlideConfig[];
  generationMode?: 'config' | 'prompt-only';
  customPrompt?: string;
  uploadedImages?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { 
      title,
      imageCount = 3,
      theme,
      colorPalette,
      tone,
      callToAction,
      slides,
      generationMode = 'config',
      customPrompt,
      uploadedImages = []
    }: GenerateCarouselRequest = await req.json();

    // Validação baseada no modo
    if (generationMode === 'prompt-only') {
      if (!title || imageCount < 2 || imageCount > 10 || !customPrompt) {
        return new Response(
          JSON.stringify({ error: "Invalid request. Title, imageCount (2-10), and customPrompt required for prompt-only mode" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      if (!title || imageCount < 2 || imageCount > 10 || !slides || slides.length !== imageCount) {
        return new Response(
          JSON.stringify({ error: "Invalid request. Title required, imageCount must be 2-10, and slides must match imageCount" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get user's api_tier and plan_type
    const { data: limits } = await supabase
      .from('usage_limits')
      .select('api_tier, plan_type, carousel_images_monthly_limit, carousel_images_monthly_used')
      .eq('user_id', user.id)
      .single();

    const apiTier = limits?.api_tier || 'standard';
    const planType = limits?.plan_type || 'basic';
    const isLumiPlan = planType === 'lumi';

    console.log(`🎠 User ${user.id} - Plan: ${planType}, API Tier: ${apiTier}`);

    // Check if user has admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    const isAdmin = !!roles;
    const useProApi = apiTier === 'pro' || isAdmin;

    // For Lumi plan, check carousel_images limit
    if (isLumiPlan) {
      const carouselImagesLimit = limits?.carousel_images_monthly_limit || 30;
      const carouselImagesUsed = limits?.carousel_images_monthly_used || 0;
      const imagesRemaining = carouselImagesLimit - carouselImagesUsed;

      if (imageCount > imagesRemaining) {
        return new Response(
          JSON.stringify({ 
            error: `Limite de imagens de carrossel atingido. Restam ${imagesRemaining} imagens este mês.`,
            remaining: imagesRemaining
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check for BYOK Fal.ai key
    let userFalKey: string | null = null;
    let userHasByok = false;

    const { data: userApiKey } = await supabase
      .from('user_api_keys')
      .select('api_key_encrypted, is_active, is_valid')
      .eq('user_id', user.id)
      .eq('provider', 'fal_ai')
      .eq('is_active', true)
      .single();

    if (userApiKey?.is_valid) {
      userHasByok = true;
      // Use the same encryption key as creative-engine for consistency
      const encryptionKey = 'lumi-api-key-secret-2024';
      const { data: decryptedKey } = await supabase.rpc('decrypt_api_key', {
        encrypted_text: userApiKey.api_key_encrypted,
        encryption_key: encryptionKey
      });
      if (decryptedKey) {
        userFalKey = decryptedKey;
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const FAL_KEY = Deno.env.get("FAL_KEY");

    if (!useProApi && !LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (useProApi && !FAL_KEY && !userFalKey) {
      return new Response(JSON.stringify({ error: "FAL_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('Generation mode:', generationMode);
    console.log('API mode:', useProApi ? 'Fal.ai Nano Banana PRO' : 'Lovable AI Gateway');
    console.log(`Generating carousel "${title}" with ${imageCount} images`);

    // Theme descriptions for better prompts
    const themeDescriptions: Record<string, string> = {
      minimalist: "clean, simple, lots of whitespace, minimalist design",
      vibrant: "colorful, energetic, dynamic, bold colors",
      professional: "corporate, clean, business-like, professional aesthetic",
      modern: "contemporary, sleek, modern design trends",
      creative: "artistic, unique, creative composition",
      elegant: "sophisticated, refined, elegant styling"
    };

    const paletteDescriptions: Record<string, string> = {
      warm: "warm color palette (reds, oranges, yellows)",
      cool: "cool color palette (blues, greens, purples)",
      pastel: "soft pastel colors",
      complementary: "complementary color combinations",
      monochromatic: "monochromatic color scheme",
      vibrant: "vibrant gradient colors"
    };

    const toneDescriptions: Record<string, string> = {
      professional: "professional and formal tone",
      casual: "casual and friendly tone",
      motivational: "motivational and inspiring tone",
      educational: "educational and informative tone",
      sales: "persuasive sales-focused tone",
      inspirational: "inspirational and uplifting tone"
    };

    // Create virtual slides for prompt-only mode
    let slidesToProcess: SlideConfig[];
    
    if (generationMode === 'prompt-only' && customPrompt) {
      console.log('Creating virtual slides from custom prompt...');
      slidesToProcess = [];
      
      for (let i = 0; i < imageCount; i++) {
        slidesToProcess.push({
          title: `Slide ${i + 1}`,
          content: `${customPrompt} (Slide ${i + 1} of ${imageCount})`,
          visualElements: [],
          imageMode: 'generate',
          uploadedImageIndex: null,
          visualInstruction: customPrompt
        });
      }
    } else {
      slidesToProcess = slides;
    }

    // Generate multiple images sequentially
    const images: { url: string; description: string; copy?: { headline: string; secondary: string; cta: string } }[] = [];

    for (let i = 0; i < imageCount; i++) {
      const slide = slidesToProcess[i];
      console.log(`Processing slide ${i + 1}/${imageCount}...`);

      let imageUrl: string;
      let description: string;

        // Se o modo for 'upload', verificar se tem texto nativo para processar
        if (slide.imageMode === 'upload' && slide.uploadedImageIndex !== null && uploadedImages[slide.uploadedImageIndex]) {
          const uploadedImage = uploadedImages[slide.uploadedImageIndex];
          const hasNativeText = slide.headline || slide.secondaryText || slide.ctaText;
          
          console.log(`🔍 Upload mode - Slide ${i + 1}:`, {
            hasNativeText,
            hasVisualInstruction: Boolean(slide.visualInstruction),
            uploadedImageIndex: slide.uploadedImageIndex
          });
          
          if (useProApi && hasNativeText) {
            // PRO tier with text: Use /edit endpoint to add text overlay to uploaded image
            console.log(`Processing uploaded image ${slide.uploadedImageIndex} with native text for slide ${i + 1}...`);
            
            const textElements: string[] = [];
            if (slide.headline) textElements.push(`📌 HEADLINE: "${slide.headline}"`);
            if (slide.secondaryText) textElements.push(`📝 SECONDARY TEXT: "${slide.secondaryText}"`);
            if (slide.ctaText) textElements.push(`🔘 CALL TO ACTION: "${slide.ctaText}"`);
            
            // Text color instruction for upload mode
            const colorInstruction = slide.textColor 
              ? `TEXT COLOR: Use ${slide.textColor} for all text.`
              : 'TEXT COLOR: Use white (#FFFFFF) with shadow.';
            
            // PROTEÇÃO: Prompt muito restritivo para NÃO alterar pessoas
            const editPrompt = `
⚠️ CRITICAL INSTRUCTION - TEXT OVERLAY ONLY ⚠️

This is EXCLUSIVELY a text overlay task. You MUST:

🔒 PRESERVE 100% - DO NOT CHANGE:
- Every person's face, body, pose, expression, skin, hair
- All colors, lighting, shadows, and composition
- Background and all scene elements
- Original image quality and resolution

✅ ONLY ADD TEXT OVERLAY:
${textElements.join('\n')}

${colorInstruction}

❌ ABSOLUTELY DO NOT:
- Change, swap, alter, or modify any person's appearance
- Replace or regenerate any face or body
- Modify backgrounds, colors, or lighting
- Regenerate any part of the image

Think of this as adding a TRANSPARENT TEXT LAYER on top of a photograph.
The underlying photograph must remain EXACTLY the same.

${slide.visualInstruction && !slide.visualInstruction.toLowerCase().includes('pessoa') && !slide.visualInstruction.toLowerCase().includes('rosto') && !slide.visualInstruction.toLowerCase().includes('face') ? `MINOR STYLE ADJUSTMENTS (text only): ${slide.visualInstruction}` : ''}

TYPOGRAPHY:
- Render text as floating overlay layer in the specified color
- Professional font styling with good contrast
- Keep text away from faces
- Use safe margins (80px from edges)
          `.trim();

          const falApiKey = userHasByok && userFalKey ? userFalKey : FAL_KEY;
          
          const falResponse = await fetch('https://fal.run/fal-ai/nano-banana-pro/edit', {
            method: 'POST',
            headers: {
              'Authorization': `Key ${falApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: editPrompt,
              image_urls: [uploadedImage],
              image_size: 'square_hd',
              num_inference_steps: 28,
              guidance_scale: 4.5,
              num_images: 1,
              enable_safety_checker: true
            })
          });

          if (!falResponse.ok) {
            const errorText = await falResponse.text();
            console.error(`Fal.ai /edit API error for slide ${i + 1}:`, falResponse.status, errorText);
            
            if (falResponse.status === 429) {
              throw new Error("Rate limit exceeded. Please try again in a few moments.");
            }
            if (falResponse.status === 402 || falResponse.status === 401) {
              throw new Error("Insufficient Fal.ai credits or invalid API key.");
            }
            
            throw new Error(`Failed to add text to image for slide ${i + 1}: ${falResponse.status}`);
          }

          const falData = await falResponse.json();
          console.log(`📦 Fal.ai /edit response for slide ${i + 1}:`, JSON.stringify(Object.keys(falData)));
          
          imageUrl = falData.images?.[0]?.url || 
                     falData.images?.[0]?.image_url ||
                     (typeof falData.images?.[0] === 'string' ? falData.images[0] : undefined);
          
          if (!imageUrl) {
            console.error(`No image URL from /edit for slide ${i + 1}, falling back to original`);
            imageUrl = uploadedImage;
          }
          
          description = slide.headline || slide.visualInstruction || `Slide ${i + 1}`;
        } else {
          // No text or standard tier: use original uploaded image
          console.log(`Using uploaded image ${slide.uploadedImageIndex} directly for slide ${i + 1}`);
          imageUrl = uploadedImage;
          description = slide.visualInstruction || `Slide ${i + 1}`;
        }
      } else {
        // Build the prompt
        let slidePrompt: string;

        if (slide.imageMode === 'generate-with-reference') {
          // Check if slide has native text elements for generate-with-reference mode
          const hasNativeText = slide.headline || slide.secondaryText || slide.ctaText;
          
          if (useProApi && hasNativeText) {
            // PRO tier with native text - include text in the generation
            const textElements: string[] = [];
            if (slide.headline) textElements.push(`📌 HEADLINE: "${slide.headline}"`);
            if (slide.secondaryText) textElements.push(`📝 SECONDARY TEXT: "${slide.secondaryText}"`);
            if (slide.ctaText) textElements.push(`🔘 CALL TO ACTION: "${slide.ctaText}"`);
            
            // Text color instruction for generate-with-reference
            const colorInstruction = slide.textColor 
              ? `TEXT COLOR: Use ${slide.textColor} for all text elements. Ensure good contrast.`
              : 'TEXT COLOR: Use white (#FFFFFF) with subtle shadow for readability.';
            
            slidePrompt = `
🎨 CAROUSEL SLIDE ${i + 1} OF ${imageCount}

VISUAL INSTRUCTION: ${slide.visualInstruction}

TEXT ELEMENTS TO RENDER DIRECTLY ON IMAGE:
${textElements.join('\n')}

${colorInstruction}

THEME: ${themeDescriptions[theme] || theme}
COLOR PALETTE: ${paletteDescriptions[colorPalette] || colorPalette}

CRITICAL DESIGN REQUIREMENTS:
- Use the reference images provided to maintain the person's visual identity
- Keep the person's face, hair, body type, and overall appearance identical to the reference photos
- DO NOT change or replace the person
- Apply the visual transformation/scenario requested while preserving identity
- Make it look natural and realistic
- Square aspect ratio (1:1) for Instagram carousel

TYPOGRAPHY REQUIREMENTS:
- Render all text clearly and legibly in the specified color as a FLOATING GRAPHIC DESIGN LAYER
- Use appropriate typography hierarchy (headline larger, secondary smaller)
- Ensure text contrasts well with background
- Make the CTA button/text stand out if provided
- Professional font styling
- NEVER place text inside scene objects (signs, walls, screens)
- Use safe margins (keep text at least 80px from edges)
            `.trim();
          } else {
            // Standard tier or no native text
            slidePrompt = `
🎨 CAROUSEL SLIDE ${i + 1} OF ${imageCount}

VISUAL INSTRUCTION: ${slide.visualInstruction}

THEME: ${themeDescriptions[theme] || theme}
COLOR PALETTE: ${paletteDescriptions[colorPalette] || colorPalette}

CRITICAL DESIGN REQUIREMENTS:
- Generate ONLY the VISUAL composition WITHOUT any text, words, letters, or typography
- Create the background, elements, and visual aesthetic based on the visual instruction
- All text will be added separately using professional typography
- Professional visual aesthetic throughout
- Use the reference images provided to maintain the person's visual identity
- Keep the person's face, hair, body type, and overall appearance identical to the reference photos
- DO NOT change or replace the person
- Apply the visual transformation/scenario requested while preserving identity
- Make it look natural and realistic
- Square aspect ratio (1:1) for Instagram carousel

IMPORTANT: NO TEXT, NO WORDS, NO LETTERS - ONLY VISUAL ELEMENTS
            `.trim();
          }
        } else if (generationMode === 'prompt-only' && customPrompt) {
          slidePrompt = `
🎨 CAROUSEL SLIDE ${i + 1} OF ${imageCount}

USER REQUEST: ${customPrompt}

CRITICAL INSTRUCTION: 
Generate ONLY the VISUAL composition WITHOUT any text, words, letters, or typography.
Create the background, elements, and visual aesthetic ONLY.
All text will be added separately using professional typography.

IMPORTANT INSTRUCTIONS FOR THIS SLIDE:
- This is part of a ${imageCount}-slide carousel sequence
- Create slide ${i + 1} that follows the user's request above
- Maintain VISUAL CONSISTENCY across all slides in the carousel
- Each slide should build upon or complement the previous ones
- Generate PURE VISUALS: backgrounds, colors, shapes, illustrations, photos - NO TEXT
- Square aspect ratio (1:1) for Instagram carousel
${theme ? `- Theme: ${themeDescriptions[theme] || theme}` : ''}
${colorPalette ? `- Color palette: ${paletteDescriptions[colorPalette] || colorPalette}` : ''}
${tone ? `- Tone: ${toneDescriptions[tone] || tone}` : ''}
${i === 0 ? '\n- This is the FIRST slide - make it eye-catching and engaging' : ''}

REMEMBER: NO TEXT, NO WORDS, NO LETTERS - ONLY VISUAL ELEMENTS
          `.trim();
        } else {
          // Check if slide has native text elements
          const hasNativeText = slide.headline || slide.secondaryText || slide.ctaText;
          
          if (useProApi && hasNativeText) {
            // PRO tier with native text - render text directly in the image
            const textElements: string[] = [];
            if (slide.headline) textElements.push(`📌 HEADLINE: "${slide.headline}"`);
            if (slide.secondaryText) textElements.push(`📝 SECONDARY TEXT: "${slide.secondaryText}"`);
            if (slide.ctaText) textElements.push(`🔘 CALL TO ACTION: "${slide.ctaText}"`);
            
            // Text color instruction
            const colorInstruction = slide.textColor 
              ? `TEXT COLOR: Use ${slide.textColor} for all text elements. Ensure good contrast with background.`
              : 'TEXT COLOR: Use white (#FFFFFF) with subtle shadow for readability.';
            
            slidePrompt = `
🎨 CAROUSEL SLIDE ${i + 1} OF ${imageCount}

VISUAL INSTRUCTION: ${slide.visualInstruction}

TEXT ELEMENTS TO RENDER DIRECTLY ON IMAGE:
${textElements.join('\n')}

${colorInstruction}

DESIGN SPECIFICATIONS:
- Square aspect ratio (1:1) optimized for Instagram carousel
- Theme: ${themeDescriptions[theme] || theme}
- Color palette: ${paletteDescriptions[colorPalette] || colorPalette}
- Tone: ${toneDescriptions[tone] || tone}
${i === 0 ? '\n- This is the FIRST slide - make it eye-catching and engaging to hook the viewer' : ''}

TYPOGRAPHY REQUIREMENTS:
- Render all text clearly and legibly in the specified color
- Use appropriate typography hierarchy (headline larger, secondary smaller)
- Ensure text contrasts well with background
- Make the CTA button/text stand out if provided
- Professional font styling that matches the theme

CRITICAL:
- Professional visual aesthetic throughout
- Integrate text naturally into the composition
- Maintain visual consistency with professional standards
            `.trim();
          } else {
            // Standard tier or no native text - generate visuals only
            slidePrompt = `
🎨 CAROUSEL SLIDE ${i + 1} OF ${imageCount}

CRITICAL INSTRUCTION: 
Generate ONLY the VISUAL composition WITHOUT any text, words, letters, or typography.
Create the background, elements, and visual aesthetic ONLY.
All text will be added separately using professional typography.

VISUAL INSTRUCTION: ${slide.visualInstruction}

DESIGN SPECIFICATIONS:
- Generate PURE VISUALS: backgrounds, colors, shapes, illustrations, photos - NO TEXT
- Square aspect ratio (1:1) optimized for Instagram carousel
- Theme: ${themeDescriptions[theme] || theme}
- Color palette: ${paletteDescriptions[colorPalette] || colorPalette}
- Tone: ${toneDescriptions[tone] || tone}
${i === 0 ? '\n- This is the FIRST slide - make it eye-catching and engaging to hook the viewer' : ''}

REMEMBER: NO TEXT, NO WORDS, NO LETTERS - ONLY VISUAL ELEMENTS

CRITICAL:
- Professional visual aesthetic throughout
- Create space for text overlay (text will be added separately)
- Focus on creating compelling visual backgrounds and elements
- Maintain visual consistency with professional standards
            `.trim();
          }
        }

        console.log(`Calling ${useProApi ? 'Fal.ai' : 'Lovable AI'} to generate image for slide ${i + 1}...`);

        if (useProApi) {
          // Use Fal.ai Nano Banana PRO
          const falApiKey = userHasByok && userFalKey ? userFalKey : FAL_KEY;

          // Check if we need to use edit endpoint (with reference images)
          const useEditEndpoint = slide.imageMode === 'generate-with-reference' && uploadedImages.length > 0;
          
          // Log detalhado para debug
          console.log(`🔍 Slide ${i + 1} processing:`, {
            imageMode: slide.imageMode,
            endpoint: useEditEndpoint ? '/edit' : '/standard',
            referenceImagesCount: uploadedImages.length,
            hasNativeText: Boolean(slide.headline || slide.secondaryText || slide.ctaText),
            promptPreview: slidePrompt.substring(0, 150) + '...'
          });
          
          let falResponse;
          
          if (useEditEndpoint) {
            // Use edit endpoint with reference images for identity preservation
            console.log(`🎭 Identity preservation mode for slide ${i + 1} - using ${uploadedImages.length} reference image(s)`);
            
            // Prompt aprimorado para preservação de identidade
            const identityPrompt = `
${slidePrompt}

🎭 CRITICAL IDENTITY PRESERVATION INSTRUCTIONS:

STEP 1 - ANALYZE THE REFERENCE PHOTO(S):
- Study the person's facial structure, bone structure, face shape
- Note the exact skin tone, complexion, and any distinguishing features
- Observe hair color, texture, style, and length
- Analyze body type, posture, and proportions

STEP 2 - GENERATE A NEW IMAGE:
- Create a COMPLETELY NEW photograph in the requested scenario
- The person in the new image must have the EXACT same face as the reference
- DO NOT copy-paste or cut the body - generate naturally
- The pose, clothing, and angle can be different
- Make it look like a real professional photograph

STEP 3 - QUALITY CHECK:
- The face must be recognizable as the SAME person
- Natural, realistic lighting and shadows
- Professional photography quality
- The person should look natural in the new environment

⚠️ DO NOT:
- Simply paste the reference image into a new background
- Change the person's face or identity
- Make the image look artificial or composited
            `.trim();
            
            falResponse = await fetch('https://fal.run/fal-ai/nano-banana-pro/edit', {
              method: 'POST',
              headers: {
                'Authorization': `Key ${falApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt: identityPrompt,
                image_urls: uploadedImages,
                image_size: 'square_hd',
                num_inference_steps: 28,
                guidance_scale: 4.0, // Ligeiramente maior para melhor aderência ao prompt
                num_images: 1,
                enable_safety_checker: true
              })
            });
          } else {
            // Standard generation without reference images
            falResponse = await fetch('https://fal.run/fal-ai/nano-banana-pro', {
              method: 'POST',
              headers: {
                'Authorization': `Key ${falApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt: slidePrompt,
                image_size: 'square_hd',
                num_inference_steps: 28,
                guidance_scale: 3.5,
                num_images: 1,
                enable_safety_checker: true
              })
            });
          }

          if (!falResponse.ok) {
            const errorText = await falResponse.text();
            console.error(`Fal.ai API error for slide ${i + 1}:`, falResponse.status, errorText);
            
            if (falResponse.status === 429) {
              throw new Error("Rate limit exceeded. Please try again in a few moments.");
            }
            if (falResponse.status === 402 || falResponse.status === 401) {
              throw new Error("Insufficient Fal.ai credits or invalid API key.");
            }
            
            throw new Error(`Failed to generate image for slide ${i + 1}: ${falResponse.status}`);
          }

          const falData = await falResponse.json();
          console.log(`📦 Fal.ai response for slide ${i + 1}:`, JSON.stringify(Object.keys(falData)));
          
          // Fallback for multiple URL formats
          imageUrl = falData.images?.[0]?.url || 
                     falData.images?.[0]?.image_url ||
                     (typeof falData.images?.[0] === 'string' ? falData.images[0] : undefined);
          description = slide.visualInstruction || `Slide ${i + 1}`;

        } else {
          // Use Lovable AI Gateway
          const messageContent: any[] = [{ type: "text", text: slidePrompt }];
          
          if (slide.imageMode === 'generate-with-reference') {
            uploadedImages.forEach((img) => {
              messageContent.push({
                type: "image_url",
                image_url: { url: img }
              });
            });
          }

          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image-preview",
              messages: [{ role: "user", content: messageContent }],
              modalities: ["image", "text"],
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`AI API error for slide ${i + 1}:`, response.status, errorText);
            
            if (response.status === 429) {
              throw new Error("Rate limit exceeded. Please try again in a few moments.");
            }
            if (response.status === 402) {
              throw new Error("Insufficient credits. Please add credits to your Lovable AI workspace.");
            }
            
            throw new Error(`Failed to generate image for slide ${i + 1}: ${response.status}`);
          }

          const data = await response.json();
          imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          description = data.choices?.[0]?.message?.content || slide.visualInstruction || `Slide ${i + 1}`;
        }

        if (!imageUrl) {
          console.error(`No image URL for slide ${i + 1}`);
          throw new Error(`No image URL returned for slide ${i + 1}`);
        }
      }

      console.log(`✅ Generated image for slide ${i + 1} successfully`);
      images.push({ url: imageUrl, description });
      
      // Add small delay between requests to avoid rate limiting
      if (i < imageCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Save to database
    const { data: carouselData, error: saveError } = await supabase
      .from("carousel_history")
      .insert({
        user_id: user.id,
        title,
        prompt: generationMode === 'prompt-only' && customPrompt 
          ? customPrompt 
          : slides.map(s => s.content).join(' | '),
        image_count: imageCount,
        images,
        theme,
        color_palette: colorPalette,
        tone,
        call_to_action: callToAction,
        slides_config: generationMode === 'prompt-only' ? null : slides,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving carousel:", saveError);
      return new Response(JSON.stringify({ error: "Failed to save carousel" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Carousel generated successfully:", carouselData.id);

    // Update usage limits based on plan type
    if (isLumiPlan) {
      // For Lumi plan, increment carousel_images_monthly_used
      await supabase
        .from('usage_limits')
        .update({
          carousel_images_monthly_used: (limits?.carousel_images_monthly_used || 0) + imageCount
        })
        .eq('user_id', user.id);
      
      console.log(`📊 Updated carousel_images_monthly_used +${imageCount} for Lumi user`);
    } else {
      // For other plans, increment carousels_monthly_used
      await supabase
        .from('usage_limits')
        .update({
          carousels_monthly_used: (limits?.carousels_monthly_used || 0) + 1
        })
        .eq('user_id', user.id);
    }

    // Track API cost
    await supabase.from('api_cost_tracking').insert({
      user_id: user.id,
      feature_type: 'carousel',
      api_provider: useProApi ? (userHasByok ? 'fal_ai_byok' : 'fal_ai') : 'lovable_ai',
      cost_usd: useProApi ? (userHasByok ? 0 : 0.003 * imageCount) : 0.015,
      metadata: { title, imageCount, theme, apiTier }
    });

    return new Response(
      JSON.stringify({
        success: true,
        carousel: carouselData,
        images,
        apiTier: useProApi ? 'pro' : 'standard'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-carousel function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
