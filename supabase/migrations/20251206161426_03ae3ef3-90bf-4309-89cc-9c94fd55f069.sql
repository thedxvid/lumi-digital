-- Atualizar manualmente o tier do usuário davicastropr@gmail.com para 'pro'
UPDATE usage_limits 
SET api_tier = 'pro', updated_at = now()
WHERE user_id = '1a66130b-7061-4dd6-a3d5-6644cb85ee87';