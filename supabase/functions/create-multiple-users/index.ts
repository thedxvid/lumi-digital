import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserToCreate {
  email: string;
  fullName: string;
}

interface CreateMultipleUsersRequest {
  users: UserToCreate[];
  planType?: 'basic' | 'pro';
  durationMonths?: 1 | 3 | 6;
}

// Função para gerar senha temporária
function generateTemporaryPassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Função para enviar email de boas-vindas
async function sendWelcomeEmail(email: string, fullName: string, password: string): Promise<boolean> {
  try {
    console.log(`📧 Enviando email para ${email}...`);
    
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      users,
      planType = 'basic',
      durationMonths = 3
    }: CreateMultipleUsersRequest = await req.json();

    if (!users || users.length === 0) {
      throw new Error('Nenhum usuário fornecido');
    }

    console.log(`🔧 Criando ${users.length} usuários...`);

    const results = [];

    for (const user of users) {
      try {
        console.log(`\n📝 Processando: ${user.email}`);

        // Gerar senha temporária
        const tempPassword = generateTemporaryPassword();

        // 1. Criar usuário no auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: user.fullName
          }
        });

        if (authError) {
          console.error(`❌ Erro ao criar ${user.email}:`, authError);
          results.push({
            email: user.email,
            success: false,
            error: authError.message
          });
          continue;
        }

        console.log(`✅ Usuário criado: ${authUser.user!.id}`);

        // Aguardar trigger criar o perfil
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 2. Atualizar perfil
        await supabase
          .from('profiles')
          .update({
            access_granted: true,
            subscription_status: 'active',
            full_name: user.fullName
          })
          .eq('id', authUser.user!.id);

        // 3. Criar subscription
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + durationMonths);

        await supabase
          .from('subscriptions')
          .insert({
            user_id: authUser.user!.id,
            plan_type: planType,
            duration_months: durationMonths,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            is_active: true,
            auto_renew: false,
          });

        // 4. Atualizar usage_limits
        const limitsConfig = planType === 'pro' ? {
          creative_images_daily_limit: 30,
          creative_images_monthly_limit: 900,
          profile_analysis_daily_limit: 10,
          carousels_monthly_limit: 10,
          videos_monthly_limit: 15,
        } : {
          creative_images_daily_limit: 10,
          creative_images_monthly_limit: 300,
          profile_analysis_daily_limit: 5,
          carousels_monthly_limit: 3,
          videos_monthly_limit: 0,
        };

        await supabase
          .from('usage_limits')
          .update({
            plan_type: planType,
            ...limitsConfig,
          })
          .eq('user_id', authUser.user!.id);

        // 5. Enviar email
        const emailSent = await sendWelcomeEmail(user.email, user.fullName, tempPassword);

        results.push({
          email: user.email,
          success: true,
          userId: authUser.user!.id,
          emailSent,
          password: tempPassword // Retornar para o admin ver
        });

        console.log(`✅ Usuário ${user.email} criado com sucesso`);

        // Delay entre usuários para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error: any) {
        console.error(`❌ Erro ao processar ${user.email}:`, error);
        results.push({
          email: user.email,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`\n✅ Resumo: ${successCount} criados, ${failCount} falharam`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: users.length,
          success: successCount,
          failed: failCount
        },
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
    console.error('❌ Erro geral:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);
