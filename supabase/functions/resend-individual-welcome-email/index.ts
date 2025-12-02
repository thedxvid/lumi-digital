import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResendIndividualEmailRequest {
  userId: string;
  email: string;
  fullName: string;
}

const generateTemporaryPassword = (): string => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "Lumi"; // Prefixo para facilitar identificação
  
  for (let i = 0; i < length - 4; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Iniciando reenvio individual de email com atualização de senha...');
    
    // Criar cliente Supabase com service role para acesso admin
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

    // Verificar autenticação do admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Autorização necessária');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: adminUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !adminUser) {
      throw new Error('Não autorizado');
    }

    // Verificar se é admin
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: adminUser.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      throw new Error('Acesso negado - apenas administradores');
    }

    const { userId, email, fullName }: ResendIndividualEmailRequest = await req.json();

    console.log('📧 Processando usuário:', { userId, email, fullName });

    // Gerar nova senha temporária
    const newPassword = generateTemporaryPassword();
    console.log('🔑 Nova senha gerada');

    // Atualizar senha no Supabase Auth
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('❌ Erro ao atualizar senha no Auth:', updateError);
      throw new Error(`Erro ao atualizar senha: ${updateError.message}`);
    }

    console.log('✅ Senha atualizada no Auth com sucesso');

    // Enviar email com as novas credenciais
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
        subject: "Suas novas credenciais de acesso à Lumi",
        headers: {
          'X-Entity-Ref-ID': `lumi-resend-${Date.now()}`,
          'List-Unsubscribe': '<mailto:suporte@applumi.com?subject=Unsubscribe>',
          'Precedence': 'bulk',
        },
        text: `
Olá, ${fullName}!

Suas credenciais de acesso à Lumi foram atualizadas.

📧 Email: ${email}
🔑 Nova senha temporária: ${newPassword}

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
                Suas novas credenciais de acesso à Lumi foram geradas!
              </div>
              
              <div style="background: #667eea; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🔑 Novas Credenciais</h1>
              </div>
              
              <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #667eea; margin-top: 0;">Olá, ${fullName}! 👋</h2>
                
                <p>Suas credenciais de acesso à Lumi foram atualizadas.</p>
                
                <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
                  <p style="margin: 0 0 10px 0;"><strong>📧 Email:</strong> ${email}</p>
                  <p style="margin: 0;"><strong>🔑 Nova senha temporária:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${newPassword}</code></p>
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
                    Este email foi enviado para ${email} porque suas credenciais foram atualizadas.
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
      throw new Error(`Erro ao enviar email: ${JSON.stringify(errorData)}`);
    }

    const responseData = await emailResponse.json();
    console.log("✅ Email enviado com sucesso:", responseData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Senha atualizada e email enviado com sucesso!",
        data: responseData 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("❌ Erro ao processar reenvio individual:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Erro ao processar reenvio de email" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
