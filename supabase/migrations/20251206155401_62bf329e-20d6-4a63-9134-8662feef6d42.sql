-- Atualizar função encrypt_api_key para usar extensions.encrypt
CREATE OR REPLACE FUNCTION public.encrypt_api_key(key_text text, encryption_key text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN encode(
    extensions.encrypt(
      key_text::bytea,
      encryption_key::bytea,
      'aes'
    ),
    'base64'
  );
END;
$function$;

-- Atualizar função decrypt_api_key para usar extensions.decrypt
CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_text text, encryption_key text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN convert_from(
    extensions.decrypt(
      decode(encrypted_text, 'base64'),
      encryption_key::bytea,
      'aes'
    ),
    'utf8'
  );
END;
$function$;