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
}

interface GenerateCarouselRequest {
  title: string;
  imageCount: number;
  theme: string;
  colorPalette: string;
  tone: string;
  callToAction?: string;
  slides: SlideConfig[];
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
      slides
    }: GenerateCarouselRequest = await req.json();

    if (!title || imageCount < 2 || imageCount > 10 || !slides || slides.length !== imageCount) {
      return new Response(
        JSON.stringify({ error: "Invalid request. Title required, imageCount must be 2-10, and slides must match imageCount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      "high-contrast": "high contrast colors",
      monochrome: "monochromatic color scheme",
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

    // Generate multiple images sequentially
    const images: { url: string; description: string }[] = [];

    for (let i = 0; i < imageCount; i++) {
      const slide = slides[i];
      
      // Build comprehensive prompt for each slide
      const visualElementsText = slide.visualElements.length > 0 
        ? `Include visual elements: ${slide.visualElements.join(", ")}.`
        : "";
      
      const highlightText = slide.highlight 
        ? `Highlight this text prominently: "${slide.highlight}".`
        : "";
      
      const ctaText = callToAction 
        ? `Include call-to-action button: "${callToAction}".`
        : "";

      const imagePrompt = `Create a ${themeDescriptions[theme] || "modern"} carousel slide image (slide ${i + 1} of ${imageCount}) with ${paletteDescriptions[colorPalette] || "vibrant colors"}.

Title: "${slide.title}"
Content: ${slide.content}
${visualElementsText}
${highlightText}
${ctaText}

Style: ${themeDescriptions[theme] || "modern"}
Tone: ${toneDescriptions[tone] || "professional"}
Make it visually appealing for Instagram carousel format, square aspect ratio (1:1), ${theme} aesthetic.`;

      console.log(`Requesting image ${i + 1}/${imageCount}...`);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: imagePrompt,
            },
          ],
          modalities: ["image"],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "Insufficient credits. Please add credits to continue." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const errorText = await response.text();
        console.error(`AI API error for image ${i}:`, response.status, errorText);
        throw new Error(`Failed to generate image ${i}: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Response structure for image ${i}:`, JSON.stringify({
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        hasMessage: !!data.choices?.[0]?.message,
        hasImages: !!data.choices?.[0]?.message?.images,
        imagesLength: data.choices?.[0]?.message?.images?.length,
        hasImageUrl: !!data.choices?.[0]?.message?.images?.[0]?.image_url,
        hasUrl: !!data.choices?.[0]?.message?.images?.[0]?.image_url?.url
      }));

      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      const description = data.choices?.[0]?.message?.content || `Imagem ${i}`;

      if (!imageUrl) {
        console.error(`Full response data for image ${i}:`, JSON.stringify(data, null, 2));
        throw new Error(`No image URL returned for image ${i}. Response structure was unexpected.`);
      }

      images.push({ url: imageUrl, description });
      console.log(`✅ Generated image ${i + 1}/${imageCount} successfully`);
      
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
        prompt: slides.map(s => s.content).join(' | '),
        image_count: imageCount,
        images,
        theme,
        color_palette: colorPalette,
        tone,
        call_to_action: callToAction,
        slides_config: slides,
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
