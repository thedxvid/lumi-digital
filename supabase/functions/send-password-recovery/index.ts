import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordRecoveryRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordRecoveryRequest = await req.json();

    console.log("Password recovery request for:", email);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Formato de email inválido" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Generate password recovery link using Supabase Admin API
    console.log("Generating recovery link for:", email);
    
    const { data: recoveryData, error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    // Log the full error for debugging
    if (recoveryError) {
      console.error("Full error from generateLink:", JSON.stringify(recoveryError));
      console.error("Error message:", recoveryError.message);
      console.error("Error code:", recoveryError.code);
      
      // Always return success to prevent email enumeration attacks
      // Even if the email doesn't exist, we pretend it worked
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Se o email estiver cadastrado, você receberá um link de recuperação" 
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    if (!recoveryData || !recoveryData.properties) {
      console.error("No recovery data returned");
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Se o email estiver cadastrado, você receberá um link de recuperação" 
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    console.log("Recovery link generated successfully for:", email);

    // Build the recovery URL with the generated token
    const token = recoveryData.properties.hashed_token;
    const recoveryUrl = `https://applumi.com/reset-password?token=${token}&type=recovery`;
    
    console.log("Recovery URL created (token redacted)");

    // Send email via Resend with custom template
    const emailResponse = await resend.emails.send({
      from: "Equipe Lumi <suportedalumi@gmail.com>",
      reply_to: "suportedalumi@gmail.com",
      to: [email],
      subject: "🔒 Recuperação de Senha - Lumi",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recuperação de Senha - Lumi</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
                        <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; padding: 20px; margin-bottom: 20px;">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zm0 2c1.654 0 3 1.346 3 3v3H9V7c0-1.654 1.346-3 3-3z" fill="white"/>
                          </svg>
                        </div>
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                          Recuperação de Senha
                        </h1>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                          Olá! 👋
                        </p>
                        <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                          Recebemos sua solicitação de recuperação de senha para sua conta na <strong>Lumi</strong>.
                        </p>
                        <p style="margin: 0 0 32px; color: #374151; font-size: 16px; line-height: 1.6;">
                          Clique no botão abaixo para criar uma nova senha. Este link é válido por <strong>1 hora</strong>.
                        </p>

                        <!-- Button -->
                        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 32px;">
                          <tr>
                            <td align="center">
                              <a href="${recoveryUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                                🔐 Redefinir Minha Senha
                              </a>
                            </td>
                          </tr>
                        </table>

                        <!-- Alternative link -->
                        <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                          Se o botão não funcionar, copie e cole este link no seu navegador:
                        </p>
                        <p style="margin: 0 0 32px; padding: 16px; background-color: #f9fafb; border-radius: 8px; word-break: break-all; font-size: 13px; color: #4b5563; font-family: monospace;">
                          ${recoveryUrl}
                        </p>

                        <!-- Security notice -->
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 0 0 24px;">
                          <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                            <strong>⚠️ Atenção:</strong> Se você não solicitou esta recuperação de senha, ignore este email. Sua senha permanecerá inalterada.
                          </p>
                        </div>

                        <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                          Por segurança, nunca compartilhe este link com outras pessoas.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 32px 40px; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 16px; color: #374151; font-size: 14px; font-weight: 600; text-align: center;">
                          Precisa de ajuda?
                        </p>
                        <p style="margin: 0; color: #6b7280; font-size: 13px; text-align: center; line-height: 1.6;">
                          Entre em contato conosco: 
                          <a href="mailto:suportedalumi@gmail.com" style="color: #667eea; text-decoration: none; font-weight: 600;">
                            suportedalumi@gmail.com
                          </a>
                        </p>
                        <div style="margin: 24px 0 0; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
                          <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                            © ${new Date().getFullYear()} Lumi - IA para Negócios Digitais<br>
                            Você está recebendo este email porque solicitou recuperação de senha.
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      text: `
Recuperação de Senha - Lumi

Olá!

Recebemos sua solicitação de recuperação de senha para sua conta na Lumi.

Para criar uma nova senha, acesse o link abaixo (válido por 1 hora):
${recoveryUrl}

ATENÇÃO: Se você não solicitou esta recuperação de senha, ignore este email. Sua senha permanecerá inalterada.

Por segurança, nunca compartilhe este link com outras pessoas.

Precisa de ajuda?
Entre em contato: suportedalumi@gmail.com

© ${new Date().getFullYear()} Lumi - IA para Negócios Digitais
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Email de recuperação enviado com sucesso" 
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
    console.error("Error in send-password-recovery function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao processar solicitação" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
