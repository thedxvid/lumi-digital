import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  fullName: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📧 Iniciando envio de email de boas-vindas...');
    
    const { email, fullName, password }: WelcomeEmailRequest = await req.json();

    console.log('📧 Enviando email para:', email);

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
                  <a href="${Deno.env.get('VITE_SUPABASE_URL') || 'https://app.lumi.com'}/auth" 
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
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
    }

    const responseData = await emailResponse.json();

    console.log("✅ Email enviado com sucesso:", responseData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email de boas-vindas enviado com sucesso!",
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
    console.error("❌ Erro ao enviar email de boas-vindas:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Erro ao enviar email" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);