import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookData = await req.json();
    console.log('Webhook received:', JSON.stringify(webhookData, null, 2));

    // Handle different webhook events
    if (webhookData.event === 'message_sent') {
      // Update scheduled message status
      if (webhookData.message_id) {
        const { error } = await supabase
          .from('scheduled_messages')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            delivery_status: 'sent',
            webhook_data: webhookData
          })
          .eq('id', webhookData.message_id);

        if (error) {
          console.error('Error updating scheduled message:', error);
        }

        // Update campaign counters
        if (webhookData.campaign_id) {
          await supabase.rpc('increment_campaign_sent_count', {
            campaign_id: webhookData.campaign_id
          });
        }
      }

      // Log interaction
      await supabase
        .from('lead_interactions')
        .insert({
          user_id: webhookData.user_id,
          phone_number: webhookData.phone_number,
          interaction_type: 'whatsapp_sent',
          message_content: webhookData.message_content,
          direction: 'outgoing',
          instance_id: webhookData.instance_id,
          campaign_id: webhookData.campaign_id,
          webhook_data: webhookData
        });
    }

    if (webhookData.event === 'message_delivered') {
      // Update delivery status
      if (webhookData.message_id) {
        await supabase
          .from('scheduled_messages')
          .update({
            delivery_status: 'delivered',
            webhook_data: webhookData
          })
          .eq('id', webhookData.message_id);

        // Update campaign counters
        if (webhookData.campaign_id) {
          await supabase.rpc('increment_campaign_delivered_count', {
            campaign_id: webhookData.campaign_id
          });
        }
      }
    }

    if (webhookData.event === 'message_read') {
      // Update read status
      if (webhookData.message_id) {
        await supabase
          .from('scheduled_messages')
          .update({
            delivery_status: 'read',
            webhook_data: webhookData
          })
          .eq('id', webhookData.message_id);

        // Update campaign counters
        if (webhookData.campaign_id) {
          await supabase.rpc('increment_campaign_read_count', {
            campaign_id: webhookData.campaign_id
          });
        }
      }
    }

    if (webhookData.event === 'message_received') {
      // Handle incoming messages
      await supabase
        .from('lead_interactions')
        .insert({
          user_id: webhookData.user_id,
          phone_number: webhookData.phone_number,
          interaction_type: 'whatsapp_received',
          message_content: webhookData.message_content,
          direction: 'incoming',
          instance_id: webhookData.instance_id,
          webhook_data: webhookData
        });
    }

    if (webhookData.event === 'instance_status_change') {
      // Update instance status
      await supabase
        .from('whatsapp_instances')
        .update({
          status: webhookData.status,
          is_connected: webhookData.status === 'connected',
          phone_number: webhookData.phone_number || null,
          qr_code: webhookData.qr_code || null
        })
        .eq('instance_key', webhookData.instance_key);
    }

    if (webhookData.event === 'message_failed') {
      // Handle failed messages
      if (webhookData.message_id) {
        await supabase
          .from('scheduled_messages')
          .update({
            status: 'failed',
            delivery_status: 'failed',
            error_message: webhookData.error_message,
            webhook_data: webhookData
          })
          .eq('id', webhookData.message_id);

        // Update campaign counters
        if (webhookData.campaign_id) {
          await supabase.rpc('increment_campaign_failed_count', {
            campaign_id: webhookData.campaign_id
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, event: webhookData.event }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});