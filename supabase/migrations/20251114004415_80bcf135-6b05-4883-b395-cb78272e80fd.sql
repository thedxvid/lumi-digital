-- Criar tabela para rastrear uso dos agentes
CREATE TABLE IF NOT EXISTS public.agent_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Índices para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_agent_usage_agent_id ON public.agent_usage(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_usage_created_at ON public.agent_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_usage_user_id ON public.agent_usage(user_id);

-- RLS Policies
ALTER TABLE public.agent_usage ENABLE ROW LEVEL SECURITY;

-- Usuários podem inserir seus próprios registros
CREATE POLICY "Users can insert their own usage"
  ON public.agent_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins podem ver todos os registros
CREATE POLICY "Admins can view all usage"
  ON public.agent_usage
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));