-- Corrigir usuários existentes com access_granted mas sem subscription/limites corretos
-- Atualizar usage_limits para usuários com access_granted mas plan_type 'free'
UPDATE usage_limits ul
SET 
  plan_type = 'basic',
  creative_images_daily_limit = 10,
  creative_images_monthly_limit = 300,
  profile_analysis_daily_limit = 5,
  carousels_monthly_limit = 3,
  videos_monthly_limit = 0,
  updated_at = NOW()
FROM profiles p
WHERE ul.user_id = p.id
  AND p.access_granted = true
  AND ul.plan_type = 'free'
  AND ul.creative_images_daily_limit = 0
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions s 
    WHERE s.user_id = ul.user_id AND s.is_active = true
  );

-- Criar subscriptions básicas para usuários com access_granted mas sem subscription ativa
INSERT INTO subscriptions (user_id, plan_type, duration_months, start_date, end_date, is_active, auto_renew)
SELECT 
  p.id as user_id,
  'basic' as plan_type,
  3 as duration_months,
  NOW() as start_date,
  NOW() + INTERVAL '3 months' as end_date,
  true as is_active,
  false as auto_renew
FROM profiles p
WHERE p.access_granted = true
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions s 
    WHERE s.user_id = p.id AND s.is_active = true
  );