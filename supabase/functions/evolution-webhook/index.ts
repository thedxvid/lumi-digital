
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const webhookData = await req.json()
    console.log('Webhook received:', webhookData)

    // Handle different webhook events
    if (webhookData.event === 'messages.upsert') {
      const message = webhookData.data
      
      // Only process received messages (not sent)
      if (message.key.fromMe === false) {
        // Find the instance and user
        const { data: instance } = await supabaseClient
          .from('whatsapp_instances')
          .select('*')
          .eq('instance_key', webhookData.instance)
          .single()

        if (instance) {
          // Find lead by phone number
          const phoneNumber = message.key.remoteJid.replace('@s.whatsapp.net', '')
          const { data: lead } = await supabaseClient
            .from('leads')
            .select('*')
            .eq('user_id', instance.user_id)
            .eq('whatsapp_number', phoneNumber)
            .single()

          if (lead) {
            // Create interaction record
            await supabaseClient
              .from('lead_interactions')
              .insert({
                user_id: instance.user_id,
                lead_id: lead.id,
                interaction_type: 'whatsapp_received',
                title: 'Mensagem WhatsApp recebida',
                content: message.message?.conversation || message.message?.extendedTextMessage?.text || '[Mídia]',
                metadata: {
                  phone_number: phoneNumber,
                  message_id: message.key.id,
                  timestamp: message.messageTimestamp,
                  raw_message: message
                },
              })

            // Update lead's last interaction
            await supabaseClient
              .from('leads')
              .update({ 
                last_interaction: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', lead.id)

            // Analyze message for keywords and update lead score
            const messageText = (message.message?.conversation || message.message?.extendedTextMessage?.text || '').toLowerCase()
            let scoreChange = 0

            // Positive keywords increase score
            const positiveKeywords = ['interessado', 'quero', 'comprar', 'sim', 'ok', 'aceito', 'vamos', 'quando']
            const negativeKeywords = ['não', 'nao', 'depois', 'talvez', 'caro', 'desculpa', 'ocupado']

            for (const keyword of positiveKeywords) {
              if (messageText.includes(keyword)) {
                scoreChange += 2
                break
              }
            }

            for (const keyword of negativeKeywords) {
              if (messageText.includes(keyword)) {
                scoreChange -= 1
                break
              }
            }

            if (scoreChange !== 0) {
              const newScore = Math.max(0, Math.min(100, lead.lead_score + scoreChange))
              await supabaseClient
                .from('leads')
                .update({ lead_score: newScore })
                .eq('id', lead.id)
            }
          }
        }
      }
    }

    // Handle connection status changes
    if (webhookData.event === 'connection.update') {
      const { data: instance } = await supabaseClient
        .from('whatsapp_instances')
        .select('*')
        .eq('instance_key', webhookData.instance)
        .single()

      if (instance) {
        await supabaseClient
          .from('whatsapp_instances')
          .update({
            status: webhookData.data.state,
            is_connected: webhookData.data.state === 'open',
            updated_at: new Date().toISOString()
          })
          .eq('id', instance.id)
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
