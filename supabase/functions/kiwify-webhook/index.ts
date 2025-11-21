import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KiwifyWebhookPayload {
  order_id: string;
  order_ref: string;
  product_id: string;
  product_name: string;
  product_type: string;
  checkout_link?: string;
  webhook_event_type?: string; // Tipo específico do evento (order_approved, order_rejected, etc.)
  approved_date?: string; // Data de aprovação
  access_url?: string; // URL de acesso à área de membros
  Product?: {
    product_id: string;
    product_name: string;
    product_offer_id?: string;
    product_offer_name?: string;
  };
  Customer: {
    email: string;
    first_name: string;
    last_name: string;
    mobile: string;
  };
  Producer: {
    email: string;
    name: string;
  };
  Commissions: {
    charge_amount?: number;
    currency?: string;
    product_base_price?: number;
    kiwify_fee?: number;
    commissioned_stores?: Array<{
      id: string;
      type: string;
      email: string;
      value: number;
    }>;
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
    customer_access?: {
      has_access: boolean;
      active_period: boolean;
      access_until?: string;
    };
    plan?: {
      id: string;
      name: string;
      frequency: string;
      qty_charges: number;
    };
  };
  subscription_id?: string;
  order_status: 'paid' | 'waiting_payment' | 'refused' | 'refunded' | 'chargeback' | 'cancelled';
  payment_method: string;
  installments_number: number;
  installment_value: number;
  order_value: number;
  order_value_formatted: string;
  subscription_status?: string;
  created_at: string;
  updated_at: string;
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    await supabaseClient.rpc('set_config', {
      setting_name: 'app.webhook_context',
      new_value: 'kiwify_webhook',
      is_local: true
    });

    const payload: KiwifyWebhookPayload = await req.json();
    
    console.log('📦 Payload completo recebido:', JSON.stringify(payload, null, 2));
    console.log('📦 Tipo de evento:', payload.webhook_event_type || 'não especificado');
    console.log('📦 Status do pedido:', payload.order_status);
    console.log('Kiwify webhook received:', {
      order_id: payload.order_id,
      webhook_event_type: payload.webhook_event_type,
      order_status: payload.order_status,
      customer_email: payload.Customer.email,
      product_name: payload.product_name,
      approved_date: payload.approved_date,
      has_subscription: !!payload.Subscription
    });

    switch (payload.order_status) {
      case 'paid':
        await handlePaidOrder(payload, supabaseClient);
        break;
      case 'waiting_payment':
        await handlePendingOrder(payload, supabaseClient);
        break;
      case 'refused':
      case 'cancelled':
        await handleCancelledOrder(payload, supabaseClient);
        break;
      case 'refunded':
      case 'chargeback':
        await handleRefundedOrder(payload, supabaseClient);
        break;
      default:
        console.log('Unhandled order status:', payload.order_status);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error processing Kiwify webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
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

function isEligibleOffer(payload: KiwifyWebhookPayload): { 
  isEligible: boolean; 
  reason?: string;
  offerInfo: {
    offerId?: string;
    offerName?: string;
    checkoutLink?: string;
  }
} {
  const offerName = payload.Product?.product_offer_name || '';
  const offerId = payload.Product?.product_offer_id || '';
  
  // Verificar se a oferta contém "black" no nome (case insensitive)
  const isBlackFriday = offerName.toLowerCase().includes('black');
  
  console.log('🎫 Validando oferta:', {
    offerName,
    offerId,
    isBlackFriday,
    checkoutLink: payload.checkout_link
  });
  
  return {
    isEligible: isBlackFriday,
    reason: isBlackFriday ? undefined : `Oferta não elegível para Black Friday: ${offerName}`,
    offerInfo: {
      offerId,
      offerName,
      checkoutLink: payload.checkout_link
    }
  };
}

async function handlePaidOrder(payload: KiwifyWebhookPayload, supabase: any) {
  try {
    // ✅ VALIDAR SE É OFERTA ELEGÍVEL (BLACK FRIDAY)
    const eligibility = isEligibleOffer(payload);
    
    console.log('🎫 Resultado da validação:', {
      isEligible: eligibility.isEligible,
      offerName: eligibility.offerInfo.offerName,
      offerId: eligibility.offerInfo.offerId,
      checkoutLink: eligibility.offerInfo.checkoutLink,
      email: payload.Customer.email
    });
    
    if (!eligibility.isEligible) {
      console.log('❌ Oferta não elegível - compra será IGNORADA:', eligibility.reason);
      console.log('❌ Email do cliente:', payload.Customer.email);
      console.log('❌ Nome da oferta:', eligibility.offerInfo.offerName);
      
      // NÃO salvar nada no banco, apenas retornar
      return {
        success: false,
        message: eligibility.reason
      };
    }
    
    console.log('✅ Oferta elegível (Black Friday) - prosseguindo com o processamento');

    await supabase.rpc('set_config', {
      setting_name: 'app.webhook_context',
      new_value: 'kiwify_webhook',
      is_local: true
    });

    console.log(`Verificando usuário: ${payload.Customer.email}`);
    
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    const existingUser = users?.find((u: any) => u.email === payload.Customer.email);
    
    console.log(`Usuário existente: ${existingUser ? 'Sim (ID: ' + existingUser.id + ')' : 'Não'}`);
    
    let userId = existingUser?.id;
    let password = '';
    let isNewUser = false;
    
    try {
      if (!userId) {
        password = generateSecurePassword();
        isNewUser = true;
        
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: payload.Customer.email,
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: `${payload.Customer.first_name || ''} ${payload.Customer.last_name || ''}`.trim() || 'Nome não informado',
            first_name: payload.Customer.first_name || '',
            last_name: payload.Customer.last_name || '',
            mobile: payload.Customer.mobile || '',
            source: 'kiwify_purchase'
          }
        });

        if (createError) {
          console.error('Error creating user:', createError);
          throw createError;
        }
        
        userId = newUser.user.id;
        console.log(`New user created: ${userId} for email: ${payload.Customer.email}`);
      } else {
        console.log(`Existing user found: ${userId} for email: ${payload.Customer.email}`);
      }
      
      console.log('✅ Usuário processado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao processar usuário:', error);
      throw error;
    }

    try {
      console.log('👤 Concedendo role de usuário...');
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: 'user'
        });

      if (roleError) {
        console.error('Error granting user role:', roleError);
        throw roleError;
      }
      
      console.log('✅ Role concedida com sucesso');
    } catch (error) {
      console.error('❌ Erro ao conceder role:', error);
      throw error;
    }

    try {
      console.log('📝 Atualizando perfil...');
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: `${payload.Customer.first_name || ''} ${payload.Customer.last_name || ''}`.trim() || 'Nome não informado',
          access_granted: true,
          subscription_status: 'active'
        });

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }
      
      console.log('✅ Perfil atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      throw error;
    }

    // ✅ CRIAR ASSINATURA DE 3 MESES
    try {
      console.log('📅 Criando assinatura de 3 meses...');
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: 'basic',
          duration_months: 3,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          is_active: true,
          auto_renew: false
        });

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError);
        throw subscriptionError;
      }
      
      console.log('✅ Assinatura de 3 meses criada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar assinatura:', error);
      throw error;
    }

    // ✅ ATUALIZAR LIMITES PARA PLANO BÁSICO
    try {
      console.log('🎯 Atualizando limites de uso para plano básico...');
      
      const { error: limitsError } = await supabase
        .from('usage_limits')
        .update({
          plan_type: 'basic',
          creative_images_daily_limit: 10,
          creative_images_monthly_limit: 300,
          profile_analysis_daily_limit: 5,
          carousels_monthly_limit: 3,
          videos_monthly_limit: 0,
          sora_text_videos_lifetime_limit: 2,
          kling_image_videos_lifetime_limit: 1
        })
        .eq('user_id', userId);

      if (limitsError) {
        console.error('Error updating usage limits:', limitsError);
        throw limitsError;
      }
      
      console.log('✅ Limites de uso atualizados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar limites:', error);
      throw error;
    }

    try {
      console.log('💾 Salvando pedido...');
      const eligibility = isEligibleOffer(payload);
      
      const { error: orderError } = await supabase
        .from('orders')
        .upsert({
          id: payload.order_id,
          user_id: userId,
          kiwify_order_ref: payload.order_ref || null,
          product_id: payload.product_id || null,
          product_name: payload.product_name || 'Produto não informado',
          product_type: payload.product_type || null,
          product_offer_id: eligibility.offerInfo.offerId,
          product_offer_name: eligibility.offerInfo.offerName,
          checkout_link: eligibility.offerInfo.checkoutLink,
          utm_source: payload.TrackingParameters?.utm_source,
          utm_campaign: payload.TrackingParameters?.utm_campaign,
          utm_medium: payload.TrackingParameters?.utm_medium,
          utm_content: payload.TrackingParameters?.utm_content,
          tracking_params: payload.TrackingParameters || {},
          order_status: payload.order_status,
          payment_method: payload.payment_method || null,
          installments_number: payload.installments_number || 1,
          installment_value: payload.installment_value || 0,
          order_value: payload.order_value || 0,
          order_value_formatted: payload.order_value_formatted || 'R$ 0,00',
          customer_email: payload.Customer.email,
          customer_name: `${payload.Customer.first_name || ''} ${payload.Customer.last_name || ''}`.trim() || 'Nome não informado',
          customer_mobile: payload.Customer.mobile || null,
          created_at: payload.created_at,
          updated_at: payload.updated_at,
          webhook_data: payload,
          is_eligible_offer: true,
          rejection_reason: null,
          access_granted: true,
          credentials_sent: false
        });

      if (orderError) {
        console.error('Error saving order:', orderError);
        throw orderError;
      }
      
      console.log('✅ Pedido salvo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar pedido:', error);
      throw error;
    }

    try {
      console.log('📧 Enviando email de boas-vindas...');
      if (isNewUser && password) {
        const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
          body: {
            email: payload.Customer.email,
            fullName: `${payload.Customer.first_name || ''} ${payload.Customer.last_name || ''}`.trim() || 'Cliente',
            password: password
          }
        });

        if (emailError) {
          console.error('Error sending welcome email:', emailError);
        } else {
          console.log('✅ Email enviado com sucesso');
          await supabase
            .from('orders')
            .update({ credentials_sent: true })
            .eq('id', payload.order_id);
        }
      }
    } catch (error) {
      console.error('⚠️ Falha ao enviar email (não crítico):', error);
    }

    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'purchase_completed',
        details: {
          order_id: payload.order_id,
          product_name: payload.product_name || 'Produto não informado',
          order_value: payload.order_value || 0
        }
      });

  } catch (error) {
    console.error('Error handling paid order:', error);
    throw error;
  }
}

