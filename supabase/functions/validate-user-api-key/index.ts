import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🔐 [validate-user-api-key] ========== INÍCIO ==========');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, admin_user_id } = await req.json();
    console.log(`🔐 [validate-user-api-key] Provider: ${provider}, Admin User ID: ${admin_user_id || 'não especificado'}`);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('❌ [validate-user-api-key] Sem header de autorização');
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.log('❌ [validate-user-api-key] Erro de autenticação:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔐 [validate-user-api-key] Usuário autenticado: ${user.id} (${user.email})`);

    // Determine which user's key to validate
    let targetUserId = user.id;

    // If admin_user_id is provided, check if caller is admin
    if (admin_user_id && admin_user_id !== user.id) {
      console.log(`🔐 [validate-user-api-key] Admin validando chave de outro usuário: ${admin_user_id}`);
      
      const { data: isAdmin } = await supabaseClient.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (!isAdmin) {
        console.log('❌ [validate-user-api-key] Usuário não é admin, negando acesso');
        return new Response(
          JSON.stringify({ error: 'Permissão negada - apenas admins podem validar chaves de outros usuários' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      targetUserId = admin_user_id;
      console.log(`✅ [validate-user-api-key] Admin ${user.id} autorizado a validar chave do usuário ${targetUserId}`);
    }

    // Get user's API key
    console.log(`🔐 [validate-user-api-key] Buscando chave do usuário ${targetUserId} para provider ${provider}`);
    const { data: keyData, error: keyError } = await supabaseClient
      .from('user_api_keys')
      .select('api_key_encrypted')
      .eq('user_id', targetUserId)
      .eq('provider', provider)
      .single();

    if (keyError || !keyData) {
      console.log('❌ [validate-user-api-key] Chave não encontrada:', keyError?.message);
      return new Response(
        JSON.stringify({ valid: false, error: 'API Key não encontrada' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ [validate-user-api-key] Chave encontrada no banco de dados');

    // Decrypt the key
    console.log('🔐 [validate-user-api-key] Descriptografando chave...');
    const encryptionKey = 'lumi-api-key-secret-2024';
    const { data: decryptedKey, error: decryptError } = await supabaseClient.rpc('decrypt_api_key', {
      encrypted_text: keyData.api_key_encrypted,
      encryption_key: encryptionKey
    });

    if (decryptError || !decryptedKey) {
      console.error('❌ [validate-user-api-key] Erro ao descriptografar:', decryptError?.message);
      return new Response(
        JSON.stringify({ valid: false, error: 'Erro ao descriptografar key' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ [validate-user-api-key] Chave descriptografada com sucesso');

    // Validate with Fal.ai by making a test call
    if (provider === 'fal_ai') {
      console.log('🔐 [validate-user-api-key] Iniciando validação com Fal.ai...');
      
      try {
        // Make a minimal test call to Fal.ai
        console.log('🔐 [validate-user-api-key] Fazendo chamada de teste para Fal.ai...');
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

        console.log(`🔐 [validate-user-api-key] Resposta Fal.ai status: ${testResponse.status}`);
        
        // 200 = success, 402 = out of credits but key is valid
        const isValid = testResponse.ok || testResponse.status === 402;
        console.log(`🔐 [validate-user-api-key] isValid: ${isValid} (status ${testResponse.status})`);

        // Update validation status in database
        console.log('🔐 [validate-user-api-key] Atualizando status no banco de dados...');
        const { error: updateError } = await supabaseClient
          .from('user_api_keys')
          .update({
            is_valid: isValid,
            last_validated_at: new Date().toISOString()
          })
          .eq('user_id', targetUserId)
          .eq('provider', provider);
          
        if (updateError) {
          console.error('❌ [validate-user-api-key] Erro ao atualizar status:', updateError.message);
        } else {
          console.log('✅ [validate-user-api-key] Status atualizado com sucesso');
        }

        // Se a chave for válida, atualizar api_tier para 'pro'
        if (isValid) {
          console.log(`🚀 [validate-user-api-key] Atualizando api_tier para 'pro' para usuário ${targetUserId}`);
          const { error: tierError } = await supabaseClient
            .from('usage_limits')
            .update({ 
              api_tier: 'pro',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', targetUserId);
            
          if (tierError) {
            console.error('❌ [validate-user-api-key] Erro ao atualizar api_tier:', tierError.message);
          } else {
            console.log('✅ [validate-user-api-key] api_tier atualizado para pro');
          }
        }

        if (!isValid) {
          const errorText = await testResponse.text();
          console.log(`❌ [validate-user-api-key] Chave inválida: ${errorText.substring(0, 200)}`);
          return new Response(
            JSON.stringify({ 
              valid: false, 
              error: `Key inválida (${testResponse.status}): ${errorText.substring(0, 100)}` 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('✅ [validate-user-api-key] ========== SUCESSO ==========');
        return new Response(
          JSON.stringify({ valid: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        console.error('❌ [validate-user-api-key] Erro durante validação:', error);
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: error instanceof Error ? error.message : 'Erro ao validar key'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('❌ [validate-user-api-key] Provider não suportado:', provider);
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
