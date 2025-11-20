import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Gera uma senha temporária segura
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function sendWelcomeEmail(email: string, fullName: string, password: string): Promise<boolean> {
  try {
    console.log(`📧 Enviando email para: ${email}`);

    const emailData = {
      from: "Equipe Lumi <suporte@applumi.com>",
      reply_to: "suporte@applumi.com",
      to: [email],
      subject: "Seu acesso à Lumi está pronto!",
      text: `
Olá, ${fullName}!

Estamos muito felizes em ter você conosco! Sua conta foi criada com sucesso.

📧 Email: ${email}
🔑 Senha temporária: ${password}

⚠️ Importante: Por favor, altere sua senha após o primeiro login por questões de segurança.

Acesse a plataforma em: https://applumi.com/auth

Precisa de ajuda? Entre em contato com nosso suporte em suporte@applumi.com

© ${new Date().getFullYear()} Lumi. Todos os direitos reservados.
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <!-- Preheader text -->
  <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    Sua conta na Lumi foi criada! Acesse agora com suas credenciais.
  </div>

  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #667eea; padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">Bem-vindo(a) à Lumi! 🎉</h1>
    </div>

    <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Olá, <strong>${fullName}</strong>!
      </p>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Estamos muito felizes em ter você conosco! Sua conta foi criada com sucesso e você já pode começar a usar todas as funcionalidades da nossa plataforma.
      </p>

      <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <p style="color: #374151; margin: 0 0 10px 0; font-size: 14px;">
          <strong>📧 Seu email de acesso:</strong><br>
          <span style="color: #667eea; font-size: 16px;">${email}</span>
        </p>
        <p style="color: #374151; margin: 0; font-size: 14px;">
          <strong>🔑 Sua senha temporária:</strong><br>
          <code style="background: white; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; font-size: 16px; color: #1f2937; border: 1px solid #e5e7eb;">${password}</code>
        </p>
      </div>

      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 8px;">
        <p style="color: #92400e; margin: 0; font-size: 14px;">
          ⚠️ <strong>Importante:</strong> Por favor, altere sua senha após o primeiro login por questões de segurança.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://applumi.com/auth" style="display: inline-block; background: #667eea; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Acessar Plataforma →
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
          Precisa de ajuda? Responda este email ou entre em contato:
        </p>
        <p style="color: #667eea; font-size: 14px; margin: 5px 0;">
          📧 <a href="mailto:suporte@applumi.com" style="color: #667eea; text-decoration: none;">suporte@applumi.com</a>
        </p>
        
        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
          Este email foi enviado para ${email} porque você se cadastrou na plataforma Lumi.
        </p>
        
        <p style="color: #9ca3af; font-size: 11px; margin-top: 15px;">
          © ${new Date().getFullYear()} Lumi - Plataforma de Marketing Digital
        </p>
      </div>
    </div>
  </div>
</body>
</html>
      `,
      headers: {
        'X-Entity-Ref-ID': `lumi-${Date.now()}`,
        'List-Unsubscribe': '<mailto:suporte@applumi.com?subject=Unsubscribe>',
        'Precedence': 'bulk',
      }
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Erro Resend API: ${error}`);
      throw new Error(`Resend API error: ${error}`);
    }

    const result = await response.json();
    console.log(`✅ Email enviado com sucesso:`, result);
    return true;

  } catch (error) {
    console.error(`❌ Erro ao enviar email para ${email}:`, error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Ler parâmetros de batch (limite de 50 emails por chamada para evitar timeout)
    const { batchSize = 50, offset = 0 } = await req.json().catch(() => ({}));
    
    console.log(`🚀 [resend-all-welcome-emails] Iniciando batch: offset=${offset}, batchSize=${batchSize}`);

    // Criar cliente Supabase com service role
    const supabaseAdmin = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Verificar se é admin
    const { data: isAdmin, error: adminError } = await supabaseAdmin
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (adminError || !isAdmin) {
      console.error('❌ Usuário não é admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Admin autorizado:', user.email);

    // Buscar TODOS os pedidos pagos (SEM filtro de credentials_sent)
    // Com paginação para processar em batches
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, customer_email, customer_name, user_id')
      .eq('order_status', 'paid')
      .not('user_id', 'is', null)
      .range(offset, offset + batchSize - 1)
      .order('created_at', { ascending: true }); // Ordenar para consistência

    if (ordersError) {
      console.error('❌ Erro ao buscar pedidos:', ordersError);
      throw ordersError;
    }

    console.log(`📊 Total de pedidos pagos encontrados: ${orders?.length || 0}`);

    if (!orders || orders.length === 0) {
      console.log('ℹ️ Nenhum pedido pago encontrado');
      return new Response(
        JSON.stringify({
          success: true,
          results: {
            total: 0,
            success: 0,
            failed: 0,
            errors: []
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = {
      total: orders.length,
      success: 0,
      failed: 0,
      errors: [] as Array<{ email: string; error: string }>
    };

    // Processar cada pedido
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      
      try {
        console.log(`\n[${i + 1}/${orders.length}] Processando: ${order.customer_email}`);

        // Gerar nova senha temporária
        const tempPassword = generateTemporaryPassword();
        console.log(`🔑 Senha temporária gerada`);

        // Atualizar senha no Supabase Auth
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          order.user_id,
          { password: tempPassword }
        );

        if (updateError) {
          console.error(`❌ Erro ao atualizar senha:`, updateError);
          throw updateError;
        }

        console.log(`✅ Senha atualizada no Auth`);

        // Enviar email
        const emailSent = await sendWelcomeEmail(
          order.customer_email,
          order.customer_name,
          tempPassword
        );

        if (emailSent) {
          // Marcar como enviado
          await supabaseAdmin
            .from('orders')
            .update({ credentials_sent: true })
            .eq('id', order.id);

          results.success++;
          console.log(`✅ Processado com sucesso: ${order.customer_email}`);
          
          // Log de progresso detalhado
          const successRate = ((results.success / (results.success + results.failed)) * 100).toFixed(1);
          console.log(`📊 Progresso: ${results.success}/${orders.length} | Taxa de sucesso: ${successRate}%`);
        } else {
          results.failed++;
          results.errors.push({
            email: order.customer_email,
            error: 'Failed to send email'
          });
        }

        // Rate limiting inteligente (warm-up progressivo)
        const delayMs = results.success < 10 ? 2000 : 
                        results.success < 30 ? 1500 :
                        results.success < 100 ? 1000 : 500;

        if (i < orders.length - 1) {
          console.log(`⏳ Aguardando ${delayMs}ms antes do próximo envio...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }

      } catch (error: any) {
        console.error(`❌ Erro ao processar ${order.customer_email}:`, error);
        results.failed++;
        results.errors.push({
          email: order.customer_email,
          error: error.message
        });
      }
    }

    console.log('\n📊 Resumo Final:');
    console.log(`✅ Sucesso: ${results.success}`);
    console.log(`❌ Falhas: ${results.failed}`);
    console.log(`📈 Total: ${results.total}`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        batchInfo: {
          offset,
          batchSize,
          processedInThisBatch: orders.length,
          hasMore: orders.length === batchSize // Se processou todos do batch, pode ter mais
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
