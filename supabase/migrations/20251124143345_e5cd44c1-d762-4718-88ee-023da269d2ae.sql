-- Corrigir search_path das funções criadas para resolver warnings de segurança
CREATE OR REPLACE FUNCTION public.reserve_video_credit(
  p_user_id UUID,
  p_api_provider TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limits RECORD;
  v_result JSON;
  v_credits_available INTEGER;
  v_kling_available INTEGER;
BEGIN
  -- Buscar limits com lock para evitar race conditions
  SELECT * INTO v_limits
  FROM public.usage_limits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Limites de uso não encontrados',
      'credits_available', 0
    );
  END IF;
  
  -- Calcular créditos disponíveis
  v_kling_available := COALESCE(v_limits.kling_image_videos_lifetime_limit, 0) - COALESCE(v_limits.kling_image_videos_lifetime_used, 0);
  v_credits_available := COALESCE(v_limits.video_credits, 0) - COALESCE(v_limits.video_credits_used, 0);
  
  -- Verificar se tem créditos disponíveis
  IF p_api_provider LIKE '%kling%' THEN
    -- Tentar usar crédito Kling lifetime primeiro
    IF v_kling_available > 0 THEN
      UPDATE public.usage_limits
      SET kling_image_videos_lifetime_used = COALESCE(kling_image_videos_lifetime_used, 0) + 1
      WHERE user_id = p_user_id;
      
      RETURN json_build_object(
        'success', true,
        'credit_type', 'kling_lifetime',
        'credits_remaining', v_kling_available - 1,
        'extra_credits_remaining', v_credits_available
      );
    -- Se não tem Kling, usar créditos extras
    ELSIF v_credits_available > 0 THEN
      UPDATE public.usage_limits
      SET video_credits_used = COALESCE(video_credits_used, 0) + 1
      WHERE user_id = p_user_id;
      
      RETURN json_build_object(
        'success', true,
        'credit_type', 'extra_credits',
        'credits_remaining', 0,
        'extra_credits_remaining', v_credits_available - 1
      );
    ELSE
      -- Sem créditos disponíveis
      RETURN json_build_object(
        'success', false,
        'error', 'Créditos insuficientes',
        'credits_remaining', 0,
        'extra_credits_remaining', 0
      );
    END IF;
  END IF;
  
  -- Para outras APIs, usar créditos extras
  IF v_credits_available > 0 THEN
    UPDATE public.usage_limits
    SET video_credits_used = COALESCE(video_credits_used, 0) + 1
    WHERE user_id = p_user_id;
    
    RETURN json_build_object(
      'success', true,
      'credit_type', 'extra_credits',
      'credits_remaining', v_kling_available,
      'extra_credits_remaining', v_credits_available - 1
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Créditos insuficientes',
      'credits_remaining', v_kling_available,
      'extra_credits_remaining', 0
    );
  END IF;
END;
$$;

-- Corrigir search_path da função de rollback
CREATE OR REPLACE FUNCTION public.rollback_video_credit(
  p_user_id UUID,
  p_credit_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_credit_type = 'kling_lifetime' THEN
    UPDATE public.usage_limits
    SET kling_image_videos_lifetime_used = GREATEST(0, COALESCE(kling_image_videos_lifetime_used, 0) - 1)
    WHERE user_id = p_user_id;
  ELSIF p_credit_type = 'extra_credits' THEN
    UPDATE public.usage_limits
    SET video_credits_used = GREATEST(0, COALESCE(video_credits_used, 0) - 1)
    WHERE user_id = p_user_id;
  ELSE
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;