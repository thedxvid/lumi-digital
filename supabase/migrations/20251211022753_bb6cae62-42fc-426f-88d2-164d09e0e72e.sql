-- Criar tabela de histórico de login
CREATE TABLE public.user_login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'login', 'logout', 'token_refresh'
  login_method TEXT, -- 'password', 'magic_link', 'oauth'
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca rápida por usuário
CREATE INDEX idx_login_history_user_id ON public.user_login_history(user_id);
CREATE INDEX idx_login_history_created_at ON public.user_login_history(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.user_login_history ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todos os logs
CREATE POLICY "Admins can view all login history"
  ON public.user_login_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Usuários podem ver próprios logs
CREATE POLICY "Users can view own login history"
  ON public.user_login_history FOR SELECT
  USING (auth.uid() = user_id);

-- Sistema pode inserir logs (qualquer usuário autenticado pode registrar seu próprio login)
CREATE POLICY "Users can insert own login history"
  ON public.user_login_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);