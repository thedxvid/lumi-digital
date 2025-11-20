-- Permitir que order_value e product_name sejam NULL para lidar com payloads incompletos da Kiwify
ALTER TABLE public.orders 
  ALTER COLUMN order_value DROP NOT NULL,
  ALTER COLUMN product_name DROP NOT NULL;

-- Adicionar valores default para evitar NULL no futuro
ALTER TABLE public.orders 
  ALTER COLUMN order_value SET DEFAULT 0,
  ALTER COLUMN product_name SET DEFAULT 'Produto não informado';

-- Comentário: Isso permite que o webhook processe pedidos mesmo quando a Kiwify
-- não envia todos os campos, evitando perda de dados importantes