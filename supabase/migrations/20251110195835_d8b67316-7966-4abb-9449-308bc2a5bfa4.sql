-- Forçar regeneração dos tipos TypeScript
-- Esta migração adiciona comentários às tabelas para forçar a atualização dos tipos

COMMENT ON TABLE public.generated_assets IS 'Armazena assets gerados pela IA (textos, imagens, etc)';
COMMENT ON TABLE public.conversations IS 'Conversas dos usuários com a LUMI';
COMMENT ON TABLE public.messages IS 'Mensagens individuais dentro das conversas';
COMMENT ON TABLE public.creative_history IS 'Histórico de criativos gerados pela Creative Engine';
COMMENT ON TABLE public.user_activity_log IS 'Log de atividades dos usuários';
COMMENT ON TABLE public.user_goals IS 'Metas e objetivos dos usuários';
COMMENT ON TABLE public.notification_preferences IS 'Preferências de notificação dos usuários';
COMMENT ON TABLE public.user_roles IS 'Roles (permissões) dos usuários';
COMMENT ON TABLE public.profiles IS 'Perfis estendidos dos usuários';