import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, admin_user_id } = await req.json();

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine which user's key to validate
    let targetUserId = user.id;

    // If admin_user_id is provided, check if caller is admin
    if (admin_user_id && admin_user_id !== user.id) {
      const { data: isAdmin } = await supabaseClient.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Permissão negada - apenas admins podem validar chaves de outros usuários' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      targetUserId = admin_user_id;
      console.log(`🔐 Admin ${user.id} validando chave do usuário ${targetUserId}`);
    }

    // Get user's API key
    const { data: keyData, error: keyError } = await supabaseClient
      .from('user_api_keys')
      .select('api_key_encrypted')
      .eq('user_id', targetUserId)
      .eq('provider', provider)
      .single();

    if (keyError || !keyData) {
      return new Response(
        JSON.stringify({ valid: false, error: 'API Key não encontrada' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt the key
    const encryptionKey = 'lumi-api-key-secret-2024';
    const { data: decryptedKey, error: decryptError } = await supabaseClient.rpc('decrypt_api_key', {
      encrypted_text: keyData.api_key_encrypted,
      encryption_key: encryptionKey
    });

    if (decryptError || !decryptedKey) {
      console.error('Decryption error:', decryptError);
      return new Response(
        JSON.stringify({ valid: false, error: 'Erro ao descriptografar key' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate with Fal.ai by making a test call
    if (provider === 'fal_ai') {
      try {
        // Make a minimal test call to Fal.ai
        const testResponse = await fetch('https://fal.run/fal-ai/fast-turbo-diffusion', {
          method: 'POST',
          headers: {
            'Authorization': `Key ${decryptedKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: 'test',
            image_size: 'square_hd',
            num_inference_steps: 2
          }),
        });

        const isValid = testResponse.ok || testResponse.status === 402; // 402 = out of credits but key is valid

        // Update validation status in database
        await supabaseClient
          .from('user_api_keys')
          .update({
            is_valid: isValid,
            last_validated_at: new Date().toISOString()
          })
          .eq('user_id', targetUserId)
          .eq('provider', provider);

        if (!isValid) {
          const errorText = await testResponse.text();
          return new Response(
            JSON.stringify({ 
              valid: false, 
              error: `Key inválida (${testResponse.status}): ${errorText.substring(0, 100)}` 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ valid: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        console.error('Validation error:', error);
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: error instanceof Error ? error.message : 'Erro ao validar key'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ valid: false, error: 'Provider não suportado' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validate-user-api-key:', error);
    return new Response(
      JSON.stringify({ 
        valid: false,
        error: error instanceof Error ? error.message : 'Erro ao validar API key'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
