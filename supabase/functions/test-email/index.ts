import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 Iniciando teste de email...');
    
    const { email }: TestEmailRequest = await req.json();

    if (!email) {
      throw new Error("Email é obrigatório");
    }

    console.log('📧 Enviando email de teste para:', email);

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
        subject: "🧪 Teste de Email - Sistema Lumi",
        headers: {
          'X-Entity-Ref-ID': `lumi-test-${Date.now()}`,
          'List-Unsubscribe': '<mailto:suporte@applumi.com?subject=Unsubscribe>',
          'Precedence': 'bulk',
        },
        text: `
TESTE DE EMAIL - SISTEMA LUMI

Este é um email de teste do sistema Lumi.

✅ Sucesso! O sistema de envio de emails está configurado corretamente e funcionando.

Detalhes do Teste:
📧 Destinatário: ${email}
⏰ Data/Hora: ${new Date().toLocaleString('pt-BR')}
🔧 Sistema: Resend + Supabase Edge Functions

Se você recebeu este email, significa que o sistema de notificações está pronto para uso!

© ${new Date().getFullYear()} Lumi - Email de Teste
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
                Teste de email do sistema Lumi - Verificando deliverability
              </div>
              
              <div style="background: #10b981; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🧪 Teste de Email</h1>
              </div>
              
              <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #10b981; margin-top: 0;">Sistema Funcionando Perfeitamente! ✅</h2>
                
                <p>Este é um email de teste do sistema Lumi.</p>
                
                <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #065f46;">
                    <strong>✅ Sucesso!</strong> O sistema de envio de emails está configurado corretamente e funcionando.
                  </p>
                </div>
                
                <div style="background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 4px; border: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;"><strong>Detalhes do Teste:</strong></p>
                  <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">📧 Destinatário: ${email}</p>
                  <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">⏰ Data/Hora: ${new Date().toLocaleString('pt-BR')}</p>
                  <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">🔧 Sistema: Resend + Supabase Edge Functions</p>
                </div>
                
                <p style="color: #6b7280; font-size: 14px;">
                  Se você recebeu este email, significa que o sistema de notificações está pronto para uso! 🎉
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <div style="text-align: center; margin-top: 30px;">
                  <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
                    Precisa de ajuda? Entre em contato:
                  </p>
                  <p style="color: #10b981; font-size: 14px; margin: 5px 0;">
                    📧 <a href="mailto:suporte@applumi.com" style="color: #10b981; text-decoration: none;">suporte@applumi.com</a>
                  </p>
                  
                  <p style="color: #9ca3af; font-size: 11px; margin-top: 15px;">
                    © ${new Date().getFullYear()} Lumi - Email de Teste
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
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
    }

    const responseData = await emailResponse.json();

    console.log("✅ Email de teste enviado com sucesso:", responseData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email de teste enviado com sucesso!",
        data: {
          email_id: responseData.id,
          email: email
        }
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
    console.error("❌ Erro ao enviar email de teste:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Erro ao enviar email de teste" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);