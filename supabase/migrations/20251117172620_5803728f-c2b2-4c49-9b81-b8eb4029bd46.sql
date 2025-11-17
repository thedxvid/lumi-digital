-- Criar bucket para imagens de produtos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Adicionar coluna image_url na tabela custom_agents
ALTER TABLE custom_agents 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Criar políticas de acesso para o bucket
CREATE POLICY "Usuários podem visualizar imagens de produtos"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Usuários podem fazer upload de suas imagens"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem atualizar suas próprias imagens"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem deletar suas próprias imagens"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);