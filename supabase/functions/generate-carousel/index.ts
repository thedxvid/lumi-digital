import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateCarouselRequest {
  prompt: string;
  imageCount: number; // Number of images in carousel (2-10)
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

    const { prompt, imageCount = 3 }: GenerateCarouselRequest = await req.json();

    if (!prompt || imageCount < 2 || imageCount > 10) {
      return new Response(
        JSON.stringify({ error: "Invalid request. Prompt required and imageCount must be 2-10" }),
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

    console.log(`Generating carousel with ${imageCount} images for prompt: ${prompt}`);

    // Generate multiple images sequentially
    const images: { url: string; description: string }[] = [];

    for (let i = 1; i <= imageCount; i++) {
      const imagePrompt = `${prompt} - Imagem ${i} de ${imageCount}. Crie uma imagem sequencial que faça parte de um carrossel coeso para redes sociais.`;

      console.log(`Requesting image ${i}/${imageCount}...`);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [
            {
              role: "user",
              content: imagePrompt,
            },
          ],
          modalities: ["image", "text"],
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
      console.log(`✅ Generated image ${i}/${imageCount} successfully`);
      
      // Add small delay between requests to avoid rate limiting
      if (i < imageCount) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Save to database
    const { data: carouselData, error: saveError } = await supabase
      .from("carousel_history")
      .insert({
        user_id: user.id,
        prompt,
        image_count: imageCount,
        images,
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
