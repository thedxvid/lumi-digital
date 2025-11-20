import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

function generateTemporaryPassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

async function sendWelcomeEmail(email: string, fullName: string, password: string): Promise<boolean> {
  try {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Lumi <noreply@applumi.com>",
        to: [email],
        subject: "Bem-vindo(a) à Lumi! 🎉",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">✨ Bem-vindo(a) à Lumi!</h1>
              </div>
              
              <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #667eea; margin-top: 0;">Olá, ${fullName}! 👋</h2>
                
                <p>Estamos muito felizes em ter você conosco! Sua conta foi criada com sucesso.</p>
                
                <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
                  <p style="margin: 0 0 10px 0;"><strong>📧 Email:</strong> ${email}</p>
                  <p style="margin: 0;"><strong>🔑 Senha temporária:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password}</code></p>
                </div>
                
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #92400e;"><strong>⚠️ Importante:</strong> Por favor, altere sua senha após o primeiro login por questões de segurança.</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://applumi.com/auth" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                    Acessar Plataforma 🚀
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
                  Precisa de ajuda? Entre em contato com nosso suporte.
                </p>
                
                <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
                  © ${new Date().getFullYear()} Lumi. Todos os direitos reservados.
                </p>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error(`❌ Erro ao enviar email para ${email}:`, errorData);
      return false;
    }

    console.log(`✅ Email enviado com sucesso para ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao enviar email para ${email}:`, error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verificar se é admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é admin
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🚀 Iniciando reenvio de emails de boas-vindas...');

    // Buscar usuários que não receberam o email
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, customer_email, customer_name, user_id')
      .eq('order_status', 'paid')
      .or('credentials_sent.eq.false,credentials_sent.is.null')
      .not('user_id', 'is', null);

    if (ordersError) {
      throw new Error(`Erro ao buscar pedidos: ${ordersError.message}`);
    }

    console.log(`📊 Encontrados ${orders?.length || 0} usuários para reenviar email`);

    const results = {
      total: orders?.length || 0,
      success: 0,
      failed: 0,
      errors: [] as Array<{ email: string; error: string }>,
    };

    // Processar cada usuário
    for (const order of orders || []) {
      try {
        console.log(`\n📧 Processando: ${order.customer_email}`);

        // Gerar nova senha temporária
        const newPassword = generateTemporaryPassword();

        // Atualizar senha no Auth
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          order.user_id,
          { password: newPassword }
        );

        if (updateError) {
          throw new Error(`Erro ao atualizar senha: ${updateError.message}`);
        }

        // Enviar email
        const emailSent = await sendWelcomeEmail(
          order.customer_email,
          order.customer_name,
          newPassword
        );

        if (emailSent) {
          // Marcar como enviado
          await supabaseAdmin
            .from('orders')
            .update({ credentials_sent: true })
            .eq('id', order.id);

          results.success++;
          console.log(`✅ Processado com sucesso: ${order.customer_email}`);
        } else {
          results.failed++;
          results.errors.push({
            email: order.customer_email,
            error: 'Falha ao enviar email'
          });
        }

        // Delay entre emails para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`❌ Erro ao processar ${order.customer_email}:`, error);
        results.failed++;
        results.errors.push({
          email: order.customer_email,
          error: error.message
        });
      }
    }

    console.log('\n📊 Resumo do processamento:');
    console.log(`✅ Sucesso: ${results.success}`);
    console.log(`❌ Falhas: ${results.failed}`);
    console.log(`📧 Total: ${results.total}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Processamento concluído',
        results
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("❌ Erro geral:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Erro ao processar requisição"
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
