import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: isAdmin } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [export-backup] Admin verified:', user.email);

    const { userIds = [] } = await req.json();
    console.log(`📋 [export-backup] Exporting backup for ${userIds.length} users`);

    // 1. Buscar profiles dos usuários
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, full_name, access_granted, subscription_status, created_at, updated_at')
      .eq('access_granted', true);

    if (profilesError) {
      throw profilesError;
    }

    // 2. Buscar emails dos auth.users
    const { data: authUsers, error: authUsersError } = await supabaseClient.auth.admin.listUsers();

    if (authUsersError) {
      throw authUsersError;
    }

    const authUsersMap = new Map(authUsers.users.map(u => [u.id, {
      email: u.email,
      last_sign_in: u.last_sign_in_at,
      created_at: u.created_at,
      confirmed_at: u.confirmed_at
    }]));

    // 3. Buscar subscriptions
    const { data: subscriptions } = await supabaseClient
      .from('subscriptions')
      .select('user_id, plan_type, start_date, end_date, is_active, duration_months');

    const subscriptionsMap = new Map(
      subscriptions?.map(s => [s.user_id, s]) || []
    );

    // 4. Buscar admins para excluir
    const { data: adminRoles } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    const adminUsersSet = new Set(adminRoles?.map(r => r.user_id) || []);

    // 5. Filtrar usuários a exportar
    let usersToExport;
    
    if (userIds.length > 0) {
      usersToExport = profiles?.filter(profile => 
        userIds.includes(profile.id) && !adminUsersSet.has(profile.id)
      ) || [];
    } else {
      usersToExport = profiles?.filter(profile => 
        !adminUsersSet.has(profile.id)
      ) || [];
    }

    console.log(`📊 [export-backup] Exporting ${usersToExport.length} users`);

    // 6. Gerar CSV
    const csvHeader = [
      'ID',
      'Email',
      'Nome Completo',
      'Acesso Concedido',
      'Status Assinatura',
      'Tipo Plano',
      'Data Início Plano',
      'Data Fim Plano',
      'Plano Ativo',
      'Duração (meses)',
      'Último Login',
      'Data Cadastro',
      'Email Confirmado',
      'Data Atualização Perfil'
    ].join(',');

    const csvRows = usersToExport.map(profile => {
      const authData = authUsersMap.get(profile.id);
      const subscription = subscriptionsMap.get(profile.id);

      return [
        profile.id,
        authData?.email || 'N/A',
        `"${(profile.full_name || 'Sem nome').replace(/"/g, '""')}"`,
        profile.access_granted ? 'Sim' : 'Não',
        profile.subscription_status || 'N/A',
        subscription?.plan_type || 'N/A',
        subscription?.start_date ? new Date(subscription.start_date).toLocaleDateString('pt-BR') : 'N/A',
        subscription?.end_date ? new Date(subscription.end_date).toLocaleDateString('pt-BR') : 'N/A',
        subscription?.is_active ? 'Sim' : 'Não',
        subscription?.duration_months || 'N/A',
        authData?.last_sign_in ? new Date(authData.last_sign_in).toLocaleString('pt-BR') : 'Nunca',
        authData?.created_at ? new Date(authData.created_at).toLocaleDateString('pt-BR') : 'N/A',
        authData?.confirmed_at ? new Date(authData.confirmed_at).toLocaleDateString('pt-BR') : 'Não confirmado',
        profile.updated_at ? new Date(profile.updated_at).toLocaleString('pt-BR') : 'N/A'
      ].join(',');
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');

    // 7. Adicionar BOM para UTF-8 (para abrir corretamente no Excel)
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    console.log(`✅ [export-backup] CSV gerado com ${usersToExport.length} linhas`);

    return new Response(csvWithBom, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="backup_usuarios_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error: any) {
    console.error('❌ [export-backup] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
