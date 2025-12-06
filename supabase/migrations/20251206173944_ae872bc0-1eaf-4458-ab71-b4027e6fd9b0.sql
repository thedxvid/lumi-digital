-- Fix refresh_daily_costs function to include SET search_path = public
CREATE OR REPLACE FUNCTION public.refresh_daily_costs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.daily_api_costs;
END;
$$;