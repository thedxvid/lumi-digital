-- Remover política antiga que só permite ver próprias chaves
DROP POLICY IF EXISTS "Users can manage their own API keys" ON user_api_keys;

-- Policy para admins verem todas as chaves BYOK
CREATE POLICY "Admins can view all API keys" 
ON user_api_keys FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')
);

-- Recriar policy para gerenciamento (INSERT/UPDATE/DELETE) apenas próprias chaves
CREATE POLICY "Users can manage their own API keys" 
ON user_api_keys FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);