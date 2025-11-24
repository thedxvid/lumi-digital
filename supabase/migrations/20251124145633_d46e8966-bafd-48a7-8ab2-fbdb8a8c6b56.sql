-- Corrigir avisos de segurança da migração anterior

-- Remover view materializada da API pública
DROP MATERIALIZED VIEW IF EXISTS public.daily_api_costs CASCADE;

-- Recriar função get_cost_stats com search_path correto (já tinha)
-- Recriar função refresh_daily_costs removida (não é mais necessária sem a view)

-- As funções já tinham SET search_path = public, os avisos são de outras funções antigas
-- Vamos corrigir todas as funções antigas que não têm search_path

-- Corrigir função initialize_usage_limits
CREATE OR REPLACE FUNCTION public.initialize_usage_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.usage_limits (
    user_id,
    plan_type,
    creative_images_daily_limit,
    profile_analysis_daily_limit,
    creative_images_monthly_limit,
    carousels_monthly_limit,
    videos_monthly_limit
  ) VALUES (
    NEW.id,
    'free',
    0,
    0,
    0,
    0,
    0
  );
  RETURN NEW;
END;
$function$;

-- Corrigir função calculate_subscription_end_date
CREATE OR REPLACE FUNCTION public.calculate_subscription_end_date(start_date timestamp with time zone, duration_months integer)
RETURNS timestamp with time zone
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
BEGIN
  RETURN start_date + (duration_months || ' months')::INTERVAL;
END;
$function$;

-- Corrigir função reset_daily_limits
CREATE OR REPLACE FUNCTION public.reset_daily_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.usage_limits
  SET 
    creative_images_daily_used = 0,
    profile_analysis_daily_used = 0,
    last_daily_reset = NOW()
  WHERE last_daily_reset < NOW() - INTERVAL '1 day';
END;
$function$;

-- Corrigir função reset_monthly_limits
CREATE OR REPLACE FUNCTION public.reset_monthly_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.usage_limits
  SET 
    creative_images_monthly_used = 0,
    carousels_monthly_used = 0,
    videos_monthly_used = 0,
    video_credits = 0,
    video_credits_used = 0,
    last_monthly_reset = NOW()
  WHERE last_monthly_reset < NOW() - INTERVAL '1 month';
END;
$function$;