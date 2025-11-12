-- Adicionar políticas RLS para permitir usuários gerenciarem seus próprios contextos

-- Permitir usuários criar seus próprios contextos
CREATE POLICY "Users can create their own contexts"
ON custom_agents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Permitir usuários editar seus próprios contextos
CREATE POLICY "Users can update their own contexts"
ON custom_agents FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

-- Permitir usuários deletar seus próprios contextos
CREATE POLICY "Users can delete their own contexts"
ON custom_agents FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Permitir usuários ver seus próprios contextos (além dos ativos de admin)
CREATE POLICY "Users can view their own contexts"
ON custom_agents FOR SELECT
TO authenticated
USING (auth.uid() = created_by OR is_active = true);