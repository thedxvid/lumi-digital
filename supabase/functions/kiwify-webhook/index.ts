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
  Commissions: Array<{
    name: string;
    email: string;
    value: number;
  }>;
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
    console.log('Kiwify webhook received:', {
      order_id: payload.order_id,
      order_status: payload.order_status,
      customer_email: payload.Customer.email,
      product_name: payload.product_name
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

async function handlePaidOrder(payload: KiwifyWebhookPayload, supabase: any) {
  try {
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

    try {
      console.log('💾 Salvando pedido...');
      const { error: orderError } = await supabase
        .from('orders')
        .upsert({
          id: payload.order_id,
          user_id: userId,
          kiwify_order_ref: payload.order_ref || null,
          product_id: payload.product_id || null,
          product_name: payload.product_name || 'Produto não informado',
          product_type: payload.product_type || null,
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
