-- Criar tabela de logs de ações do admin
CREATE TABLE IF NOT EXISTS public.admin_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user_id ON public.admin_actions_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions_log(created_at DESC);

-- RLS para admin_actions_log
ALTER TABLE public.admin_actions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all action logs"
ON public.admin_actions_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert action logs"
ON public.admin_actions_log
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Função para registrar ações do admin
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _target_user_id UUID,
  _action TEXT,
  _details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
BEGIN
  INSERT INTO public.admin_actions_log (
    admin_id,
    target_user_id,
    action,
    details
  ) VALUES (
    auth.uid(),
    _target_user_id,
    _action,
    _details
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- Função para obter detalhes do usuário (com email)
-- Usaremos function ao invés de view para ter melhor controle
CREATE OR REPLACE FUNCTION public.get_admin_user_details()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  access_granted BOOLEAN,
  subscription_status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  auth_created_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  email_confirmed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    au.email,
    p.access_granted,
    p.subscription_status,
    p.created_at,
    p.updated_at,
    au.last_sign_in_at,
    au.created_at as auth_created_at,
    au.confirmed_at,
    au.email_confirmed_at
  FROM public.profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;