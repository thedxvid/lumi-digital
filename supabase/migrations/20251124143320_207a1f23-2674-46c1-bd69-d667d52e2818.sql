-- Criar tabela de log para auditoria de geração de vídeos
CREATE TABLE IF NOT EXISTS public.video_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  attempt_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  api_provider TEXT NOT NULL,
  mode TEXT NOT NULL,
  prompt TEXT,
  credits_before INTEGER NOT NULL,
  credits_after INTEGER,
  kling_lifetime_before INTEGER,
  kling_lifetime_after INTEGER,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  error_message TEXT,
  video_url TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_video_generation_log_user_id ON public.video_generation_log(user_id);
CREATE INDEX idx_video_generation_log_timestamp ON public.video_generation_log(attempt_timestamp);
CREATE INDEX idx_video_generation_log_success ON public.video_generation_log(success);

-- RLS para video_generation_log
ALTER TABLE public.video_generation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all video generation logs"
  ON public.video_generation_log
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own video generation logs"
  ON public.video_generation_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RPC Function para reservar crédito de vídeo atomicamente
CREATE OR REPLACE FUNCTION public.reserve_video_credit(
  p_user_id UUID,
  p_api_provider TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
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

-- RPC Function para devolver crédito em caso de falha
CREATE OR REPLACE FUNCTION public.rollback_video_credit(
  p_user_id UUID,
  p_credit_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Corrigir créditos do usuário Mário (0644ecbb-c199-4f13-975c-f59357870368)
-- Zerar os créditos usados para compensar o uso indevido
UPDATE public.usage_limits
SET 
  kling_image_videos_lifetime_used = GREATEST(0, COALESCE(kling_image_videos_lifetime_used, 1) - 26),
  video_credits_used = GREATEST(0, COALESCE(video_credits_used, 0) - 26)
WHERE user_id = '0644ecbb-c199-4f13-975c-f59357870368';