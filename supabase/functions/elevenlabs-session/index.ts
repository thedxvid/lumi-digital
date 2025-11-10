
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Iniciando sessão ElevenLabs...');

    // Obter as chaves dos secrets do Supabase
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    const agentId = Deno.env.get('ELEVENLABS_AGENT_ID');

    if (!elevenLabsApiKey) {
      console.error('❌ ELEVENLABS_API_KEY não encontrada nos secrets');
      throw new Error('Chave de API da ElevenLabs não configurada');
    }

    if (!agentId) {
      console.error('❌ ELEVENLABS_AGENT_ID não encontrado nos secrets');
      throw new Error('Agent ID da ElevenLabs não configurado');
    }

    console.log('✅ Chaves encontradas, gerando URL assinada...');
    console.log('Agent ID:', agentId);

    // Gerar URL assinada para a sessão
    const signedUrlResponse = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`, {
      method: 'GET',
      headers: {
        'xi-api-key': elevenLabsApiKey,
      },
    });

    if (!signedUrlResponse.ok) {
      const errorText = await signedUrlResponse.text();
      console.error('❌ Erro ao obter URL assinada:', signedUrlResponse.status, errorText);
      throw new Error(`Erro ao obter URL assinada: ${signedUrlResponse.status} - ${errorText}`);
    }

    const { signed_url } = await signedUrlResponse.json();
    
    if (!signed_url) {
      throw new Error('URL assinada não retornada pela API da ElevenLabs');
    }

    console.log('✅ URL assinada gerada com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true, 
        signed_url,
        agent_id: agentId 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Erro na Edge Function elevenlabs-session:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro desconhecido ao criar sessão ElevenLabs' 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
