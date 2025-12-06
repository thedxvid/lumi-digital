-- Remover constraint antiga que não inclui 'lumi'
ALTER TABLE usage_limits DROP CONSTRAINT IF EXISTS usage_limits_plan_type_check;

-- Criar constraint nova com 'lumi' incluído
ALTER TABLE usage_limits ADD CONSTRAINT usage_limits_plan_type_check 
  CHECK (plan_type = ANY (ARRAY['basic'::text, 'pro'::text, 'free'::text, 'lumi'::text]));