async function handlePendingOrder(payload: KiwifyWebhookPayload, supabase: any) {
  try {
    // Validar oferta mesmo para pedidos pendentes
    const eligibility = isEligibleOffer(payload);
    
    if (!eligibility.isEligible) {
      console.log('❌ Pedido pendente de oferta não elegível - será ignorado');
      return { success: false, message: eligibility.reason };
    }
    
    console.log('💾 Salvando pedido pendente...');
    
    const { error: orderError } = await supabase
      .from('orders')
      .upsert({
        id: payload.order_id,
        user_id: null,
        kiwify_order_ref: payload.order_ref || null,
        product_id: payload.product_id || null,
        product_name: payload.product_name || 'Produto não informado',
        product_type: payload.product_type || null,
        product_offer_id: eligibility.offerInfo.offerId,
        product_offer_name: eligibility.offerInfo.offerName,
        checkout_link: eligibility.offerInfo.checkoutLink,
        utm_source: payload.TrackingParameters?.utm_source,
        utm_campaign: payload.TrackingParameters?.utm_campaign,
        utm_medium: payload.TrackingParameters?.utm_medium,
        utm_content: payload.TrackingParameters?.utm_content,
        tracking_params: payload.TrackingParameters || {},
        order_status: payload.order_status,
        payment_method: payload.payment_method || null,
        installments_number: payload.installments_number || 1,
        installment_value: payload.installment_value || 0,
        order_value: payload.order_value || 0,
        order_value_formatted: payload.order_value_formatted || 'R$ 0,00',
        customer_email: payload.Customer.email,
        customer_name: `${payload.Customer.first_name || ''} ${payload.Customer.last_name || ''}`.trim() || 'Nome não informado',
        customer_mobile: payload.Customer.mobile || null,
        created_at: payload.created_at,
        updated_at: payload.updated_at,
        webhook_data: payload,
        is_eligible_offer: true,
        rejection_reason: null,
        access_granted: false,
        credentials_sent: false
      });

    if (orderError) {
      console.error('Error saving pending order:', orderError);
      throw orderError;
    }
    
    console.log('✅ Pedido pendente salvo com sucesso');
  } catch (error) {
    console.error('❌ Erro ao salvar pedido pendente:', error);
    throw error;
  }
}

