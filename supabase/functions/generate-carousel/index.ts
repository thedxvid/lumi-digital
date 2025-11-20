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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('Generation mode:', generationMode);
    console.log('Custom prompt:', customPrompt ? 'Present' : 'Missing');
    console.log('Slides config:', slides ? `${slides.length} slides` : 'None');
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
      console.log(`Processing slide ${i + 1}/${imageCount}...`, {
        imageMode: slide.imageMode,
        uploadedImageIndex: slide.uploadedImageIndex,
        hasVisualInstruction: !!slide.visualInstruction,
        generationMode
      });

      let imageUrl: string;
      let description: string;

      // Se o modo for 'upload', usar diretamente a imagem enviada
      if (slide.imageMode === 'upload' && slide.uploadedImageIndex !== null && uploadedImages[slide.uploadedImageIndex]) {
        console.log(`Using uploaded image ${slide.uploadedImageIndex} for slide ${i + 1}`);
        imageUrl = uploadedImages[slide.uploadedImageIndex];
        description = slide.visualInstruction || `Slide ${i + 1}`;
      } else {
        // Gerar imagem com IA
        let slidePrompt: string;
        const messageContent: any[] = [];

        if (slide.imageMode === 'generate-with-reference') {
          // Gerar usando fotos de referência (manter identidade visual)
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

          messageContent.push({
            type: "text",
            text: slidePrompt
          });

          // Adicionar todas as fotos de referência
          uploadedImages.forEach((img) => {
            messageContent.push({
              type: "image_url",
              image_url: { url: img }
            });
          });
        } else {
          // Gerar imagem do zero (sem referência)
          if (generationMode === 'prompt-only' && customPrompt) {
            // Modo prompt-only: usar o prompt customizado com contexto de sequência
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
            // Modo config normal
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

          messageContent.push({
            type: "text",
            text: slidePrompt
          });
        }

        console.log(`Calling AI to generate image for slide ${i + 1}...`);

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image-preview",
            messages: [
              {
                role: "user",
                content: messageContent,
              },
            ],
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
          
          throw new Error(`Failed to generate image for slide ${i + 1}: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        
        imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        description = data.choices?.[0]?.message?.content || slide.visualInstruction || `Slide ${i + 1}`;

        if (!imageUrl) {
          console.error(`No image URL for slide ${i + 1}:`, JSON.stringify(data, null, 2));
          throw new Error(`No image URL returned for slide ${i + 1}`);
        }
      }

      console.log(`✅ Generated image for slide ${i + 1} successfully`);
      
      // Store only the base image without text
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

    return new Response(
      JSON.stringify({
        success: true,
        carousel: carouselData,
        images,
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
