-- Atualizar valores de pedidos existentes usando dados do webhook_data
-- Extrair charge_amount de Commissions e converter de centavos para reais

UPDATE orders
SET 
  order_value = (webhook_data->'Commissions'->>'charge_amount')::numeric / 100,
  order_value_formatted = 'R$ ' || 
    CASE 
      WHEN (webhook_data->'Commissions'->>'charge_amount')::numeric >= 100 THEN
        to_char((webhook_data->'Commissions'->>'charge_amount')::numeric / 100, 'FM999G999D00')
      ELSE
        to_char((webhook_data->'Commissions'->>'charge_amount')::numeric / 100, 'FM0D00')
    END
WHERE 
  webhook_data->'Commissions'->>'charge_amount' IS NOT NULL
  AND (webhook_data->'Commissions'->>'charge_amount')::numeric > 0
  AND (order_value IS NULL OR order_value = 0);