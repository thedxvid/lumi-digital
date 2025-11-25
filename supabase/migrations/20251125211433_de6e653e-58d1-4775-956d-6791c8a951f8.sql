-- Adicionar constraint única para evitar duplicatas e permitir upsert
ALTER TABLE user_api_keys 
ADD CONSTRAINT user_api_keys_user_provider_unique 
UNIQUE (user_id, provider);