async function handleCancelledOrder(payload: KiwifyWebhookPayload, supabase: any) {
  try {
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        order_status: payload.order_status,
        updated_at: payload.updated_at
      })
      .eq('id', payload.order_id);

    if (orderError) {
      console.error('Error updating cancelled order:', orderError);
      throw orderError;
    }

    console.log('Order cancelled:', payload.order_id);
  } catch (error) {
    console.error('Error handling cancelled order:', error);
    throw error;
  }
}

async function handleRefundedOrder(payload: KiwifyWebhookPayload, supabase: any) {
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({
        order_status: payload.order_status,
        access_granted: false,
        updated_at: payload.updated_at
      })
      .eq('id', payload.order_id)
      .select()
      .single();

    if (orderError) {
      console.error('Error updating refunded order:', orderError);
      throw orderError;
    }

    if (order?.user_id) {
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', order.user_id);

      await supabase
        .from('profiles')
        .update({
          access_granted: false,
          subscription_status: 'cancelled'
        })
        .eq('id', order.user_id);

      // ❌ DESATIVAR ASSINATURA
      await supabase
        .from('subscriptions')
        .update({ is_active: false })
        .eq('user_id', order.user_id);

      // ❌ RESETAR LIMITES PARA FREE
      await supabase
        .from('usage_limits')
        .update({
          plan_type: 'free',
          creative_images_daily_limit: 0,
          creative_images_monthly_limit: 0,
          profile_analysis_daily_limit: 0,
          carousels_monthly_limit: 0,
          videos_monthly_limit: 0,
          video_credits: 0,
          sora_text_videos_lifetime_limit: 0,
          kling_image_videos_lifetime_limit: 0
        })
        .eq('user_id', order.user_id);

      await supabase
        .from('activity_logs')
        .insert({
          user_id: order.user_id,
          action: 'access_revoked',
          details: {
            order_id: payload.order_id,
            reason: payload.order_status
          }
        });

      console.log('Access revoked for user:', order.user_id);
    }
  } catch (error) {
    console.error('Error handling refunded order:', error);
    throw error;
  }
}
