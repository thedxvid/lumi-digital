-- Criar função para obter modelo de vídeo baseado no plano
CREATE OR REPLACE FUNCTION public.get_video_model_for_plan(p_plan_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  CASE p_plan_type
    WHEN 'pro' THEN
      RETURN 'fal_kling_v25_turbo';
    WHEN 'pro_advanced' THEN
      RETURN 'fal_veo31';
    ELSE
      RETURN NULL;
  END CASE;
END;
$$;

COMMENT ON FUNCTION public.get_video_model_for_plan IS 'Retorna o modelo de IA de vídeo apropriado para cada plano: PRO usa Kling v2.5 Turbo, PRO Advanced usa Veo 3.1';

-- Atualizar comentário da coluna de limites de vídeo
COMMENT ON COLUMN usage_limits.videos_monthly_limit IS 'Limite mensal de vídeos: PRO = 20 vídeos (Kling v2.5), PRO Advanced = 10 vídeos (Veo 3.1)';
