-- Remover constraint antiga que só permite [1, 3, 6]
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_duration_months_check;

-- Adicionar nova constraint incluindo 12 meses para planos anuais
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_duration_months_check 
CHECK (duration_months = ANY (ARRAY[1, 3, 6, 12]));