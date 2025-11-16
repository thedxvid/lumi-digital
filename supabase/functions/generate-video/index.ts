import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FAL_KEY = Deno.env.get('FAL_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      mode = 'text-to-video',
      prompt, 
      input_images,
      aspect_ratio = '16:9', 
      duration = '8s', 
      resolution = '720p',
      generate_audio = true,
      negative_prompt,
      enhance_prompt = true,
      seed,
      auto_fix = true,
      api_provider = 'fal_kling_v25_turbo'
    } = await req.json();

    console.log('Generating video:', { mode, api_provider, has_images: !!input_images });

    // Validations
    if (mode === 'text-to-video' && (!prompt || prompt.trim().length < 10)) {
      return new Response(
        JSON.stringify({ error: 'Prompt deve ter pelo menos 10 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (mode === 'image-to-video' && (!input_images || input_images.length === 0)) {
      return new Response(
        JSON.stringify({ error: 'Pelo menos 1 imagem é necessária para image-to-video' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Configuração das APIs disponíveis
    const apiConfigs: Record<string, { endpoint: string, key: string | undefined, authPrefix: string }> = {
      fal_kling_v25_turbo: {
        endpoint: 'https://fal.run/fal-ai/kling-video/v2.5-turbo/pro/text-to-video',
        key: FAL_KEY,
        authPrefix: 'Key'
      },
      fal_veo31: {
        endpoint: 'https://fal.run/fal-ai/veo3.1',
        key: FAL_KEY,
        authPrefix: 'Key'
      },
      // Image-to-Video APIs
      fal_kling_v25_image_to_video: {
        endpoint: 'https://fal.run/fal-ai/kling-video/v2.5-turbo/pro/image-to-video',
        key: FAL_KEY,
        authPrefix: 'Key'
      },
      fal_sora2_image_to_video: {
        endpoint: 'https://fal.run/fal-ai/sora-2/image-to-video',
        key: FAL_KEY,
        authPrefix: 'Key'
      }
    };

    const selectedAPI = apiConfigs[api_provider];
    
    if (!selectedAPI) {
      return new Response(
        JSON.stringify({ error: `API ${api_provider} não é suportada` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!selectedAPI.key) {
      return new Response(
        JSON.stringify({ error: `Chave da API ${api_provider} não está configurada` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar body específico para cada API e modo
    let requestBody: any;
    
    // Handle image-to-video mode
    if (mode === 'image-to-video') {
      if (api_provider === 'fal_kling_v25_image_to_video') {
        // Kling Image-to-Video requires 1 image
        if (!input_images || input_images.length < 1) {
          return new Response(
            JSON.stringify({ error: 'Este modelo requer 1 imagem' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const durationSeconds = parseInt(duration.replace('s', ''));
        const klingDuration = durationSeconds <= 5 ? "5" : "10";
        
        requestBody = {
          prompt: prompt || 'Generate a video from this image',
          image_url: input_images[0],
          duration: klingDuration,
          negative_prompt: negative_prompt || 'blur, distort, and low quality',
          cfg_scale: 0.5
        };
      } else if (api_provider === 'fal_sora2_image_to_video') {
        // Sora 2 Image-to-Video requires 1 image
        if (!input_images || input_images.length < 1) {
          return new Response(
            JSON.stringify({ error: 'Este modelo requer 1 imagem' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const durationSeconds = parseInt(duration.replace('s', ''));
        // Sora 2 supports 4, 8, or 12 seconds
        const soraDuration = durationSeconds <= 4 ? 4 : durationSeconds <= 8 ? 8 : 12;
        
        requestBody = {
          prompt: prompt || 'Generate a video from this image',
          image_url: input_images[0],
          duration: soraDuration,
          resolution: resolution === '1080p' ? '720p' : '720p', // Sora 2 supports auto or 720p
          aspect_ratio: aspect_ratio === '1:1' ? 'auto' : aspect_ratio, // Sora 2: auto, 9:16, 16:9
          delete_video: true
        };
      } else {
        return new Response(
          JSON.stringify({ error: 'API de image-to-video não reconhecida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (api_provider === 'fal_kling_v25_turbo') {
      // Kling v2.5 Text-to-Video usa parâmetros específicos
      const durationSeconds = parseInt(duration.replace('s', ''));
      const klingDuration = durationSeconds <= 5 ? "5" : "10";
      
      requestBody = {
        prompt,
        duration: klingDuration,
        aspect_ratio,
        negative_prompt: negative_prompt || 'blur, distort, and low quality',
        cfg_scale: 0.5
      };
    } else {
      // Veo 3.1 usa parâmetros padrão
      requestBody = {
        prompt,
        aspect_ratio,
        duration,
        resolution,
        generate_audio,
        negative_prompt,
        enhance_prompt,
        seed,
        auto_fix
      };
    }

    // Call selected API
    const response = await fetch(selectedAPI.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `${selectedAPI.authPrefix} ${selectedAPI.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fal.ai API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes na conta Fal.ai.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 422) {
        try {
          const errorData = JSON.parse(errorText);
          const isContentViolation = errorData.detail?.some((d: any) => d.type === 'content_policy_violation');
          if (isContentViolation) {
            return new Response(
              JSON.stringify({ error: 'O conteúdo do prompt foi bloqueado pelos filtros de segurança da API. Por favor, reformule sua solicitação com um texto diferente, evitando marcas, nomes de produtos ou conteúdo sensível.' }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (e) {
          // If we can't parse the error, continue to generic error
        }
      }
      
      throw new Error(`Fal.ai API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Video generated successfully:', data.video?.url);

    return new Response(
      JSON.stringify({ 
        video: data.video,
        message: 'Vídeo gerado com sucesso!' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-video function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro ao gerar vídeo' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
