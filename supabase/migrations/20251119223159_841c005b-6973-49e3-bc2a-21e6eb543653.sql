-- Adicionar colunas necessárias para o webhook do Kiwify na tabela orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS kiwify_order_ref TEXT,
ADD COLUMN IF NOT EXISTS product_id TEXT,
ADD COLUMN IF NOT EXISTS product_type TEXT,
ADD COLUMN IF NOT EXISTS order_status TEXT,
ADD COLUMN IF NOT EXISTS installments_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS installment_value NUMERIC,
ADD COLUMN IF NOT EXISTS order_value_formatted TEXT,
ADD COLUMN IF NOT EXISTS customer_mobile TEXT,
ADD COLUMN IF NOT EXISTS webhook_data JSONB,
ADD COLUMN IF NOT EXISTS access_granted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS credentials_sent BOOLEAN DEFAULT false;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_orders_kiwify_order_ref ON public.orders(kiwify_order_ref);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON public.orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_access_granted ON public.orders(access_granted);

-- Comentários para documentação
COMMENT ON COLUMN public.orders.kiwify_order_ref IS 'Referência única do pedido no Kiwify';
COMMENT ON COLUMN public.orders.product_id IS 'ID do produto no Kiwify';
COMMENT ON COLUMN public.orders.webhook_data IS 'Dados completos do webhook para auditoria';
COMMENT ON COLUMN public.orders.access_granted IS 'Se o acesso à plataforma foi concedido';
COMMENT ON COLUMN public.orders.credentials_sent IS 'Se as credenciais foram enviadas por email';