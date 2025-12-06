import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KiwifyWebhookPayload {
  order_id?: string;
  order_ref?: string;
  product_id?: string;
  product_name?: string;
  product_type?: string;
  checkout_link?: string;
  webhook_event_type?: string;
  approved_date?: string;
  Product?: {
    product_id: string;
    product_name: string;
    product_offer_id?: string;
    product_offer_name?: string;
  };
  Customer?: {
    email: string;
    first_name: string;
    last_name: string;
    mobile: string;
  };
  Commissions?: {
    charge_amount?: number;
    currency?: string;
    product_base_price?: number;
    kiwify_fee?: number;
    my_commission?: number;
  };
  TrackingParameters?: {
    utm_source?: string;
    utm_campaign?: string;
    utm_medium?: string;
    utm_content?: string;
    utm_term?: string;
    src?: string;
    sck?: string;
  };
  Subscription?: {
    start_date?: string;
    next_payment?: string;
    status?: string;
    plan?: {
      id: string;
      name: string;
      frequency: string;
      qty_charges: number;
    };
  };
  order_status?: 'paid' | 'waiting_payment' | 'refused' | 'refunded' | 'chargeback' | 'cancelled';
  payment_method?: string;
  installments_number?: number;
  installment_value?: number;
  order_value?: number;
  order_value_formatted?: string;
}

// Detectar duração da assinatura baseada no nome da oferta ou plano
function detectSubscriptionDuration(payload: KiwifyWebhookPayload): { months: number; type: string } {
  const offerName = (payload.Product?.product_offer_name || '').toLowerCase();
  const productName = (payload.product_name || payload.Product?.product_name || '').toLowerCase();
  const planName = (payload.Subscription?.plan?.name || '').toLowerCase();
  const frequency = (payload.Subscription?.plan?.frequency || '').toLowerCase();
  
  const searchText = `${offerName} ${productName} ${planName} ${frequency}`;
  
  console.log('🔍 Detectando duração da assinatura:', { offerName, productName, planName, frequency });
  
  // Anual
  if (searchText.includes('anual') || searchText.includes('annual') || searchText.includes('yearly') || searchText.includes('12 meses') || searchText.includes('1 ano')) {
    return { months: 12, type: 'annual' };
  }
  
  // Semestral
  if (searchText.includes('semestral') || searchText.includes('6 meses') || searchText.includes('semester') || searchText.includes('half-year')) {
    return { months: 6, type: 'semestral' };
  }
  
  // Trimestral
  if (searchText.includes('trimestral') || searchText.includes('3 meses') || searchText.includes('quarterly')) {
    return { months: 3, type: 'trimestral' };
  }
  
  // Padrão: Mensal
  return { months: 1, type: 'monthly' };
}

// Verificar se o produto é Lumi
function isLumiProduct(payload: KiwifyWebhookPayload): boolean {
  const productName = (payload.product_name || payload.Product?.product_name || '').toLowerCase();
  const offerName = (payload.Product?.product_offer_name || '').toLowerCase();
  
  const isLumi = productName.includes('lumi') || offerName.includes('lumi');
  
  console.log('🔍 Verificando produto Lumi:', { productName, offerName, isLumi });
  
  return isLumi;
}

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

