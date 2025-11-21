import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Lista de emails VÁLIDOS (com status "paid") extraídos das planilhas da Black Friday
const LEGITIMATE_BLACK_FRIDAY_EMAILS = [
  // Planilha 1 - VENDEDOR AUTOMÁTICO (VA + Z10 + IA)
  'karine.marketing@gmail.com',
  'karlaazevedo363@gmail.com',
  'weslayne.gyn@gmail.com',
  'carolinafrainer@gmail.com',
  'elizamabearis@gmail.com',
  'stefaneseixas@gmail.com',
  'prisp.arruda@gmail.com',
  'patricia.mirian.almeida@gmail.com',
  'atssouza@hotmail.com',
  'flaviosantosaraujo97@gmail.com',
  'deny267@gmail.com',
  'daia_0309@hotmail.com',
  'thainacarielo@gmail.com',
  'siqueirakelcia@gmail.com',
  'camile_trombini@hotmail.com',
  'jeanne.morishita@gmail.com',
  'alinebocacio_adv@hotmail.com',
  'silveiralarisse2@gmail.com',
  'rosemeresilva@gmail.com',
  'barbarazucareli@hotmail.com',
  'giovannabritorj@gmail.com',
  'juliana.adv.2018@gmail.com',
  'soulcosmeticoszh@gmail.com',
  'alinedrumondx@gmail.com',
  'isabellevianna99@gmail.com',
  'amanda.emanoely@hotmail.com',
  'josielireis@gmail.com',
  'gabriela2004.gabriel@gmail.com',
  'anaclara1609@gmail.com',
  'jooliveira19@gmail.com',
  'anapaula@aniart.com.br',
  'laanapauladossantos@hotmail.com',
  'thaisvieirasantoss@hotmail.com',
  'flavinha.alp@gmail.com',
  'luanamoreira@ymail.com',
  'leilanyleao2017@gmail.com',
  'gizeli_barros@hotmail.com',
  'adayannealves@hotmail.com',
  'renatamnogueira@gmail.com',
  'clarasophiamariniz19@gmail.com',
  'bibi_ribeiro@yahoo.com.br',
  'leticiamarangon2015@gmail.com',
  'keilafss@yahoo.com.br',
  'cristianaborges10@yahoo.com.br',
  'nicolecmarra@yahoo.com.br',
  'aline.fernandess@yahoo.com.br',
  'biancavalim03@gmail.com',
  'felipecardosopersonal@gmail.com',
  'sheillamariapsicologa@gmail.com',
  'francielehenriqueteixeira@gmail.com',
  'adrianamramos@gmail.com',
  'marianasoaresferreira9@gmail.com',
  'ingrid.salves@hotmail.com',
  'luciarochaalves@gmail.com',
  'marianadonasciment@gmail.com',
  'luanaemidiopadilha@gmail.com',
  'laysaleticiacassi@gmail.com',
  'diariane.lima@gmail.com',
  'jessicagomesilva1993@gmail.com',
  'gleiciane.cs@gmail.com',
  'ju_bianchi@yahoo.com.br',
  'thaisfernanda16@gmail.com',
  'camilagasparine@gmail.com',
  'tha_saude@hotmail.com',
  'tati.ferreira.tf@gmail.com',
  'rebeka.vidal@hotmail.com',
  'mayarasteffen.makeup@gmail.com',
  'nivia.ncc@gmail.com',
  'jessicawonrath@yahoo.com.br',
  'thainararibeiro02@gmail.com',
  
  // Planilha 2 - VENDEDOR AUTOMÁTICO - VA (VA - Z10 - LUMI)
  'claudiamariacampos02@gmail.com',
  'janefscocja@gmail.com',
  'vidapet19vet@gmail.com',
  'edneiaaoad90@gmail.com',
  'anaelisia111@gmail.com',
  'palomadossantos619@gmail.com',
  'fernandaalmeidamaria1@gmail.com',
  'karlenaidar@gmail.com',
  'larissapolegatti27@gmail.com',
  'saravieirajb@gmail.com',
  'onegocio.vip@gmail.com',
  'grazicoelho8@gmail.com',
  'claudiaogawa66@gmail.com',
  'jessicamorgado12@gmail.com',
  'jeffersonisrael96@gmail.com',
  'hosanahairstyle@hotmail.com',
  'virginiaoliveira339@gmail.com',
  'marilenedeoliveira27@gmail.com',
  'contato.suellenmartins@gmail.com',
  'kellyramos.krs@gmail.com',
  'anapsicologia@live.com',
  'monicamonteiro2008@bol.com.br',
  'rjulianamarcilio@hotmail.com',
  'tatyqueiroz82@gmail.com',
  'luamatos18@hotmail.com',
  'lanabezerramonteiro@gmail.com',
  'lindalvadossantos77@gmail.com',
  'lidiabrittes@gmail.com',
  'daniela.r.oliveira@hotmail.com',
  'pamesilveira@gmail.com',
  'carlafssperandio@hotmail.com',
  'tatilazzarinipsi@gmail.com',
  'daiane.oliveira.1982@gmail.com',
  'marcellyfsilva@gmail.com',
  'raqueldias0807@gmail.com',
  'anamartinsmakeup2016@gmail.com',
  'julianacaceres190@gmail.com',
  'luamarques08@hotmail.com',
  'paty.jequie@hotmail.com',
  'rosangelasouzasevero@gmail.com',
  'patriciacmacan@hotmail.com',
  'vanusaamanda@gmail.com',
  'grazieleprates@hotmail.com',
  'vanessarnunes@hotmail.com',
  'adriilopees@hotmail.com',
  'helenaboechat@bol.com.br',
  'carol.correasilveira@gmail.com',
  'thaizfcs@hotmail.com',
  'nayaracss@gmail.com',
  'carlanunes67@outlook.com',
  'naiarasoaresm@hotmail.com',
  'isabellataianne@gmail.com',
  'thaynaspena@hotmail.com',
  'maah_goncalves@outlook.com',
  'laricardoso22@gmail.com',
  'izabelferreira.adv@gmail.com',
  'biatrizi.leite@gmail.com',
  'tatianealvessp@gmail.com',
  'brunamonteiroestudiodebeleza@gmail.com',
  'aline.carolinesm@gmail.com',
  'nayaraccarvalho@hotmail.com',
  'robson.anuncie@gmail.com',
  'amandaperdomo@live.com',
  'maisahsmotaoliveira@gmail.com',
  'debychan14@gmail.com',
  'anakaliny.cruz@yahoo.com',
  'leandramrsl@hotmail.com',
  'priscillamabreu@gmail.com',
  'analuaraujo@outlook.com',
  'patriciasouza.ps160@gmail.com',
  'nathy@amexplaces.com.br',
  'julysegobia@gmail.com',
  'drikaflima@yahoo.com.br',
  'thayseviana@hotmail.com',
  'joanacjmoraes@gmail.com',
  'teficorteze@gmail.com',
  'luana_rsmarques@hotmail.com',
  'renata_r_rodrigues@hotmail.com',
  'julianabocchi@hotmail.com',
  'maria.luizabc.silva@hotmail.com',
  'vanessa_medeiros25@hotmail.com',
  'renatacristinenascimento@gmail.com',
  'pattymacena20@gmail.com',
  'larissa.costacruz@gmail.com',
  'alinesiqueira.10@hotmail.com',
  'michellesilva.ms@hotmail.com',
  'moradezz@gmail.com',
  'julianavelez@gmail.com',
  'thaispereira.tp18@gmail.com',
  'thalita_franca@hotmail.com',
  'anitaalvesr@gmail.com',
  'brunabernardes30@gmail.com',
  'naianamfreitas@gmail.com',
  'beatrizpereira_lima@hotmail.com',
  'ieda_sa@hotmail.com',
  'mariobarakata@gmail.com',
  'nana_lins@hotmail.com',
].map(email => email.toLowerCase().trim());

