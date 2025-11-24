-- Tabela de rastreamento de custos de API
CREATE TABLE IF NOT EXISTS public.api_cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('creative_image', 'video', 'carousel', 'profile_analysis', 'chat', 'other')),
  api_provider TEXT NOT NULL,
  cost_usd NUMERIC(10, 4) NOT NULL CHECK (cost_usd >= 0),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_api_costs_date ON public.api_cost_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_costs_feature ON public.api_cost_tracking(feature_type, created_at);
CREATE INDEX IF NOT EXISTS idx_api_costs_user ON public.api_cost_tracking(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_api_costs_provider ON public.api_cost_tracking(api_provider, created_at);

-- Tabela de configurações de custos
CREATE TABLE IF NOT EXISTS public.api_cost_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_enabled BOOLEAN NOT NULL DEFAULT true,
  cost_per_creative_image NUMERIC(10, 6) NOT NULL DEFAULT 0.0015,
  cost_per_kling_video NUMERIC(10, 4) NOT NULL DEFAULT 0.60,
  cost_per_fal_video NUMERIC(10, 4) NOT NULL DEFAULT 0.02,
  cost_per_carousel NUMERIC(10, 4) NOT NULL DEFAULT 0.015,
  cost_per_profile_analysis NUMERIC(10, 4) NOT NULL DEFAULT 0.005,
  cost_per_chat_message NUMERIC(10, 6) NOT NULL DEFAULT 0.0001,
  alert_daily_warning NUMERIC(10, 2) NOT NULL DEFAULT 15.00,
  alert_daily_danger NUMERIC(10, 2) NOT NULL DEFAULT 30.00,
  alert_weekly_warning NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
  alert_weekly_danger NUMERIC(10, 2) NOT NULL DEFAULT 200.00,
  alert_monthly_projected NUMERIC(10, 2) NOT NULL DEFAULT 400.00,
  lovable_ai_balance_usd NUMERIC(10, 2) DEFAULT 0,
  fal_ai_balance_usd NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO public.api_cost_settings (id) 
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.api_cost_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_cost_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies para api_cost_tracking
CREATE POLICY "Admins can view all cost tracking"
ON public.api_cost_tracking
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert cost tracking"
ON public.api_cost_tracking
FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies para api_cost_settings
CREATE POLICY "Admins can view cost settings"
ON public.api_cost_settings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update cost settings"
ON public.api_cost_settings
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Função para obter estatísticas de custo
CREATE OR REPLACE FUNCTION public.get_cost_stats(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS TABLE(
  total_cost NUMERIC,
  operation_count BIGINT,
  feature_type TEXT,
  api_provider TEXT,
  daily_avg NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(cost_usd) as total_cost,
    COUNT(*) as operation_count,
    act.feature_type,
    act.api_provider,
    SUM(cost_usd) / NULLIF(EXTRACT(DAY FROM (end_date - start_date)), 0) as daily_avg
  FROM public.api_cost_tracking act
  WHERE act.created_at >= start_date 
    AND act.created_at <= end_date
  GROUP BY act.feature_type, act.api_provider;
END;
$$;

-- View materializada para custos diários (otimização)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.daily_api_costs AS
SELECT 
  DATE(created_at) as date,
  feature_type,
  api_provider,
  SUM(cost_usd) as total_cost,
  COUNT(*) as operation_count,
  AVG(cost_usd) as avg_cost
FROM public.api_cost_tracking
GROUP BY DATE(created_at), feature_type, api_provider
ORDER BY DATE(created_at) DESC;

CREATE INDEX IF NOT EXISTS idx_daily_api_costs_date ON public.daily_api_costs(date DESC);

-- Função para refresh da view materializada
CREATE OR REPLACE FUNCTION public.refresh_daily_costs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.daily_api_costs;
END;
$$;