import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReactivationEmailRequest {
  email: string;
  fullName: string;
  planType: string;
  endDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📧 Iniciando envio de email de reativação...');
    
    const { email, fullName, planType, endDate }: ReactivationEmailRequest = await req.json();

    const planName = planType === 'basic' ? 'Básico' : 'Gratuito';
    const formattedEndDate = new Date(endDate).toLocaleDateString('pt-BR');

    console.log('📧 Enviando email de reativação para:', email);

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
        subject: "🎉 Seu acesso à Lumi foi reativado!",
        headers: {
          'X-Entity-Ref-ID': `lumi-reactivation-${Date.now()}`,
          'List-Unsubscribe': '<mailto:suporte@applumi.com?subject=Unsubscribe>',
          'Precedence': 'bulk',
        },
        text: `
Olá, ${fullName}!

Temos ótimas notícias! Sua conta na Lumi foi reativada com sucesso! 🎉

📋 Detalhes da sua assinatura:
• Plano: ${planName}
• Válido até: ${formattedEndDate}

Você já pode acessar a plataforma com seu email e senha habituais.

Acesse agora: https://applumi.com/auth

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
                Sua conta na Lumi foi reativada! Acesse agora a plataforma.
              </div>
              
              <div style="background: #667eea; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Conta Reativada!</h1>
              </div>
              
              <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #667eea; margin-top: 0;">Olá, ${fullName}! 👋</h2>
                
                <p>Temos ótimas notícias! Sua conta na Lumi foi <strong style="color: #10b981;">reativada com sucesso</strong>! 🎉</p>
                
                <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 4px;">
                  <h3 style="color: #065f46; margin-top: 0;">📋 Detalhes da sua assinatura:</h3>
                  <p style="margin: 5px 0;"><strong>Plano:</strong> ${planName}</p>
                  <p style="margin: 5px 0;"><strong>Válido até:</strong> ${formattedEndDate}</p>
                </div>
                
                <p>Você já pode acessar a plataforma com seu <strong>email e senha habituais</strong>.</p>
                
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
                    Este email foi enviado para ${email} porque sua conta foi reativada na plataforma Lumi.
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
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
    }

    const responseData = await emailResponse.json();

    console.log("✅ Email de reativação enviado com sucesso:", responseData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email de reativação enviado com sucesso!",
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
    console.error("❌ Erro ao enviar email de reativação:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Erro ao enviar email de reativação" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
