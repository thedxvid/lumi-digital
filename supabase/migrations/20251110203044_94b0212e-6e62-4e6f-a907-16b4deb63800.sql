-- =====================================================
-- FASE 1: SISTEMA DE ROLES E PERMISSÕES
-- =====================================================

-- Verificar se o enum já existe, se não, criar
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END $$;

-- Verificar se a tabela user_roles já existe, se não, criar
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Criar ou substituir a função has_role com SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- =====================================================
-- POLICIES PARA user_roles
-- =====================================================

-- Dropar policies existentes se houver
DROP POLICY IF EXISTS "Only admins can view user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Admins podem ver todas as roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins podem inserir roles
CREATE POLICY "Admins can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins podem deletar roles
CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Usuários podem ver suas próprias roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- POLICIES ADMINISTRATIVAS EM TABELAS EXISTENTES
-- =====================================================

-- Profiles: Admins podem ver e editar todos os perfis
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Generated Assets: Admins podem ver todos os assets
DROP POLICY IF EXISTS "Admins can view all assets" ON public.generated_assets;

CREATE POLICY "Admins can view all assets"
ON public.generated_assets
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Conversations: Admins podem ver todas as conversas
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;

CREATE POLICY "Admins can view all conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Messages: Admins podem ver todas as mensagens
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;

CREATE POLICY "Admins can view all messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = auth.uid()
  )
);

-- User Goals: Admins podem ver todas as metas
DROP POLICY IF EXISTS "Admins can view all goals" ON public.user_goals;

CREATE POLICY "Admins can view all goals"
ON public.user_goals
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Creative History: Admins podem ver todo o histórico
DROP POLICY IF EXISTS "Admins can view all creative history" ON public.creative_history;

CREATE POLICY "Admins can view all creative history"
ON public.creative_history
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Notification Preferences: Admins podem ver todas as preferências
DROP POLICY IF EXISTS "Admins can view all notification preferences" ON public.notification_preferences;

CREATE POLICY "Admins can view all notification preferences"
ON public.notification_preferences
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- FUNÇÃO AUXILIAR: Verificar se usuário é admin
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.user_roles IS 'Tabela de roles de usuários com suporte a múltiplas roles por usuário';
COMMENT ON FUNCTION public.has_role(uuid, app_role) IS 'Verifica se um usuário tem uma role específica (SECURITY DEFINER para evitar recursão em RLS)';
COMMENT ON FUNCTION public.is_admin() IS 'Atalho para verificar se o usuário atual é admin';