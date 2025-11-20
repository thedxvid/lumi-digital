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
        from: "Equipe Lumi <suporte@applumi.com>",
        reply_to: "suporte@applumi.com",
        to: [email],
        subject: "Seu acesso à Lumi está pronto!",
        headers: {
          'X-Entity-Ref-ID': `lumi-${Date.now()}`,
          'List-Unsubscribe': '<mailto:suporte@applumi.com?subject=Unsubscribe>',
          'Precedence': 'bulk',
        },
        text: `
Olá, ${fullName}!

Estamos muito felizes em ter você conosco! Sua conta foi criada com sucesso.

📧 Email: ${email}
🔑 Senha temporária: ${password}

⚠️ Importante: Por favor, altere sua senha após o primeiro login por questões de segurança.

Acesse a plataforma em: https://applumi.com/auth

Precisa de ajuda? Entre em contato com nosso suporte em suporte@applumi.com

© ${new Date().getFullYear()} Lumi - Plataforma de Marketing Digital. Todos os direitos reservados.
        `,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
                Sua conta na Lumi foi criada! Acesse agora com suas credenciais.
              </div>
              
              <div style="background: #667eea; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
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
                     style="background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                    Acessar Plataforma 🚀
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
          console.log(`📊 Progresso: ${results.success}/${orders.length} | Taxa de sucesso: ${((results.success / (results.success + results.failed)) * 100).toFixed(1)}%`);
        } else {
          results.failed++;
          results.errors.push({
            email: order.customer_email,
            error: 'Falha ao enviar email'
          });
        }

        // Warm-up progressivo - delay inteligente baseado no número de emails enviados
        const delayMs = results.success < 10 ? 2000 : 
                        results.success < 30 ? 1500 :
                        results.success < 100 ? 1000 : 500;

        console.log(`⏳ Aguardando ${delayMs}ms antes do próximo envio...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));

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
