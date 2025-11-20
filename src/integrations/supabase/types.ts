export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      agent_usage: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      carousel_history: {
        Row: {
          call_to_action: string | null
          color_palette: string | null
          created_at: string
          id: string
          image_count: number
          images: Json
          prompt: string
          slides_config: Json | null
          theme: string | null
          title: string | null
          tone: string | null
          user_id: string
        }
        Insert: {
          call_to_action?: string | null
          color_palette?: string | null
          created_at?: string
          id?: string
          image_count?: number
          images: Json
          prompt: string
          slides_config?: Json | null
          theme?: string | null
          title?: string | null
          tone?: string | null
          user_id: string
        }
        Update: {
          call_to_action?: string | null
          color_palette?: string | null
          created_at?: string
          id?: string
          image_count?: number
          images?: Json
          prompt?: string
          slides_config?: Json | null
          theme?: string | null
          title?: string | null
          tone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          agent_id: string | null
          created_at: string | null
          id: string
          messages: Json | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          id?: string
          messages?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          id?: string
          messages?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      creative_history: {
        Row: {
          call_to_action: string | null
          color_palette: string | null
          config: Json | null
          created_at: string
          creative_type: string | null
          format: string | null
          generated_image: string
          id: string
          is_favorite: boolean | null
          main_text: string | null
          market: string | null
          objective: string | null
          original_images: Json
          prompt: string
          secondary_text: string | null
          tags: string[] | null
          target_audience: string | null
          tone: string | null
          typography: string | null
          updated_at: string
          user_id: string
          visual_style: string | null
        }
        Insert: {
          call_to_action?: string | null
          color_palette?: string | null
          config?: Json | null
          created_at?: string
          creative_type?: string | null
          format?: string | null
          generated_image: string
          id?: string
          is_favorite?: boolean | null
          main_text?: string | null
          market?: string | null
          objective?: string | null
          original_images?: Json
          prompt: string
          secondary_text?: string | null
          tags?: string[] | null
          target_audience?: string | null
          tone?: string | null
          typography?: string | null
          updated_at?: string
          user_id: string
          visual_style?: string | null
        }
        Update: {
          call_to_action?: string | null
          color_palette?: string | null
          config?: Json | null
          created_at?: string
          creative_type?: string | null
          format?: string | null
          generated_image?: string
          id?: string
          is_favorite?: boolean | null
          main_text?: string | null
          market?: string | null
          objective?: string | null
          original_images?: Json
          prompt?: string
          secondary_text?: string | null
          tags?: string[] | null
          target_audience?: string | null
          tone?: string | null
          typography?: string | null
          updated_at?: string
          user_id?: string
          visual_style?: string | null
        }
        Relationships: []
      }
      custom_agents: {
        Row: {
          capabilities: Json
          color: string
          created_at: string | null
          created_by: string | null
          description: string
          entity_type: string | null
          icon: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          pdf_content: string | null
          pdf_filename: string | null
          suggested_topics: Json
          system_prompt: string
          updated_at: string | null
          user_role: string | null
        }
        Insert: {
          capabilities?: Json
          color?: string
          created_at?: string | null
          created_by?: string | null
          description: string
          entity_type?: string | null
          icon?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          pdf_content?: string | null
          pdf_filename?: string | null
          suggested_topics?: Json
          system_prompt: string
          updated_at?: string | null
          user_role?: string | null
        }
        Update: {
          capabilities?: Json
          color?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          entity_type?: string | null
          icon?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          pdf_content?: string | null
          pdf_filename?: string | null
          suggested_topics?: Json
          system_prompt?: string
          updated_at?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      generated_assets: {
        Row: {
          asset_type: string
          content: string | null
          created_at: string | null
          id: string
          is_favorite: boolean | null
          module_used: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset_type: string
          content?: string | null
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          module_used: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset_type?: string
          content?: string | null
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          module_used?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lead_interactions: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          interaction_type: string
          lead_id: string
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          interaction_type: string
          lead_id: string
          metadata?: Json | null
          title: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          interaction_type?: string
          lead_id?: string
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          behavior_notes: string | null
          company: string | null
          contact: string | null
          created_at: string | null
          deal_value: number | null
          email: string | null
          id: string
          last_interaction: string | null
          lead_score: number | null
          name: string
          next_contact_date: string | null
          notes: string | null
          origin_campaign_id: string | null
          phone: string | null
          pipeline_stage_id: string | null
          source: string | null
          status: string | null
          tags: string[] | null
          temperature: string | null
          updated_at: string | null
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          behavior_notes?: string | null
          company?: string | null
          contact?: string | null
          created_at?: string | null
          deal_value?: number | null
          email?: string | null
          id?: string
          last_interaction?: string | null
          lead_score?: number | null
          name: string
          next_contact_date?: string | null
          notes?: string | null
          origin_campaign_id?: string | null
          phone?: string | null
          pipeline_stage_id?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          temperature?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          behavior_notes?: string | null
          company?: string | null
          contact?: string | null
          created_at?: string | null
          deal_value?: number | null
          email?: string | null
          id?: string
          last_interaction?: string | null
          lead_score?: number | null
          name?: string
          next_contact_date?: string | null
          notes?: string | null
          origin_campaign_id?: string | null
          phone?: string | null
          pipeline_stage_id?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          temperature?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          agent_id: string | null
          content: string
          conversation_id: string
          created_at: string | null
          generated_images: Json | null
          id: string
          role: string
        }
        Insert: {
          agent_id?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          generated_images?: Json | null
          id?: string
          role: string
        }
        Update: {
          agent_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          generated_images?: Json | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          feature_updates: boolean | null
          goal_reminders: boolean | null
          id: string
          inactivity_reminders: boolean | null
          push_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string | null
          user_id: string
          weekly_digest: boolean | null
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          feature_updates?: boolean | null
          goal_reminders?: boolean | null
          id?: string
          inactivity_reminders?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string | null
          user_id: string
          weekly_digest?: boolean | null
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          feature_updates?: boolean | null
          goal_reminders?: boolean | null
          id?: string
          inactivity_reminders?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string | null
          user_id?: string
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          access_granted: boolean | null
          created_at: string | null
          credentials_sent: boolean | null
          customer_email: string
          customer_mobile: string | null
          customer_name: string
          id: string
          installment_value: number | null
          installments_number: number | null
          kiwify_order_ref: string | null
          order_status: string | null
          order_value: number | null
          order_value_formatted: string | null
          payment_method: string | null
          product_id: string | null
          product_name: string | null
          product_type: string | null
          status: string | null
          transaction_id: string | null
          updated_at: string | null
          user_id: string | null
          webhook_data: Json | null
        }
        Insert: {
          access_granted?: boolean | null
          created_at?: string | null
          credentials_sent?: boolean | null
          customer_email: string
          customer_mobile?: string | null
          customer_name: string
          id?: string
          installment_value?: number | null
          installments_number?: number | null
          kiwify_order_ref?: string | null
          order_status?: string | null
          order_value?: number | null
          order_value_formatted?: string | null
          payment_method?: string | null
          product_id?: string | null
          product_name?: string | null
          product_type?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          webhook_data?: Json | null
        }
        Update: {
          access_granted?: boolean | null
          created_at?: string | null
          credentials_sent?: boolean | null
          customer_email?: string
          customer_mobile?: string | null
          customer_name?: string
          id?: string
          installment_value?: number | null
          installments_number?: number | null
          kiwify_order_ref?: string | null
          order_status?: string | null
          order_value?: number | null
          order_value_formatted?: string | null
          payment_method?: string | null
          product_id?: string | null
          product_name?: string | null
          product_type?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          webhook_data?: Json | null
        }
        Relationships: []
      }
      profile_analyses: {
        Row: {
          analysis_result: Json
          created_at: string | null
          id: string
          input_data: Json
          is_favorite: boolean | null
          platform: string
          profile_image: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_result: Json
          created_at?: string | null
          id?: string
          input_data: Json
          is_favorite?: boolean | null
          platform: string
          profile_image: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_result?: Json
          created_at?: string | null
          id?: string
          input_data?: Json
          is_favorite?: boolean | null
          platform?: string
          profile_image?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          access_granted: boolean | null
          created_at: string | null
          full_name: string | null
          id: string
          subscription_status: string | null
          updated_at: string | null
        }
        Insert: {
          access_granted?: boolean | null
          created_at?: string | null
          full_name?: string | null
          id: string
          subscription_status?: string | null
          updated_at?: string | null
        }
        Update: {
          access_granted?: boolean | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          subscription_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_messages: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          message_content: string
          phone_number: string
          scheduled_for: string
          sent_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_content: string
          phone_number: string
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_content?: string
          phone_number?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          duration_months: number
          end_date: string
          id: string
          is_active: boolean | null
          plan_type: string
          start_date: string
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          duration_months: number
          end_date: string
          id?: string
          is_active?: boolean | null
          plan_type: string
          start_date?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          duration_months?: number
          end_date?: string
          id?: string
          is_active?: boolean | null
          plan_type?: string
          start_date?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usage_limits: {
        Row: {
          carousels_monthly_limit: number
          carousels_monthly_used: number
          created_at: string | null
          creative_images_daily_limit: number
          creative_images_daily_used: number
          creative_images_monthly_limit: number
          creative_images_monthly_used: number
          id: string
          kling_image_videos_lifetime_limit: number | null
          kling_image_videos_lifetime_used: number | null
          last_daily_reset: string
          last_monthly_reset: string
          plan_type: string
          profile_analysis_daily_limit: number
          profile_analysis_daily_used: number
          sora_text_videos_lifetime_limit: number | null
          sora_text_videos_lifetime_used: number | null
          updated_at: string | null
          user_id: string
          video_credits: number
          video_credits_used: number
          videos_monthly_limit: number
          videos_monthly_used: number
        }
        Insert: {
          carousels_monthly_limit?: number
          carousels_monthly_used?: number
          created_at?: string | null
          creative_images_daily_limit?: number
          creative_images_daily_used?: number
          creative_images_monthly_limit?: number
          creative_images_monthly_used?: number
          id?: string
          kling_image_videos_lifetime_limit?: number | null
          kling_image_videos_lifetime_used?: number | null
          last_daily_reset?: string
          last_monthly_reset?: string
          plan_type: string
          profile_analysis_daily_limit?: number
          profile_analysis_daily_used?: number
          sora_text_videos_lifetime_limit?: number | null
          sora_text_videos_lifetime_used?: number | null
          updated_at?: string | null
          user_id: string
          video_credits?: number
          video_credits_used?: number
          videos_monthly_limit?: number
          videos_monthly_used?: number
        }
        Update: {
          carousels_monthly_limit?: number
          carousels_monthly_used?: number
          created_at?: string | null
          creative_images_daily_limit?: number
          creative_images_daily_used?: number
          creative_images_monthly_limit?: number
          creative_images_monthly_used?: number
          id?: string
          kling_image_videos_lifetime_limit?: number | null
          kling_image_videos_lifetime_used?: number | null
          last_daily_reset?: string
          last_monthly_reset?: string
          plan_type?: string
          profile_analysis_daily_limit?: number
          profile_analysis_daily_used?: number
          sora_text_videos_lifetime_limit?: number | null
          sora_text_videos_lifetime_used?: number | null
          updated_at?: string | null
          user_id?: string
          video_credits?: number
          video_credits_used?: number
          videos_monthly_limit?: number
          videos_monthly_used?: number
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          action: string
          activity_date: string | null
          chats_started: number | null
          created_at: string | null
          details: Json | null
          id: string
          modules_used: string[] | null
          results_generated: number | null
          time_spent_minutes: number | null
          user_id: string
        }
        Insert: {
          action: string
          activity_date?: string | null
          chats_started?: number | null
          created_at?: string | null
          details?: Json | null
          id?: string
          modules_used?: string[] | null
          results_generated?: number | null
          time_spent_minutes?: number | null
          user_id: string
        }
        Update: {
          action?: string
          activity_date?: string | null
          chats_started?: number | null
          created_at?: string | null
          details?: Json | null
          id?: string
          modules_used?: string[] | null
          results_generated?: number | null
          time_spent_minutes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          created_at: string | null
          current_value: number | null
          deadline: string | null
          description: string | null
          goal_type: string
          id: string
          status: string | null
          target_value: number
          title: string
          unit: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          deadline?: string | null
          description?: string | null
          goal_type: string
          id?: string
          status?: string | null
          target_value: number
          title: string
          unit: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          deadline?: string | null
          description?: string | null
          goal_type?: string
          id?: string
          status?: string | null
          target_value?: number
          title?: string
          unit?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_addons: {
        Row: {
          credits_amount: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          package_type: string
          price_paid: number
          purchased_at: string | null
          stripe_payment_id: string | null
          user_id: string
        }
        Insert: {
          credits_amount: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          package_type: string
          price_paid: number
          purchased_at?: string | null
          stripe_payment_id?: string | null
          user_id: string
        }
        Update: {
          credits_amount?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          package_type?: string
          price_paid?: number
          purchased_at?: string | null
          stripe_payment_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      video_history: {
        Row: {
          api_used: string | null
          aspect_ratio: string | null
          created_at: string
          duration: string | null
          has_audio: boolean | null
          id: string
          is_favorite: boolean | null
          prompt: string
          resolution: string | null
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          video_url: string
        }
        Insert: {
          api_used?: string | null
          aspect_ratio?: string | null
          created_at?: string
          duration?: string | null
          has_audio?: boolean | null
          id?: string
          is_favorite?: boolean | null
          prompt: string
          resolution?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          video_url: string
        }
        Update: {
          api_used?: string | null
          aspect_ratio?: string | null
          created_at?: string
          duration?: string | null
          has_audio?: boolean | null
          id?: string
          is_favorite?: boolean | null
          prompt?: string
          resolution?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string
        }
        Relationships: []
      }
      whatsapp_campaigns: {
        Row: {
          created_at: string | null
          delivered_count: number | null
          failed_count: number | null
          id: string
          instance_id: string | null
          name: string
          scheduled_at: string | null
          sent_count: number | null
          status: string | null
          target_numbers: Json | null
          template_id: string | null
          total_targets: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivered_count?: number | null
          failed_count?: number | null
          id?: string
          instance_id?: string | null
          name: string
          scheduled_at?: string | null
          sent_count?: number | null
          status?: string | null
          target_numbers?: Json | null
          template_id?: string | null
          total_targets?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivered_count?: number | null
          failed_count?: number | null
          id?: string
          instance_id?: string | null
          name?: string
          scheduled_at?: string | null
          sent_count?: number | null
          status?: string | null
          target_numbers?: Json | null
          template_id?: string | null
          total_targets?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_campaigns_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          api_url: string
          created_at: string | null
          id: string
          instance_key: string
          instance_name: string
          is_connected: boolean | null
          last_sync: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_url: string
          created_at?: string | null
          id?: string
          instance_key: string
          instance_name: string
          is_connected?: boolean | null
          last_sync?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_url?: string
          created_at?: string | null
          id?: string
          instance_key?: string
          instance_name?: string
          is_connected?: boolean | null
          last_sync?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          usage_count: number | null
          user_id: string
          variables: Json | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
          variables?: Json | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
          variables?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_subscription_end_date: {
        Args: { duration_months: number; start_date: string }
        Returns: string
      }
      get_user_streak: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      log_activity: {
        Args: { _action: string; _details?: Json }
        Returns: undefined
      }
      reset_daily_limits: { Args: never; Returns: undefined }
      reset_monthly_limits: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
