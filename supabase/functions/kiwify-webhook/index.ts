
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Set webhook context for RLS policies
    await supabaseClient.rpc('set_config', {
      setting_name: 'app.webhook_context',
      new_value: 'kiwify_webhook',
      is_local: true
    });

    const payload: KiwifyWebhookPayload = await req.json();
    
    console.log('Kiwify webhook received:', {
      order_id: payload.order_id,
      order_status: payload.order_status,
      customer_email: payload.Customer.email,
      product_name: payload.product_name
    });

    // Process different webhook events
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
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error processing Kiwify webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
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
    // Set webhook context for RLS policies
    await supabase.rpc('set_config', {
      setting_name: 'app.webhook_context',
      new_value: 'kiwify_webhook',
      is_local: true
    });

    console.log(`Verificando usuário: ${payload.Customer.email}`);
    
    // Check if user already exists using listUsers
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    const existingUser = users?.find((u: any) => u.email === payload.Customer.email);
    
    console.log(`Usuário existente: ${existingUser ? 'Sim (ID: ' + existingUser.id + ')' : 'Não'}`);
    
    let userId = existingUser?.id;
    let password = '';
    let isNewUser = false;
    
    if (!userId) {
      // Generate secure password
      password = generateSecurePassword();
      isNewUser = true;
      
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: payload.Customer.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: `${payload.Customer.first_name} ${payload.Customer.last_name}`.trim(),
          first_name: payload.Customer.first_name,
          last_name: payload.Customer.last_name,
          mobile: payload.Customer.mobile,
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

    // Grant user role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'user',
        granted_at: new Date().toISOString()
      });

    if (roleError) {
      console.error('Error granting user role:', roleError);
    }

    // Update profile with access granted
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: `${payload.Customer.first_name} ${payload.Customer.last_name}`.trim(),
        access_granted: true,
        subscription_status: 'active'
      });

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    // Save order information
    const { error: orderError } = await supabase
      .from('orders')
      .upsert({
        id: payload.order_id,
        user_id: userId,
        kiwify_order_ref: payload.order_ref,
        product_id: payload.product_id,
        product_name: payload.product_name,
        product_type: payload.product_type,
        order_status: payload.order_status,
        payment_method: payload.payment_method,
        installments_number: payload.installments_number,
        installment_value: payload.installment_value,
        order_value: payload.order_value,
        order_value_formatted: payload.order_value_formatted,
        customer_email: payload.Customer.email,
        customer_name: `${payload.Customer.first_name} ${payload.Customer.last_name}`.trim(),
        customer_mobile: payload.Customer.mobile,
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

    // Send welcome email with credentials (only for new users)
    if (isNewUser && password) {
      try {
        const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
          body: {
            email: payload.Customer.email,
            fullName: `${payload.Customer.first_name} ${payload.Customer.last_name}`.trim(),
            password: password
          }
        });

        if (emailError) {
          console.error('Error sending welcome email:', emailError);
        } else {
          // Mark credentials as sent
          await supabase
            .from('orders')
            .update({ credentials_sent: true })
            .eq('id', payload.order_id);
          
          console.log(`Welcome email sent to: ${payload.Customer.email}`);
        }
      } catch (emailError) {
        console.error('Error in email sending process:', emailError);
      }
    }

    // Log activity
    await supabase.rpc('log_activity', {
      _action: 'purchase_completed',
      _details: {
        order_id: payload.order_id,
        product_name: payload.product_name,
        order_value: payload.order_value,
        customer_email: payload.Customer.email,
        new_user: isNewUser
      },
      _user_id: userId
    });

    console.log(`Access granted to user ${userId} for order ${payload.order_id}`);

  } catch (error) {
    console.error('Error handling paid order:', error);
    throw error;
  }
}

async function handlePendingOrder(payload: KiwifyWebhookPayload, supabase: any) {
  // Set webhook context for RLS policies
  await supabase.rpc('set_config', {
    setting_name: 'app.webhook_context',
    new_value: 'kiwify_webhook',
    is_local: true
  });

  // Save pending order without creating user account
  const { error } = await supabase
    .from('orders')
    .upsert({
      id: payload.order_id,
      kiwify_order_ref: payload.order_ref,
      product_id: payload.product_id,
      product_name: payload.product_name,
      order_status: payload.order_status,
      payment_method: payload.payment_method,
      installments_number: payload.installments_number,
      installment_value: payload.installment_value,
      order_value: payload.order_value,
      order_value_formatted: payload.order_value_formatted,
      customer_email: payload.Customer.email,
      customer_name: `${payload.Customer.first_name} ${payload.Customer.last_name}`.trim(),
      customer_mobile: payload.Customer.mobile,
      created_at: payload.created_at,
      updated_at: payload.updated_at,
      webhook_data: payload,
      access_granted: false,
      credentials_sent: false
    });

  if (error) {
    console.error('Error saving pending order:', error);
    throw error;
  }

  console.log(`Pending order saved: ${payload.order_id}`);
}

async function handleCancelledOrder(payload: KiwifyWebhookPayload, supabase: any) {
  // Set webhook context for RLS policies
  await supabase.rpc('set_config', {
    setting_name: 'app.webhook_context',
    new_value: 'kiwify_webhook',
    is_local: true
  });

  // Update order status
  const { error } = await supabase
    .from('orders')
    .update({
      order_status: payload.order_status,
      updated_at: payload.updated_at
    })
    .eq('id', payload.order_id);

  if (error) {
    console.error('Error updating cancelled order:', error);
    throw error;
  }

  console.log(`Order cancelled: ${payload.order_id}`);
}

async function handleRefundedOrder(payload: KiwifyWebhookPayload, supabase: any) {
  // Set webhook context for RLS policies
  await supabase.rpc('set_config', {
    setting_name: 'app.webhook_context',
    new_value: 'kiwify_webhook',
    is_local: true
  });

  // Update order status
  const { error: orderError } = await supabase
    .from('orders')
    .update({
      order_status: payload.order_status,
      updated_at: payload.updated_at,
      access_granted: false
    })
    .eq('id', payload.order_id);

  if (orderError) {
    console.error('Error updating refunded order:', orderError);
    throw orderError;
  }

  // Revoke user access
  const { data: order } = await supabase
    .from('orders')
    .select('user_id')
    .eq('id', payload.order_id)
    .single();

  if (order?.user_id) {
    // Remove user role
    const { error: roleError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', order.user_id)
      .eq('role', 'user');

    if (roleError) {
      console.error('Error removing user role:', roleError);
    }

    // Update profile access
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        access_granted: false,
        subscription_status: 'inactive'
      })
      .eq('id', order.user_id);

    if (profileError) {
      console.error('Error revoking profile access:', profileError);
    }

    // Log activity
    await supabase.rpc('log_activity', {
      _action: 'access_revoked',
      _details: {
        reason: payload.order_status,
        order_id: payload.order_id
      },
      _user_id: order.user_id
    });

    console.log(`Access revoked for user ${order.user_id} due to ${payload.order_status}`);
  }
}
