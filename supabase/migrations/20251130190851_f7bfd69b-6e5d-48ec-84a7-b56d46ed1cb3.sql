-- 1. Corrigir trigger handle_new_user para access_granted = true por padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, access_granted, subscription_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    true,  -- Novos usuários têm acesso por padrão
    'inactive'
  );
  RETURN NEW;
END;
$$;

-- 2. Corrigir política RLS da tabela conversations
DROP POLICY IF EXISTS "Users can manage their own conversations" ON conversations;

CREATE POLICY "Users can manage their own conversations" 
ON conversations 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);