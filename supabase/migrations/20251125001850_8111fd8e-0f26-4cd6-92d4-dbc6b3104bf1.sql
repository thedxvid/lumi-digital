-- Step 1: Create user_api_keys table for BYOK
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  api_key_encrypted text NOT NULL,
  is_active boolean DEFAULT true,
  is_valid boolean DEFAULT null,
  last_validated_at timestamptz,
  credits_used_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only manage their own API keys
CREATE POLICY "Users can manage their own API keys"
  ON public.user_api_keys
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 2: Create encryption/decryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to encrypt API keys (used by backend)
CREATE OR REPLACE FUNCTION public.encrypt_api_key(key_text text, encryption_key text)
RETURNS text AS $$
BEGIN
  RETURN encode(
    encrypt(
      key_text::bytea,
      encryption_key::bytea,
      'aes'
    ),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to decrypt API keys (used by backend only)
CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_text text, encryption_key text)
RETURNS text AS $$
BEGIN
  RETURN convert_from(
    decrypt(
      decode(encrypted_text, 'base64'),
      encryption_key::bytea,
      'aes'
    ),
    'utf8'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 3: Update existing usage_limits to have 2 Kling videos instead of 1
UPDATE public.usage_limits 
SET kling_image_videos_lifetime_limit = 2
WHERE plan_type = 'basic' 
  AND kling_image_videos_lifetime_limit = 1;

-- Step 4: Add trigger for updated_at on user_api_keys
CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON public.user_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();