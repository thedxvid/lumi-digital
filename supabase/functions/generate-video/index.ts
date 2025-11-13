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
      prompt, 
      aspect_ratio = '16:9', 
      duration = '8s', 
      resolution = '720p',
      generate_audio = true,
      negative_prompt,
      enhance_prompt = true,
      seed,
      auto_fix = true,
      api_provider = 'fal_veo3_fast'
    } = await req.json();

    console.log('Generating video with prompt:', prompt, 'API:', api_provider);

    if (!prompt || prompt.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Prompt deve ter pelo menos 10 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Configuração das APIs disponíveis
    const apiConfigs: Record<string, { endpoint: string, key: string | undefined, authPrefix: string }> = {
      fal_veo3_fast: {
        endpoint: 'https://fal.run/fal-ai/veo3/fast',
        key: FAL_KEY,
        authPrefix: 'Key'
      },
      fal_veo31: {
        endpoint: 'https://fal.run/fal-ai/veo3.1',
        key: FAL_KEY,
        authPrefix: 'Key'
      },
      fal_hunyuan: {
        endpoint: 'https://fal.run/fal-ai/hunyuan-video',
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

    // Call selected API
    const response = await fetch(selectedAPI.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `${selectedAPI.authPrefix} ${selectedAPI.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio,
        duration,
        resolution,
        generate_audio,
        negative_prompt,
        enhance_prompt,
        seed,
        auto_fix
      }),
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
