-- Adicionar campos para PDF e papel do usuário na tabela custom_agents
ALTER TABLE public.custom_agents
ADD COLUMN IF NOT EXISTS pdf_content TEXT,
ADD COLUMN IF NOT EXISTS pdf_filename TEXT,
ADD COLUMN IF NOT EXISTS user_role TEXT;