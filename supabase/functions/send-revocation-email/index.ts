import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RevocationEmailRequest {
  email: string;
  fullName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName }: RevocationEmailRequest = await req.json();

    console.log('Sending revocation email to:', email);

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
        subject: "Atualização sobre seu acesso à plataforma LUMI",
        headers: {
          'X-Entity-Ref-ID': `lumi-revocation-${Date.now()}`,
          'List-Unsubscribe': '<mailto:suporte@applumi.com?subject=Unsubscribe>',
          'Precedence': 'bulk',
        },
        text: `
Olá ${fullName || 'Cliente'},

Estamos entrando em contato para informá-lo sobre uma atualização importante em sua conta LUMI.

Após nossa reconciliação de acessos pós-Black Friday, identificamos que seu acesso à plataforma foi revogado.

Isso pode ter ocorrido por um dos seguintes motivos:
- Seu email não consta na lista de compradores validados
- Houve divergência entre o email de compra e cadastro
- Seu pagamento ainda não foi processado ou aprovado

Se você acredita que isso é um erro, entre em contato conosco imediatamente com:
- Comprovante de pagamento
- Email usado na compra
- Número do pedido (se disponível)

Nossa equipe de suporte terá prazer em revisar seu caso e regularizar seu acesso se aplicável.

Atenciosamente,
Equipe LUMI

© ${new Date().getFullYear()} Lumi - Plataforma de Marketing Digital
        `,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>LUMI 🌟</h1>
            </div>
            <div class="content">
              <p>Olá ${fullName || 'Cliente'},</p>
              
              <p>Estamos entrando em contato para informá-lo sobre uma atualização importante em sua conta LUMI.</p>
              
              <p><strong>Após nossa reconciliação de acessos pós-Black Friday, identificamos que seu acesso à plataforma foi revogado.</strong></p>
              
              <p>Isso pode ter ocorrido por um dos seguintes motivos:</p>
              <ul>
                <li>Seu email não consta na lista de compradores validados</li>
                <li>Houve divergência entre o email de compra e cadastro</li>
                <li>Seu pagamento ainda não foi processado ou aprovado</li>
              </ul>
              
              <p><strong>Se você acredita que isso é um erro</strong>, entre em contato conosco imediatamente com:</p>
              <ul>
                <li>Comprovante de pagamento</li>
                <li>Email usado na compra</li>
                <li>Número do pedido (se disponível)</li>
              </ul>
              
              <p>Nossa equipe de suporte terá prazer em revisar seu caso e regularizar seu acesso se aplicável.</p>
              
              <p style="margin-top: 30px;">Atenciosamente,<br><strong>Equipe LUMI</strong></p>
            </div>
            <div class="footer">
              <p>Este é um email automático. Para suporte, entre em contato através dos nossos canais oficiais.</p>
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
    console.log("✅ Revocation email sent successfully:", responseData);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email de revogação enviado com sucesso!",
      data: responseData 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("❌ Error sending revocation email:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Erro ao enviar email de revogação"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
