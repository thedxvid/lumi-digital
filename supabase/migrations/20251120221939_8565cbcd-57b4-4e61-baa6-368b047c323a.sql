-- Remover política antiga muito permissiva
DROP POLICY IF EXISTS "Users can view active custom agents" ON custom_agents;

-- Criar nova política restritiva que permite ver apenas:
-- 1. Produtos do sistema (created_by IS NULL)
-- 2. Seus próprios agentes/produtos (created_by = auth.uid())
CREATE POLICY "Users can view system and own agents"
ON custom_agents FOR SELECT
USING (
  created_by IS NULL OR 
  created_by = auth.uid()
);