interface DryRunReport {
  total_users_with_access: number;
  legitimate_buyers: number;
  users_to_revoke: number;
  users_to_revoke_list: Array<{
    id: string;
    email: string;
    full_name: string;
    access_granted: boolean;
    subscription_status: string;
    has_active_subscription: boolean;
  }>;
  admin_users_protected: number;
  summary: string;
}

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
      console.error('❌ [revoke-access] Auth error:', authError);
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
      console.error('❌ [revoke-access] User is not admin:', user.email);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [revoke-access] Admin verified:', user.email);
    console.log('📊 [revoke-access] Total legitimate emails:', LEGITIMATE_BLACK_FRIDAY_EMAILS.length);

    // Verificar se é para executar ou apenas dry-run
    const { dryRun = true, execute = false, userIds = [] } = await req.json();
    console.log(`🎯 [revoke-access] Mode: ${execute ? 'EXECUÇÃO REAL' : 'DRY-RUN (simulação)'}`);
    console.log(`📋 [revoke-access] User IDs from spreadsheet: ${userIds.length}`);

    // 1. Buscar todos os usuários com acesso
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, full_name, access_granted, subscription_status')
      .eq('access_granted', true);

    if (profilesError) {
      console.error('❌ [revoke-access] Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log('👥 [revoke-access] Total users with access:', profiles?.length || 0);

    // 2. Buscar emails dos auth.users
    const { data: authUsers, error: authUsersError } = await supabaseClient.auth.admin.listUsers();

    if (authUsersError) {
      console.error('❌ [revoke-access] Error fetching auth users:', authUsersError);
      throw authUsersError;
    }

    const authUsersMap = new Map(authUsers.users.map(u => [u.id, u.email]));
    console.log('📧 [revoke-access] Total auth users:', authUsers.users.length);

    // 3. Buscar subscriptions ativas
    const { data: subscriptions, error: subsError } = await supabaseClient
      .from('subscriptions')
      .select('user_id, is_active')
      .eq('is_active', true);

    if (subsError) {
      console.error('❌ [revoke-access] Error fetching subscriptions:', subsError);
    }

    const activeSubscriptionsMap = new Set(
      subscriptions?.map(s => s.user_id) || []
    );

    // 4. Buscar admins para proteger
    const { data: adminRoles, error: adminError } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminError) {
      console.error('❌ [revoke-access] Error fetching admin roles:', adminError);
    }

    const adminUsersSet = new Set(
      adminRoles?.map(r => r.user_id) || []
    );

    console.log('🛡️ [revoke-access] Admin users to protect:', adminUsersSet.size);

    // 5. Identificar usuários a remover
    let usersToRevoke;
    
    if (userIds.length > 0) {
      // Se userIds foram fornecidos (da planilha), usar apenas esses
      console.log('📊 [revoke-access] Using provided user IDs from spreadsheet');
      usersToRevoke = profiles
        ?.filter(profile => userIds.includes(profile.id) && !adminUsersSet.has(profile.id))
        .map(profile => ({
          id: profile.id,
          email: authUsersMap.get(profile.id) || 'N/A',
          full_name: profile.full_name || 'Sem nome',
          access_granted: profile.access_granted,
          subscription_status: profile.subscription_status || 'N/A',
          has_active_subscription: activeSubscriptionsMap.has(profile.id)
        })) || [];
    } else {
      // Caso contrário, usar a lista hardcoded (fallback)
      console.log('📋 [revoke-access] Using hardcoded legitimate emails list (fallback)');
      usersToRevoke = profiles
        ?.filter(profile => {
          const email = authUsersMap.get(profile.id);
          const isAdmin = adminUsersSet.has(profile.id);
          const isLegitimate = email && LEGITIMATE_BLACK_FRIDAY_EMAILS.includes(email.toLowerCase().trim());

          return !isAdmin && !isLegitimate;
        })
        .map(profile => ({
          id: profile.id,
          email: authUsersMap.get(profile.id) || 'N/A',
          full_name: profile.full_name || 'Sem nome',
          access_granted: profile.access_granted,
          subscription_status: profile.subscription_status || 'N/A',
          has_active_subscription: activeSubscriptionsMap.has(profile.id)
        })) || [];
    }

    console.log('🚨 [revoke-access] Users to revoke:', usersToRevoke.length);

    // 6. EXECUTAR REMOÇÃO se execute=true
    let revokedCount = 0;
    let emailsSentCount = 0;
    if (execute && usersToRevoke.length > 0) {
      console.log('⚠️ [revoke-access] INICIANDO REMOÇÃO REAL DE ACESSOS...');
      
      for (const user of usersToRevoke) {
        try {
          // Remover acesso do usuário
          const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({ 
              access_granted: false,
              subscription_status: 'revoked'
            })
            .eq('id', user.id);

          if (updateError) {
            console.error(`❌ Erro ao remover acesso de ${user.email}:`, updateError);
          } else {
            revokedCount++;
            console.log(`✅ Acesso removido: ${user.email}`);
          }

          // Desativar subscriptions ativas
          if (user.has_active_subscription) {
            const { error: subError } = await supabaseClient
              .from('subscriptions')
              .update({ is_active: false })
              .eq('user_id', user.id);

            if (subError) {
              console.error(`❌ Erro ao desativar subscription de ${user.email}:`, subError);
            }
          }

          // Enviar email de notificação
          try {
            console.log(`📧 Enviando email de revogação para: ${user.email}`);
            const { error: emailError } = await supabaseClient.functions.invoke('send-revocation-email', {
              body: {
                email: user.email,
                fullName: user.full_name || 'Cliente'
              }
            });

            if (emailError) {
              console.error(`❌ Erro ao enviar email para ${user.email}:`, emailError);
            } else {
              emailsSentCount++;
              console.log(`✅ Email enviado para: ${user.email}`);
            }
          } catch (emailError) {
            console.error(`❌ Falha ao enviar email para ${user.email}:`, emailError);
          }
        } catch (error) {
          console.error(`❌ Erro crítico ao processar ${user.email}:`, error);
        }
      }

      console.log(`✅ [revoke-access] REMOÇÃO CONCLUÍDA: ${revokedCount}/${usersToRevoke.length} usuários`);
      console.log(`📧 [revoke-access] EMAILS ENVIADOS: ${emailsSentCount}/${usersToRevoke.length}`);
    }

    // 7. Gerar relatório
    const report: DryRunReport = {
      total_users_with_access: profiles?.length || 0,
      legitimate_buyers: profiles?.length - usersToRevoke.length || 0,
      users_to_revoke: usersToRevoke.length,
      users_to_revoke_list: usersToRevoke,
      admin_users_protected: adminUsersSet.size,
      summary: execute 
        ? `
📊 RELATÓRIO DE EXECUÇÃO - Remoção de Acessos Não Autorizados

✅ Total de usuários com acesso (antes): ${profiles?.length || 0}
✅ Compradores legítimos da Black Friday: ${profiles?.length - usersToRevoke.length || 0}
🔴 Usuários com acesso REMOVIDO: ${revokedCount}/${usersToRevoke.length}
📧 Emails de notificação enviados: ${emailsSentCount}/${usersToRevoke.length}
🛡️ Admins protegidos: ${adminUsersSet.size}

✅ EXECUÇÃO CONCLUÍDA!
Os usuários listados abaixo tiveram seus acessos revogados e foram notificados por email.
        `.trim()
        : `
📊 RELATÓRIO DRY-RUN - Remoção de Acessos Não Autorizados

✅ Total de usuários com acesso: ${profiles?.length || 0}
✅ Compradores legítimos da Black Friday: ${profiles?.length - usersToRevoke.length || 0}
⚠️ Usuários a remover (NÃO estão nas planilhas): ${usersToRevoke.length}
🛡️ Admins protegidos: ${adminUsersSet.size}

🔍 PRÓXIMOS PASSOS:
- Revise a lista de usuários a remover abaixo
- Confirme se nenhum comprador legítimo está na lista
- Clique em "Executar Remoção" para revogar os acessos
        `.trim()
    };

    console.log('📄 [revoke-access] Dry-run report generated');
    console.log(report.summary);

    return new Response(
      JSON.stringify(report),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('❌ [revoke-access] Error:', error);
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
