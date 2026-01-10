import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para validar formato da API Key Fal.ai
function validateFalKeyFormat(key: string): { valid: boolean; error?: string } {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'Chave vazia ou inválida' };
  }
  
  const trimmedKey = key.trim();
  
  // Fal.ai keys geralmente começam com prefixos específicos
  // Formato esperado: algo como "fal_..." ou uma string longa
  if (trimmedKey.length < 20) {
    return { valid: false, error: `Chave muito curta (${trimmedKey.length} caracteres). Chaves Fal.ai devem ter mais de 20 caracteres.` };
  }
  
  if (trimmedKey.length > 200) {
    return { valid: false, error: 'Chave muito longa. Verifique se copiou corretamente.' };
  }
  
  // Verificar caracteres inválidos
  if (!/^[a-zA-Z0-9_\-:]+$/.test(trimmedKey)) {
    return { valid: false, error: 'Chave contém caracteres inválidos. Use apenas letras, números, underscores e hífens.' };
  }
  
  return { valid: true };
}

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
        JSON.stringify({ valid: false, error: 'API Key não encontrada. Conecte sua chave primeiro.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`✅ [validate-user-api-key] Chave encontrada (encrypted length: ${keyData.api_key_encrypted?.length || 0})`);

    // Decrypt the key
    console.log('🔐 [validate-user-api-key] Descriptografando chave...');
    const encryptionKey = 'lumi-api-key-secret-2024';
    const { data: decryptedKey, error: decryptError } = await supabaseClient.rpc('decrypt_api_key', {
      encrypted_text: keyData.api_key_encrypted,
      encryption_key: encryptionKey
    });

    if (decryptError || !decryptedKey) {
      console.error('❌ [validate-user-api-key] Erro ao descriptografar:', decryptError?.message);
      
      // Marcar como inválida no banco
      await supabaseClient
        .from('user_api_keys')
        .update({
          is_valid: false,
          last_validated_at: new Date().toISOString()
        })
        .eq('user_id', targetUserId)
        .eq('provider', provider);
      
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Erro ao descriptografar key. Remova e adicione novamente.',
          errorType: 'decrypt'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`✅ [validate-user-api-key] Chave descriptografada (length: ${decryptedKey.length})`);

    // Validar formato da chave ANTES de fazer chamada à Fal.ai
    const formatValidation = validateFalKeyFormat(decryptedKey);
    if (!formatValidation.valid) {
      console.log(`❌ [validate-user-api-key] Formato inválido: ${formatValidation.error}`);
      
      // Marcar como inválida no banco
      await supabaseClient
        .from('user_api_keys')
        .update({
          is_valid: false,
          last_validated_at: new Date().toISOString()
        })
        .eq('user_id', targetUserId)
        .eq('provider', provider);
      
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: formatValidation.error,
          errorType: 'format'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate with Fal.ai using a LIGHTWEIGHT endpoint that doesn't consume credits
    if (provider === 'fal_ai') {
      console.log('🔐 [validate-user-api-key] Iniciando validação RÁPIDA com Fal.ai...');
      
      try {
        // Usar AbortController para timeout de 10 segundos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        // ✅ USAR ENDPOINT DE BILLING QUE NÃO CONSOME CRÉDITOS
        // Este endpoint verifica se a chave é válida sem gastar créditos
        console.log('🔐 [validate-user-api-key] Testando autenticação via billing endpoint...');
        const testResponse = await fetch('https://rest.fal.ai/billing/usage', {
          method: 'GET',
          headers: {
            'Authorization': `Key ${decryptedKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        console.log(`🔐 [validate-user-api-key] Resposta Fal.ai status: ${testResponse.status}`);
        
        // Analisar resposta para determinar erro específico
        let errorMessage = '';
        let isValid = false;
        
        if (testResponse.ok) {
          isValid = true;
          const usageData = await testResponse.json().catch(() => null);
          console.log('✅ [validate-user-api-key] Chave VÁLIDA - billing endpoint OK');
          if (usageData) {
            console.log('📊 [validate-user-api-key] Dados de uso:', JSON.stringify(usageData).substring(0, 200));
          }
        } else if (testResponse.status === 401 || testResponse.status === 403) {
          isValid = false;
          const errorText = await testResponse.text().catch(() => '');
          console.log(`❌ [validate-user-api-key] Chave não autorizada: ${errorText.substring(0, 200)}`);
          
          // Tentar extrair mensagem específica do erro
          if (errorText.includes('Invalid API key')) {
            errorMessage = 'Chave API inválida. Verifique se copiou corretamente do painel Fal.ai.';
          } else if (errorText.includes('expired')) {
            errorMessage = 'Chave expirada. Gere uma nova no painel Fal.ai.';
          } else {
            errorMessage = 'Chave não autorizada. Verifique se está ativa no painel Fal.ai.';
          }
        } else if (testResponse.status === 429) {
          // Rate limit - assumir que a chave é válida mas está limitada
          isValid = true;
          console.log('⚠️ [validate-user-api-key] Rate limit atingido - assumindo chave válida');
        } else {
          isValid = false;
          const errorText = await testResponse.text().catch(() => '');
          console.log(`❌ [validate-user-api-key] Erro inesperado: ${testResponse.status} - ${errorText.substring(0, 200)}`);
          errorMessage = `Erro ao validar (status ${testResponse.status}). Tente novamente.`;
        }

        // Update validation status in database
        console.log(`🔐 [validate-user-api-key] Atualizando status no banco: is_valid=${isValid}`);
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
          console.log('❌ [validate-user-api-key] ========== FALHA ==========');
          return new Response(
            JSON.stringify({ 
              valid: false, 
              error: errorMessage || 'Chave inválida',
              errorType: 'api'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('✅ [validate-user-api-key] ========== SUCESSO ==========');
        return new Response(
          JSON.stringify({ valid: true, message: 'Chave validada com sucesso!' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        console.error('❌ [validate-user-api-key] Erro durante validação:', error);
        
        // Verificar se foi timeout
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        
        if (isTimeout) {
          console.log('⏱️ [validate-user-api-key] Timeout na validação - não marcando como inválida');
          return new Response(
            JSON.stringify({ 
              valid: false, 
              error: 'Timeout na validação. A Fal.ai demorou para responder. Tente novamente.',
              errorType: 'timeout'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Erro de rede - não marcar como inválida
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'Erro de conexão com Fal.ai. Verifique sua internet e tente novamente.',
            errorType: 'network'
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
        error: error instanceof Error ? error.message : 'Erro ao validar API key',
        errorType: 'internal'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