serve(async (req) => {
  // Tratar HEAD requests (validação da Kiwify)
  if (req.method === 'HEAD') {
    return new Response('ok', { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const payload: KiwifyWebhookPayload = await req.json();
    
    console.log('📦 [lumi-product-webhook] Payload recebido:', JSON.stringify(payload, null, 2));
    console.log('📦 Status do pedido:', payload.order_status);
    
    // Validação - verificar se tem email
    if (!payload.Customer?.email) {
      console.log('⚠️ Payload sem email de cliente - ignorando');
      return new Response(
        JSON.stringify({ success: true, message: 'Payload sem email - ignorado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Verificar se é produto Lumi
    if (!isLumiProduct(payload)) {
      console.log('❌ [lumi-product-webhook] Produto não é Lumi - ignorando');
      return new Response(
        JSON.stringify({ success: false, message: 'Produto não é Lumi' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Apenas processar compras pagas
    if (payload.order_status !== 'paid') {
      console.log('⚠️ [lumi-product-webhook] Status não é paid:', payload.order_status);
      return new Response(
        JSON.stringify({ success: true, message: `Status ${payload.order_status} - não processado` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('✅ [lumi-product-webhook] Produto Lumi válido - processando compra');

    // Detectar duração da assinatura
    const subscription = detectSubscriptionDuration(payload);
    console.log('📅 Duração detectada:', subscription);

    // Verificar se usuário existe
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    const existingUser = users?.find((u: any) => u.email === payload.Customer!.email);
    
    console.log(`👤 Usuário existente: ${existingUser ? 'Sim (ID: ' + existingUser.id + ')' : 'Não'}`);
    
    let userId = existingUser?.id;
    let password = '';
    let isNewUser = false;
    
    // Criar usuário se não existir
    if (!userId) {
      password = generateSecurePassword();
      isNewUser = true;
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: payload.Customer!.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: `${payload.Customer!.first_name || ''} ${payload.Customer!.last_name || ''}`.trim() || 'Nome não informado',
          first_name: payload.Customer!.first_name || '',
          last_name: payload.Customer!.last_name || '',
          mobile: payload.Customer!.mobile || '',
          source: 'lumi_product_purchase'
        }
      });

      if (createError) {
        console.error('❌ Erro ao criar usuário:', createError);
        throw createError;
      }
      
      userId = newUser.user.id;
      console.log(`✅ Novo usuário criado: ${userId}`);
    }

    // Conceder role de usuário
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'user'
      }, {
        onConflict: 'user_id,role',
        ignoreDuplicates: true
      });

    if (roleError) {
      console.error('❌ Erro ao conceder role:', roleError);
    }

    // Atualizar perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: `${payload.Customer!.first_name || ''} ${payload.Customer!.last_name || ''}`.trim() || 'Nome não informado',
        access_granted: true,
        subscription_status: 'active'
      });

    if (profileError) {
      console.error('❌ Erro ao atualizar perfil:', profileError);
    }

    // Criar assinatura com duração detectada
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + subscription.months);

    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_type: 'lumi',
        duration_months: subscription.months,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: true,
        auto_renew: false
      });

    if (subscriptionError) {
      console.error('❌ Erro ao criar assinatura:', subscriptionError);
    } else {
      console.log(`✅ Assinatura Lumi de ${subscription.months} meses criada`);
    }

    // ✅ ATUALIZAR LIMITES PARA PLANO LUMI (Nano Banana PRO)
    // Novos limites: 10 imagens/mês, 30 imagens de carrossel/mês, 3 Kling videos lifetime
    const { error: limitsError } = await supabase
      .from('usage_limits')
      .upsert({
        user_id: userId,
        plan_type: 'lumi',
        api_tier: 'pro', // Usar Fal.ai Nano Banana PRO
        // Imagens criativas: 10/mês
        creative_images_daily_limit: 10, // Alto para não bloquear diariamente
        creative_images_monthly_limit: 10,
        creative_images_daily_used: 0,
        creative_images_monthly_used: 0,
        // Análise de perfil: mantém igual
        profile_analysis_daily_limit: 5,
        profile_analysis_daily_used: 0,
        // Carrosséis: baseado em total de imagens (30/mês)
        carousels_monthly_limit: 999, // Sem limite de quantidade, apenas imagens
        carousels_monthly_used: 0,
        carousel_images_monthly_limit: 30,
        carousel_images_monthly_used: 0,
        // Vídeos: 3 Kling lifetime
        videos_monthly_limit: 0,
        videos_monthly_used: 0,
        sora_text_videos_lifetime_limit: 0,
        sora_text_videos_lifetime_used: 0,
        kling_image_videos_lifetime_limit: 3,
        kling_image_videos_lifetime_used: 0,
        video_credits: 0,
        video_credits_used: 0
      }, {
        onConflict: 'user_id'
      });

    if (limitsError) {
      console.error('❌ Erro ao atualizar limites:', limitsError);
    } else {
      console.log('✅ Limites Lumi PRO atualizados:', {
        creative_images: '10/mês',
        carousel_images: '30/mês',
        kling_videos: '3 lifetime',
        api_tier: 'pro'
      });
    }

    // Salvar pedido
    const { error: orderError } = await supabase
      .from('orders')
      .upsert({
        id: payload.order_id,
        user_id: userId,
        kiwify_order_ref: payload.order_ref || null,
        product_id: payload.product_id || null,
        product_name: payload.product_name || payload.Product?.product_name || 'Lumi',
        product_type: payload.product_type || null,
        product_offer_id: payload.Product?.product_offer_id,
        product_offer_name: payload.Product?.product_offer_name,
        checkout_link: payload.checkout_link,
        utm_source: payload.TrackingParameters?.utm_source,
        utm_campaign: payload.TrackingParameters?.utm_campaign,
        utm_medium: payload.TrackingParameters?.utm_medium,
        utm_content: payload.TrackingParameters?.utm_content,
        tracking_params: payload.TrackingParameters || {},
        order_status: payload.order_status,
        payment_method: payload.payment_method || null,
        installments_number: payload.installments_number || 1,
        installment_value: payload.installment_value || 0,
        order_value: payload.Commissions?.charge_amount || payload.order_value || 0,
        order_value_formatted: payload.order_value_formatted || 'R$ 0,00',
        customer_email: payload.Customer!.email,
        customer_name: `${payload.Customer!.first_name || ''} ${payload.Customer!.last_name || ''}`.trim(),
        customer_mobile: payload.Customer!.mobile || null,
        is_eligible_offer: true,
        access_granted: true,
        credentials_sent: false,
        status: 'paid',
        webhook_data: payload
      }, {
        onConflict: 'id'
      });

    if (orderError) {
      console.error('❌ Erro ao salvar pedido:', orderError);
    } else {
      console.log('✅ Pedido Lumi salvo com sucesso');
    }

    // Enviar email de boas-vindas se for novo usuário
    if (isNewUser && password) {
      try {
        console.log('📧 Enviando email de boas-vindas...');
        
        const welcomeResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-welcome-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: payload.Customer!.email,
            name: payload.Customer!.first_name || 'Usuário',
            password: password,
            planType: 'Lumi PRO',
            durationMonths: subscription.months
          })
        });
        
        if (welcomeResponse.ok) {
          console.log('✅ Email de boas-vindas enviado');
          
          // Marcar credenciais como enviadas
          await supabase
            .from('orders')
            .update({ credentials_sent: true })
            .eq('id', payload.order_id);
        } else {
          console.error('❌ Erro ao enviar email:', await welcomeResponse.text());
        }
      } catch (emailError) {
        console.error('❌ Erro ao enviar email de boas-vindas:', emailError);
      }
    }

    console.log('🎉 [lumi-product-webhook] Processamento concluído com sucesso!');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Compra Lumi processada com sucesso',
        userId,
        isNewUser,
        subscription: subscription.type,
        durationMonths: subscription.months
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ [lumi-product-webhook] Erro:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
