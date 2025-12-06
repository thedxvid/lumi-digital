-- Tabela para rastrear custos individuais de usuários BYOK
CREATE TABLE public.user_byok_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  feature_type TEXT NOT NULL, -- 'creative_image', 'carousel', 'video'
  api_model TEXT NOT NULL, -- 'nano-banana-pro', 'kling-2.5', 'veo3', etc.
  estimated_cost_usd NUMERIC(10,4) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX idx_user_byok_costs_user_id ON public.user_byok_costs(user_id);
CREATE INDEX idx_user_byok_costs_created_at ON public.user_byok_costs(created_at DESC);
CREATE INDEX idx_user_byok_costs_user_date ON public.user_byok_costs(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.user_byok_costs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own BYOK costs"
ON public.user_byok_costs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own BYOK costs"
ON public.user_byok_costs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all BYOK costs"
ON public.user_byok_costs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Permitir inserção via service role (edge functions)
CREATE POLICY "Service role can insert BYOK costs"
ON public.user_byok_costs
FOR INSERT
WITH CHECK (true);