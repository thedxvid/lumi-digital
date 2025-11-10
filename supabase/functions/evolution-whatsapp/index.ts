
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, instanceId, phoneNumber, message, leadId } = await req.json()

    // Get instance details
    const { data: instance, error: instanceError } = await supabaseClient
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('user_id', user.id)
      .single()

    if (instanceError || !instance) {
      return new Response(
        JSON.stringify({ error: 'Instance not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'send_message') {
      // Send message via Evolution API
      const evolutionResponse = await fetch(`${instance.api_url}/message/sendText/${instance.instance_key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': instance.api_token || '',
        },
        body: JSON.stringify({
          number: phoneNumber,
          text: message,
        }),
      })

      const evolutionData = await evolutionResponse.json()

      if (evolutionResponse.ok) {
        // Log interaction if leadId is provided
        if (leadId) {
          await supabaseClient
            .from('lead_interactions')
            .insert({
              user_id: user.id,
              lead_id: leadId,
              interaction_type: 'whatsapp_sent',
              title: 'Mensagem WhatsApp enviada',
              content: message,
              metadata: { phone_number: phoneNumber, evolution_data: evolutionData },
            })
        }

        return new Response(
          JSON.stringify({ success: true, data: evolutionData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        console.error('Evolution API error:', evolutionData)
        return new Response(
          JSON.stringify({ error: 'Failed to send message', details: evolutionData }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    if (action === 'get_qr_code') {
      // Get QR code from Evolution API
      const qrResponse = await fetch(`${instance.api_url}/instance/connect/${instance.instance_key}`, {
        method: 'GET',
        headers: {
          'apikey': instance.api_token || '',
        },
      })

      const qrData = await qrResponse.json()

      if (qrResponse.ok) {
        // Update instance with QR code
        await supabaseClient
          .from('whatsapp_instances')
          .update({ qr_code: qrData.base64 })
          .eq('id', instanceId)
          .eq('user_id', user.id)

        return new Response(
          JSON.stringify({ success: true, qr_code: qrData.base64 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        return new Response(
          JSON.stringify({ error: 'Failed to get QR code', details: qrData }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    if (action === 'check_status') {
      // Check instance status
      const statusResponse = await fetch(`${instance.api_url}/instance/connectionState/${instance.instance_key}`, {
        method: 'GET',
        headers: {
          'apikey': instance.api_token || '',
        },
      })

      const statusData = await statusResponse.json()

      if (statusResponse.ok) {
        // Update instance status
        await supabaseClient
          .from('whatsapp_instances')
          .update({ 
            status: statusData.state,
            is_connected: statusData.state === 'open'
          })
          .eq('id', instanceId)
          .eq('user_id', user.id)

        return new Response(
          JSON.stringify({ success: true, status: statusData.state }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        return new Response(
          JSON.stringify({ error: 'Failed to check status', details: statusData }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
