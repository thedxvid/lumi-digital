import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('🔍 Buscando usuários afetados (criados após 22/Nov sem email)...');

    // Buscar usuários que têm profile mas não têm order
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, full_name, created_at')
      .gte('created_at', '2024-11-22T00:00:00Z')
      .eq('access_granted', true);

    if (profilesError) {
      throw profilesError;
    }

    console.log(`📊 ${profiles?.length || 0} perfis encontrados desde 22/Nov`);

    const affectedUsers = [];
    
    // Para cada profile, verificar se tem order
    for (const profile of profiles || []) {
      // Buscar email do usuário
      const { data: { user }, error: userError } = await supabaseClient.auth.admin.getUserById(profile.id);
      
      if (userError || !user) {
        console.log(`⚠️ Não foi possível obter dados do usuário ${profile.id}`);
        continue;
      }

      // Verificar se tem order
      const { data: orders, error: ordersError } = await supabaseClient
        .from('orders')
        .select('id, credentials_sent')
        .eq('user_id', profile.id)
        .eq('order_status', 'paid');

      if (ordersError) {
        console.log(`⚠️ Erro ao buscar orders para ${user.email}:`, ordersError);
        continue;
      }

      // Se não tem order OU tem order mas sem credentials_sent
      if (!orders || orders.length === 0 || orders.some(o => !o.credentials_sent)) {
        affectedUsers.push({
          id: profile.id,
          email: user.email,
          fullName: profile.full_name || user.email?.split('@')[0] || 'Cliente',
          createdAt: profile.created_at,
          hasOrder: orders && orders.length > 0,
          credentialsSent: orders?.[0]?.credentials_sent || false
        });
      }
    }

    console.log(`📧 ${affectedUsers.length} usuários precisam receber email`);

    const results = [];

    for (const user of affectedUsers) {
      console.log(`\n📤 Processando ${user.email}...`);
      
      // Gerar nova senha temporária
      const tempPassword = generateSecurePassword();
      
      // Resetar senha do usuário
      const { error: resetError } = await supabaseClient.auth.admin.updateUserById(
        user.id,
        { password: tempPassword }
      );

      if (resetError) {
        console.error(`❌ Erro ao resetar senha para ${user.email}:`, resetError);
        results.push({
          email: user.email,
          success: false,
          error: 'Erro ao resetar senha'
        });
        continue;
      }

      // Enviar email de boas-vindas
      const { error: emailError } = await supabaseClient.functions.invoke('send-welcome-email', {
        body: {
          email: user.email,
          fullName: user.fullName,
          password: tempPassword
        }
      });

      if (emailError) {
        console.error(`❌ Erro ao enviar email para ${user.email}:`, emailError);
        results.push({
          email: user.email,
          success: false,
          error: 'Erro ao enviar email'
        });
        continue;
      }

      console.log(`✅ Email enviado para ${user.email}`);

      // Se tiver order, marcar como credentials_sent
      if (user.hasOrder) {
        await supabaseClient
          .from('orders')
          .update({ credentials_sent: true })
          .eq('user_id', user.id);
      }

      results.push({
        email: user.email,
        success: true,
        hasOrder: user.hasOrder
      });

      // Delay para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const summary = {
      total: affectedUsers.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      details: results
    };

    console.log('\n📊 Resumo final:', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}