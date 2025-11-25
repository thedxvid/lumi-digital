import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserApiKey {
  id: string;
  user_id: string;
  provider: string;
  api_key_encrypted: string;
  is_active: boolean;
  is_valid: boolean | null;
  last_validated_at: string | null;
  credits_used_count: number;
  created_at: string;
  updated_at: string;
}

export const useApiKeyIntegrations = () => {
  const [keys, setKeys] = useState<UserApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

  const loadKeys = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKeys(data || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast.error('Erro ao carregar integrações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const saveKey = async (provider: string, apiKey: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Você precisa estar autenticado');
        return false;
      }

      // Use a simple encryption key (in production, this should be from env)
      const encryptionKey = 'lumi-api-key-secret-2024';

      // Call encryption function
      const { data: encryptedKey, error: encryptError } = await supabase.rpc('encrypt_api_key', {
        key_text: apiKey,
        encryption_key: encryptionKey
      });

      if (encryptError) throw encryptError;

      // Save to database
      const { error } = await supabase
        .from('user_api_keys')
        .upsert({
          user_id: user.id,
          provider,
          api_key_encrypted: encryptedKey,
          is_active: true,
          is_valid: null, // Will be validated next
        }, {
          onConflict: 'user_id,provider'
        });

      if (error) throw error;

      await loadKeys();
      toast.success('API Key salva com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Error saving API key:', error);
      toast.error(error.message || 'Erro ao salvar API key');
      return false;
    }
  };

  const validateKey = async (provider: string) => {
    setValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-user-api-key', {
        body: { provider }
      });

      if (error) throw error;

      if (data.valid) {
        toast.success('✅ API Key validada com sucesso!');
        await loadKeys();
        return true;
      } else {
        toast.error(`❌ API Key inválida: ${data.error || 'Erro desconhecido'}`);
        return false;
      }
    } catch (error: any) {
      console.error('Error validating API key:', error);
      toast.error(error.message || 'Erro ao validar API key');
      return false;
    } finally {
      setValidating(false);
    }
  };

  const deleteKey = async (provider: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', provider);

      if (error) throw error;

      await loadKeys();
      toast.success('API Key removida com sucesso');
      return true;
    } catch (error: any) {
      console.error('Error deleting API key:', error);
      toast.error(error.message || 'Erro ao remover API key');
      return false;
    }
  };

  const maskApiKey = (key: string): string => {
    if (!key || key.length < 8) return '****...****';
    return `${key.substring(0, 4)}****...****${key.substring(key.length - 4)}`;
  };

  return {
    keys,
    loading,
    validating,
    saveKey,
    validateKey,
    deleteKey,
    maskApiKey,
    refreshKeys: loadKeys,
  };
};