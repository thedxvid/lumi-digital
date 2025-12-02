-- Atualizar função get_admin_user_details para suportar até 10.000 usuários
CREATE OR REPLACE FUNCTION public.get_admin_user_details()
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  access_granted boolean,
  subscription_status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  auth_created_at timestamp with time zone,
  confirmed_at timestamp with time zone,
  email_confirmed_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar se é admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name::text,
    au.email::text,
    p.access_granted,
    p.subscription_status::text,
    p.created_at,
    p.updated_at,
    au.last_sign_in_at,
    au.created_at as auth_created_at,
    au.confirmed_at,
    au.email_confirmed_at
  FROM public.profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  ORDER BY p.created_at DESC
  LIMIT 10000;
END;
$function$;