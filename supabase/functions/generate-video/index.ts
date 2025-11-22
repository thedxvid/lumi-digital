import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      // Image-to-Video APIs
      fal_kling_v25_image_to_video: {
        endpoint: 'https://fal.run/fal-ai/kling-video/v2.5-turbo/pro/image-to-video',
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
      // Outras APIs usam parâmetros padrão
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
      
      // Handle rate limit
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Handle insufficient credits
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes na conta Fal.ai.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Handle content policy violations
      if (response.status === 422) {
        console.log('Checking for content policy violation...');
        try {
          const errorData = JSON.parse(errorText);
          console.log('Parsed error data:', errorData);
          
          const isContentViolation = errorData.detail?.some((d: any) => {
            console.log('Checking detail:', d);
            return d.type === 'content_policy_violation';
          });
          
          console.log('Is content violation:', isContentViolation);
          
          if (isContentViolation) {
            console.log('Returning content policy violation error with status 200');
            return new Response(
              JSON.stringify({ 
                error: 'O conteúdo do prompt foi bloqueado pelos filtros de segurança da API. Tente usar descrições mais genéricas, evitando: marcas comerciais (Rolex, Mercedes, etc), produtos específicos, ou conteúdo sensível. Exemplo: ao invés de "Rolex", use "relógio de pulso".'
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (parseError) {
          console.error('Error parsing Fal.ai error response:', parseError);
        }
      }
      
      // Generic error for other cases
      console.error('Returning generic error');
      return new Response(
        JSON.stringify({ error: `Erro ao gerar vídeo: ${response.status}. Por favor, tente novamente.` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Video generated successfully:', data.video?.url);

    // Decrementar lifetime limits ou créditos extras baseado na API usada
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
        
        if (user) {
          const { data: limits } = await supabaseClient
            .from('usage_limits')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (limits) {
            const updates: Record<string, number> = {};
            
            // Kling Text-to-Video ou Image-to-Video
            if (api_provider.includes('kling')) {
              if ((limits.kling_image_videos_lifetime_used || 0) < (limits.kling_image_videos_lifetime_limit || 0)) {
                updates.kling_image_videos_lifetime_used = (limits.kling_image_videos_lifetime_used || 0) + 1;
                console.log('Using Kling lifetime credit');
              } else if ((limits.video_credits_used || 0) < (limits.video_credits || 0)) {
                updates.video_credits_used = (limits.video_credits_used || 0) + 1;
                console.log('Using extra video credit for Kling');
              }
            }
            
            if (Object.keys(updates).length > 0) {
              await supabaseClient
                .from('usage_limits')
                .update(updates)
                .eq('user_id', user.id);
                
              console.log('Usage limits updated:', updates);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error updating usage limits:', error);
      // Não falhar a requisição se a atualização de limites falhar
    }

    // Generate thumbnail URL from video (frame at 0.5s)
    const videoUrl = data.video?.url;
    const thumbnailUrl = videoUrl ? videoUrl + '#t=0.5' : null;

    return new Response(
      JSON.stringify({ 
        video: {
          ...data.video,
          thumbnail_url: thumbnailUrl
        },
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
