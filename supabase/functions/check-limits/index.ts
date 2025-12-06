import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckLimitsRequest {
  feature: 'creative_images' | 'profile_analysis' | 'carousels' | 'carousel_images' | 'videos';
  increment?: boolean;
  imageCount?: number; // For carousel_images feature - how many images in this carousel
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
      console.error('❌ [check-limits] Auth error:', userError);
      throw new Error('Unauthorized');
    }

    const { feature, increment = false, imageCount = 0 }: CheckLimitsRequest = await req.json();
    
    console.log(`🔍 [check-limits] Request for user ${user.id}:`, { feature, increment, imageCount });

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
        // For 'lumi' plan, check carousel_images instead
        if (limits.plan_type === 'lumi') {
          // Redirect to carousel_images check
          const carouselImagesLimit = limits.carousel_images_monthly_limit || 30;
          const carouselImagesUsed = limits.carousel_images_monthly_used || 0;
          allowed = carouselImagesUsed < carouselImagesLimit;
          limitInfo = {
            limit: carouselImagesLimit,
            used: carouselImagesUsed,
            remaining: Math.max(0, carouselImagesLimit - carouselImagesUsed)
          };
          if (!allowed) {
            reason = 'Limite mensal de imagens de carrossel atingido';
            requiresUpgrade = true;
          }
        } else {
          // Standard carousel count limit for other plans
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
        }
        break;

      case 'carousel_images':
        // New feature for Lumi plan - counts total images across all carousels
        const carouselImagesLimit = limits.carousel_images_monthly_limit || 30;
        const carouselImagesUsed = limits.carousel_images_monthly_used || 0;
        const requestedImages = imageCount || 0;
        
        // Check if we can add the requested number of images
        allowed = (carouselImagesUsed + requestedImages) <= carouselImagesLimit;
        limitInfo = {
          limit: carouselImagesLimit,
          used: carouselImagesUsed,
          remaining: Math.max(0, carouselImagesLimit - carouselImagesUsed)
        };
        
        if (!allowed) {
          reason = `Limite de imagens de carrossel atingido. Restam ${limitInfo.remaining} imagens este mês.`;
          requiresUpgrade = true;
        }
        
        console.log(`📊 [check-limits] Carousel images for user ${user.id}:`, {
          limit: carouselImagesLimit,
          used: carouselImagesUsed,
          requested: requestedImages,
          remaining: limitInfo.remaining,
          allowed
        });
        break;

      case 'videos':
        // Verificar limites lifetime gratuitos + créditos extras comprados
        const totalSoraAvailable = (limits.sora_text_videos_lifetime_limit || 0) - (limits.sora_text_videos_lifetime_used || 0);
        const totalKlingAvailable = (limits.kling_image_videos_lifetime_limit || 0) - (limits.kling_image_videos_lifetime_used || 0);
        const extraCreditsAvailable = (limits.video_credits || 0) - (limits.video_credits_used || 0);
        
        // Usuário pode gerar vídeo se tiver QUALQUER crédito disponível
        const hasAnyCredits = totalSoraAvailable > 0 || totalKlingAvailable > 0 || extraCreditsAvailable > 0;
        
        allowed = hasAnyCredits;
        
        console.log(`📊 [check-limits] Video credits for user ${user.id}:`, {
          sora: { limit: limits.sora_text_videos_lifetime_limit, used: limits.sora_text_videos_lifetime_used, available: totalSoraAvailable },
          kling: { limit: limits.kling_image_videos_lifetime_limit, used: limits.kling_image_videos_lifetime_used, available: totalKlingAvailable },
          extra: { credits: limits.video_credits, used: limits.video_credits_used, available: extraCreditsAvailable },
          allowed
        });
        
        if (!allowed) {
          reason = 'Você usou todos os seus vídeos grátis! Compre créditos extras para continuar gerando.';
          requiresUpgrade = false; // Direcionar para compra de addons
        }
        
        limitInfo = {
          limit: (limits.sora_text_videos_lifetime_limit || 0) + (limits.kling_image_videos_lifetime_limit || 0) + (limits.video_credits || 0),
          used: (limits.sora_text_videos_lifetime_used || 0) + (limits.kling_image_videos_lifetime_used || 0) + (limits.video_credits_used || 0),
          remaining: totalSoraAvailable + totalKlingAvailable + extraCreditsAvailable
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
          if (limits.plan_type !== 'lumi') {
            // Only increment carousel count for non-lumi plans
            updates.carousels_monthly_used = limits.carousels_monthly_used + 1;
          }
          // For lumi plans, carousel_images increment is handled separately
          break;
        case 'carousel_images':
          // Increment by the number of images being generated
          updates.carousel_images_monthly_used = (limits.carousel_images_monthly_used || 0) + (imageCount || 1);
          break;
        case 'videos':
          // NOTA: O incremento de vídeos NÃO é feito aqui porque o generate-video
          // já decrementa os lifetime limits corretos (sora/kling) baseado na API usada.
          // Fazer increment aqui causaria dupla contagem.
          console.log('⚠️ Video increment skipped - handled by generate-video function');
          break;
      }

      if (Object.keys(updates).length > 0) {
        await supabaseClient
          .from('usage_limits')
          .update(updates)
          .eq('user_id', user.id);
        
        console.log(`✅ [check-limits] Updated usage for user ${user.id}:`, updates);
      }
    }

    const response: CheckLimitsResponse = {
      allowed,
      reason: reason || undefined,
      limits: limitInfo,
      requiresUpgrade,
      upgradeUrl: requiresUpgrade ? '/pricing' : undefined
    };

    console.log(`✅ [check-limits] Response for user ${user.id}:`, response);

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
