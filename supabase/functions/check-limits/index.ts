import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckLimitsRequest {
  feature: 'creative_images' | 'profile_analysis' | 'carousels' | 'videos';
  increment?: boolean;
}

interface CheckLimitsResponse {
  allowed: boolean;
  reason?: string;
  limits?: {
    limit: number;
    used: number;
    remaining: number;
  };
  requiresUpgrade?: boolean;
  upgradeUrl?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { feature, increment = false }: CheckLimitsRequest = await req.json();

    // Reset limits if needed
    await supabaseClient.rpc('reset_daily_limits');
    await supabaseClient.rpc('reset_monthly_limits');

    // Get user's current limits
    const { data: limits, error: limitsError } = await supabaseClient
      .from('usage_limits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (limitsError || !limits) {
      throw new Error('Could not fetch usage limits');
    }

    let allowed = false;
    let reason = '';
    let limitInfo = { limit: 0, used: 0, remaining: 0 };
    let requiresUpgrade = false;

    // Check feature-specific limits
    switch (feature) {
      case 'creative_images':
        const dailyAllowed = limits.creative_images_daily_used < limits.creative_images_daily_limit;
        const monthlyAllowed = limits.creative_images_monthly_used < limits.creative_images_monthly_limit;
        allowed = dailyAllowed && monthlyAllowed;
        
        if (!dailyAllowed) {
          reason = 'Limite diário de imagens criativas atingido';
          limitInfo = {
            limit: limits.creative_images_daily_limit,
            used: limits.creative_images_daily_used,
            remaining: 0
          };
        } else if (!monthlyAllowed) {
          reason = 'Limite mensal de imagens criativas atingido';
          limitInfo = {
            limit: limits.creative_images_monthly_limit,
            used: limits.creative_images_monthly_used,
            remaining: 0
          };
        } else {
          limitInfo = {
            limit: limits.creative_images_daily_limit,
            used: limits.creative_images_daily_used,
            remaining: limits.creative_images_daily_limit - limits.creative_images_daily_used
          };
        }
        requiresUpgrade = !allowed;
        break;

      case 'profile_analysis':
        allowed = limits.profile_analysis_daily_used < limits.profile_analysis_daily_limit;
        limitInfo = {
          limit: limits.profile_analysis_daily_limit,
          used: limits.profile_analysis_daily_used,
          remaining: Math.max(0, limits.profile_analysis_daily_limit - limits.profile_analysis_daily_used)
        };
        if (!allowed) {
          reason = 'Limite diário de análises de perfil atingido';
          requiresUpgrade = true;
        }
        break;

      case 'carousels':
        allowed = limits.carousels_monthly_used < limits.carousels_monthly_limit;
        limitInfo = {
          limit: limits.carousels_monthly_limit,
          used: limits.carousels_monthly_used,
          remaining: Math.max(0, limits.carousels_monthly_limit - limits.carousels_monthly_used)
        };
        if (!allowed) {
          reason = 'Limite mensal de carrosséis atingido';
          requiresUpgrade = true;
        }
        break;

      case 'videos':
        // Check if user has PRO plan
        if (limits.plan_type !== 'pro') {
          allowed = false;
          reason = 'Geração de vídeos disponível apenas no Plano PRO';
          requiresUpgrade = true;
          limitInfo = { limit: 0, used: 0, remaining: 0 };
          break;
        }

        // Check monthly limit or video credits
        const monthlyVideosAllowed = limits.videos_monthly_used < limits.videos_monthly_limit;
        const creditsAllowed = limits.video_credits_used < limits.video_credits;
        
        allowed = monthlyVideosAllowed || creditsAllowed;
        
        if (!allowed) {
          reason = 'Limite mensal de vídeos atingido. Considere comprar um pacote extra!';
          requiresUpgrade = false; // Can buy add-on instead
        }
        
        limitInfo = {
          limit: limits.videos_monthly_limit + limits.video_credits,
          used: limits.videos_monthly_used + limits.video_credits_used,
          remaining: Math.max(0, 
            (limits.videos_monthly_limit - limits.videos_monthly_used) +
            (limits.video_credits - limits.video_credits_used)
          )
        };
        break;
    }

    // Increment usage if allowed and requested
    if (allowed && increment) {
      const updates: Record<string, number> = {};

      switch (feature) {
        case 'creative_images':
          updates.creative_images_daily_used = limits.creative_images_daily_used + 1;
          updates.creative_images_monthly_used = limits.creative_images_monthly_used + 1;
          break;
        case 'profile_analysis':
          updates.profile_analysis_daily_used = limits.profile_analysis_daily_used + 1;
          break;
        case 'carousels':
          updates.carousels_monthly_used = limits.carousels_monthly_used + 1;
          break;
        case 'videos':
          if (limits.videos_monthly_used < limits.videos_monthly_limit) {
            updates.videos_monthly_used = limits.videos_monthly_used + 1;
          } else {
            updates.video_credits_used = limits.video_credits_used + 1;
          }
          break;
      }

      await supabaseClient
        .from('usage_limits')
        .update(updates)
        .eq('user_id', user.id);
    }

    const response: CheckLimitsResponse = {
      allowed,
      reason: reason || undefined,
      limits: limitInfo,
      requiresUpgrade,
      upgradeUrl: requiresUpgrade ? '/pricing' : undefined
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error checking limits:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        allowed: false 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
