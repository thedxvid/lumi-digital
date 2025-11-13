-- Adicionar coluna para diferenciar agentes de produtos/contextos
ALTER TABLE custom_agents 
ADD COLUMN IF NOT EXISTS entity_type TEXT DEFAULT 'agent' CHECK (entity_type IN ('agent', 'product'));

-- Atualizar registros existentes criados por usuários como produtos
-- (assumindo que produtos foram criados recentemente e têm system_prompt específico)
UPDATE custom_agents 
SET entity_type = 'product' 
WHERE created_by IS NOT NULL 
AND system_prompt LIKE '%CONTEXTO DO PRODUTO DO USUÁRIO%';

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_custom_agents_entity_type ON custom_agents(entity_type);