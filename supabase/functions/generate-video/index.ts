import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const FAL_KEY = Deno.env.get('FAL_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const VideoGenerationSchema = z.object({
  mode: z.enum(['text-to-video', 'image-to-video']).optional().default('text-to-video'),
  prompt: z.string().max(2000, 'Prompt muito longo').optional(),
  input_images: z.array(z.string().url('URL de imagem inválida')).optional(),
  aspect_ratio: z.enum(['16:9', '9:16', '1:1']).optional().default('16:9'),
  duration: z.enum(['4s', '6s', '8s', '10s']).optional().default('8s'),
  resolution: z.string().optional().default('720p'),
  generate_audio: z.boolean().optional().default(true),
  negative_prompt: z.string().max(1000).optional(),
  enhance_prompt: z.boolean().optional().default(true),
  seed: z.number().int().optional(),
  auto_fix: z.boolean().optional().default(true),
  api_provider: z.string().optional().default('fal_kling_v26_pro')
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input with zod
    const rawInput = await req.json();
    const validationResult = VideoGenerationSchema.safeParse(rawInput);
    
    if (!validationResult.success) {
      console.error('❌ Validation error:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Dados inválidos',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      mode,
      prompt, 
      input_images,
      aspect_ratio, 
      duration, 
      resolution,
      generate_audio,
      negative_prompt,
      enhance_prompt,
      seed,
      auto_fix,
      api_provider
    } = validationResult.data;

    console.log('Generating video:', { mode, api_provider, has_images: !!input_images });

    // ============ VERIFICAÇÃO DE CRÉDITOS ANTES DA GERAÇÃO ============
    // Criar cliente Supabase para verificar créditos
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============ BYOK: CHECK IF USER HAS OWN API KEY ============
    const encryptionKey = 'lumi-api-key-secret-2024';
    
    const { data: userKeyData } = await supabaseClient
      .from('user_api_keys')
      .select('api_key_encrypted, is_active, is_valid, last_validated_at')
      .eq('user_id', user.id)
      .eq('provider', 'fal_ai')
      .eq('is_active', true)
      .single();

    let userApiKey: string | null = null;
    let isUsingUserKey = false;
    let byokError: string | null = null;

    // ✅ VERIFICAÇÃO APRIMORADA: Apenas usar chave se for válida
    if (userKeyData) {
      // Verificar se a chave foi validada e é válida
      if (userKeyData.is_valid === false) {
        console.log('⚠️ User has BYOK but is_valid=false - falling back to platform key');
        byokError = 'Sua chave Fal.ai está marcada como inválida. Vá em Configurações → Integrações para revalidar.';
      } else if (userKeyData.is_valid === null) {
        console.log('⚠️ User has BYOK but never validated - falling back to platform key');
        byokError = 'Sua chave Fal.ai ainda não foi validada. Vá em Configurações → Integrações para validar.';
      } else if (userKeyData.is_valid === true) {
        // Decrypt user's key
        const { data: decryptedKey, error: decryptError } = await supabaseClient.rpc('decrypt_api_key', {
          encrypted_text: userKeyData.api_key_encrypted,
          encryption_key: encryptionKey
        });

        if (!decryptError && decryptedKey) {
          userApiKey = decryptedKey;
          isUsingUserKey = true;
          console.log('✅ Using user\'s own Fal.ai API key (validated)');
        } else {
          console.error('❌ Failed to decrypt user API key:', decryptError?.message);
          byokError = 'Erro ao usar sua chave Fal.ai. Reconecte em Configurações → Integrações.';
        }
      }
    }

    // Select API key: user's key or platform's key
    const FAL_API_KEY = userApiKey || FAL_KEY;
    
    if (!FAL_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar limites atuais para logging
    const { data: currentLimits } = await supabaseClient
      .from('usage_limits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const creditsBeforeAttempt = currentLimits?.video_credits || 0;
    const creditsUsedBefore = currentLimits?.video_credits_used || 0;
    const klingLifetimeBefore = currentLimits?.kling_image_videos_lifetime_used || 0;

    // ONLY reserve credits if NOT using user's own key
    let creditType: string | null = null;
    
    if (!isUsingUserKey) {
      // Reservar crédito ANTES de gerar o vídeo (somente se usando key da plataforma)
      const { data: reserveResult, error: reserveError } = await supabaseClient.rpc('reserve_video_credit', {
        p_user_id: user.id,
        p_api_provider: api_provider
      });

      console.log('Reserve credit result:', reserveResult);

      if (reserveError || !reserveResult?.success) {
        const errorMsg = reserveResult?.error || 'Erro ao reservar crédito';
        
        // Log da tentativa falha
        await supabaseClient.from('video_generation_log').insert({
          user_id: user.id,
          api_provider,
          mode,
          prompt: prompt || null,
          credits_before: creditsBeforeAttempt - creditsUsedBefore,
          credits_after: creditsBeforeAttempt - creditsUsedBefore,
          kling_lifetime_before: klingLifetimeBefore,
          kling_lifetime_after: klingLifetimeBefore,
          success: false,
          error_message: errorMsg,
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          user_agent: req.headers.get('user-agent')
        });

        return new Response(
          JSON.stringify({ 
            error: errorMsg === 'Créditos insuficientes' 
              ? 'Você não tem créditos suficientes para gerar vídeos. Compre mais créditos ou aguarde a renovação do seu plano.'
              : errorMsg
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      creditType = reserveResult.credit_type;
      console.log('Credit reserved successfully:', creditType);
    } else {
      console.log('Skipping credit reservation - using user\'s own API key');
    }

    // Validations
    if (mode === 'text-to-video' && (!prompt || prompt.trim().length < 10)) {
      return new Response(
        JSON.stringify({ error: 'Prompt deve ter pelo menos 10 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (mode === 'image-to-video' && (!input_images || input_images.length === 0)) {
      return new Response(
        JSON.stringify({ error: 'Pelo menos 1 imagem é necessária para image-to-video' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Configuração das APIs disponíveis
    const apiConfigs: Record<string, { 
      endpoint: string, 
      key: string | undefined, 
      authPrefix: string,
      requiresUserKey?: boolean
    }> = {
      fal_kling_v26_pro: {
        endpoint: 'https://fal.run/fal-ai/kling-video/v2.6/pro/text-to-video',
        key: FAL_KEY,
        authPrefix: 'Key',
        requiresUserKey: false
      },
      fal_kling_v26_image_to_video: {
        endpoint: 'https://fal.run/fal-ai/kling-video/v2.6/pro/image-to-video',
        key: FAL_KEY,
        authPrefix: 'Key',
        requiresUserKey: false
      },
      
      // ===== VEO 3.1 - APENAS BYOK =====
      fal_veo31: {
        endpoint: 'https://fal.run/fal-ai/veo3.1',
        key: FAL_KEY, // Nunca será usado
        authPrefix: 'Key',
        requiresUserKey: true
      },
      fal_veo31_image_to_video: {
        endpoint: 'https://fal.run/fal-ai/veo3.1/image-to-video',
        key: FAL_KEY, // Nunca será usado
        authPrefix: 'Key',
        requiresUserKey: true
      }
    };

    const selectedAPI = apiConfigs[api_provider];
    
    if (!selectedAPI) {
      return new Response(
        JSON.stringify({ error: `API ${api_provider} não é suportada` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🚨 PROTEÇÃO CRÍTICA: Veo 3.1 só pode ser usado com API key do usuário
    if (selectedAPI.requiresUserKey && !isUsingUserKey) {
      console.error('❌ BLOCKED: Attempt to use Veo 3.1 without user API key');
      return new Response(
        JSON.stringify({ 
          error: 'Este modelo requer que você conecte sua própria API key do Fal.ai nas Configurações → Integrações. Isso garante uso ilimitado sem consumir créditos da plataforma.',
          requires_byok: true
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!selectedAPI.key && !isUsingUserKey) {
      return new Response(
        JSON.stringify({ error: `Chave da API ${api_provider} não está configurada` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use user's key or platform key
    const apiKeyToUse = FAL_API_KEY;

    // Preparar body específico para cada API e modo
    let requestBody: any;
    
    // === VEO 3.1 TEXT-TO-VIDEO ===
    if (api_provider === 'fal_veo31') {
      // 🚨 VALIDAÇÃO: Veo 3.1 só suporta durações de 4s, 6s ou 8s
      let veoDuration = parseInt(duration.replace('s', ''));
      if (veoDuration > 8) {
        console.log('⚠️ Veo 3.1: Auto-fixing duration from', duration, 'to 8s');
        veoDuration = 8;
      }
      
      requestBody = {
        prompt,
        aspect_ratio,
        duration: veoDuration, // Veo espera número
        negative_prompt: negative_prompt || 'blur, distortion, low quality'
      };
    }
    
    // === VEO 3.1 IMAGE-TO-VIDEO ===
    else if (api_provider === 'fal_veo31_image_to_video') {
      if (!input_images || input_images.length < 1) {
        return new Response(
          JSON.stringify({ error: 'Veo 3.1 Image-to-Video requer 1 imagem' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // 🚨 VALIDAÇÃO: Veo 3.1 só suporta durações de 4s, 6s ou 8s
      let veoDuration = parseInt(duration.replace('s', ''));
      if (veoDuration > 8) {
        console.log('⚠️ Veo 3.1 I2V: Auto-fixing duration from', duration, 'to 8s');
        veoDuration = 8;
      }
      
      requestBody = {
        prompt: prompt || 'Animate this image',
        image_url: input_images[0],
        duration: veoDuration,
        negative_prompt: negative_prompt || 'blur, distortion, low quality'
      };
    }
    
    // Handle image-to-video mode
    else if (mode === 'image-to-video') {
      if (api_provider === 'fal_kling_v26_image_to_video') {
        // Kling v2.6 Image-to-Video requires 1 image
        if (!input_images || input_images.length < 1) {
          return new Response(
            JSON.stringify({ error: 'Este modelo requer 1 imagem' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const durationSeconds = parseInt(duration.replace('s', ''));
        const klingDuration = durationSeconds <= 5 ? "5" : "10";
        
        requestBody = {
          prompt: prompt || 'Generate a video from this image',
          image_url: input_images[0],
          duration: klingDuration,
          negative_prompt: negative_prompt || 'blur, distort, and low quality',
          cfg_scale: 0.5
        };
      } else {
        return new Response(
          JSON.stringify({ error: 'API de image-to-video não reconhecida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (api_provider === 'fal_kling_v26_pro') {
      // Kling v2.6 Pro Text-to-Video usa parâmetros específicos
      const durationSeconds = parseInt(duration.replace('s', ''));
      const klingDuration = durationSeconds <= 5 ? "5" : "10";
      
      requestBody = {
        prompt,
        duration: klingDuration,
        aspect_ratio,
        negative_prompt: negative_prompt || 'blur, distort, and low quality',
        cfg_scale: 0.5
      };
    } else {
      // Outras APIs usam parâmetros padrão
      requestBody = {
        prompt,
        aspect_ratio,
        duration,
        resolution,
        generate_audio,
        negative_prompt,
        enhance_prompt,
        seed,
        auto_fix
      };
    }

    // Call selected API
    const response = await fetch(selectedAPI.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `${selectedAPI.authPrefix} ${apiKeyToUse}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fal.ai API error:', response.status, errorText);
      
      // Devolver crédito em caso de falha (SOMENTE se usou créditos da plataforma)
      if (!isUsingUserKey && creditType) {
        console.log('Rolling back credit due to API error');
        await supabaseClient.rpc('rollback_video_credit', {
          p_user_id: user.id,
          p_credit_type: creditType
        });
      }

      // Log da falha
      await supabaseClient.from('video_generation_log').insert({
        user_id: user.id,
        api_provider,
        mode,
        prompt: prompt || null,
        credits_before: creditsBeforeAttempt - creditsUsedBefore,
        credits_after: creditsBeforeAttempt - creditsUsedBefore, // crédito devolvido
        kling_lifetime_before: klingLifetimeBefore,
        kling_lifetime_after: klingLifetimeBefore,
        success: false,
        error_message: `API Error ${response.status}: ${errorText}`,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
      });
      
      // Handle rate limit
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Handle insufficient credits / exhausted balance
      if (response.status === 402 || (response.status === 403 && errorText.includes('exhausted'))) {
        const isByok = isUsingUserKey;
        console.log('💳 Balance exhausted detected - isByok:', isByok);
        return new Response(
          JSON.stringify({ 
            error: isByok 
              ? '💳 Saldo esgotado na sua conta Fal.ai. Sua chave está funcionando corretamente! Acesse fal.ai/dashboard/billing para adicionar mais créditos e continuar gerando.'
              : 'Créditos da plataforma esgotados temporariamente. Tente novamente mais tarde ou conecte sua própria chave Fal.ai em Configurações → Integrações.',
            errorType: 'balance_exhausted',
            isUserKey: isByok
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Handle content policy violations
      if (response.status === 422) {
        console.log('Checking for content policy violation...');
        try {
          const errorData = JSON.parse(errorText);
          console.log('Parsed error data:', errorData);
          
          const isContentViolation = errorData.detail?.some((d: any) => {
            console.log('Checking detail:', d);
            return d.type === 'content_policy_violation';
          });
          
          console.log('Is content violation:', isContentViolation);
          
          if (isContentViolation) {
            console.log('Returning content policy violation error with status 200');
            return new Response(
              JSON.stringify({ 
                error: 'O conteúdo do prompt foi bloqueado pelos filtros de segurança da API. Tente usar descrições mais genéricas, evitando: marcas comerciais (Rolex, Mercedes, etc), produtos específicos, ou conteúdo sensível. Exemplo: ao invés de "Rolex", use "relógio de pulso".'
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (parseError) {
          console.error('Error parsing Fal.ai error response:', parseError);
        }
      }
      
      // Generic error for other cases
      console.error('Returning generic error');
      return new Response(
        JSON.stringify({ error: `Erro ao gerar vídeo: ${response.status}. Por favor, tente novamente.` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Video generated successfully:', data.video?.url);

    // Buscar limites atualizados após o decremento
    const { data: updatedLimits } = await supabaseClient
      .from('usage_limits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const creditsAfter = (updatedLimits?.video_credits || 0) - (updatedLimits?.video_credits_used || 0);
    const klingLifetimeAfter = updatedLimits?.kling_image_videos_lifetime_used || 0;

    // Track API cost (only if using platform key)
    if (!isUsingUserKey) {
      const costUsd = api_provider.includes('kling') ? 0.60 : 0.02;
      await supabaseClient.from('api_cost_tracking').insert({
        user_id: user.id,
        feature_type: 'video',
        api_provider: api_provider,
        cost_usd: costUsd,
        metadata: { mode, prompt: prompt?.substring(0, 100), duration, resolution }
      });
    }

    // Update usage count for user's own key
    if (isUsingUserKey) {
      await supabaseClient
        .from('user_api_keys')
        .update({
          credits_used_count: supabaseClient.rpc('increment', { x: 1 })
        })
        .eq('user_id', user.id)
        .eq('provider', 'fal_ai');
    }

    // Log de sucesso
    await supabaseClient.from('video_generation_log').insert({
      user_id: user.id,
      api_provider,
      mode,
      prompt: prompt || null,
      credits_before: creditsBeforeAttempt - creditsUsedBefore,
      credits_after: creditsAfter,
      kling_lifetime_before: klingLifetimeBefore,
      kling_lifetime_after: klingLifetimeAfter,
      success: true,
      video_url: data.video?.url,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      user_agent: req.headers.get('user-agent')
    });

    // Generate thumbnail URL from video (frame at 0.5s)
    const videoUrl = data.video?.url;
    const thumbnailUrl = videoUrl ? videoUrl + '#t=0.5' : null;

    return new Response(
      JSON.stringify({ 
        video: {
          ...data.video,
          thumbnail_url: thumbnailUrl
        },
        message: 'Vídeo gerado com sucesso!',
        using_user_key: isUsingUserKey
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-video function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro ao gerar vídeo' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
