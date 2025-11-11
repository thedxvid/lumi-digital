import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomAgent {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  system_prompt: string;
  suggested_topics: string[];
  capabilities: ('text' | 'image')[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useCustomAgents() {
  const [agents, setAgents] = useState<CustomAgent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_agents' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents((data as any) || []);
    } catch (error) {
      console.error('Erro ao buscar agentes:', error);
      toast.error('Erro ao carregar agentes customizados');
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async (agent: Omit<CustomAgent, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('custom_agents' as any)
        .insert([agent as any])
        .select()
        .single();

      if (error) throw error;
      toast.success('Agente criado com sucesso!');
      await fetchAgents();
      return data;
    } catch (error) {
      console.error('Erro ao criar agente:', error);
      toast.error('Erro ao criar agente');
      throw error;
    }
  };

  const updateAgent = async (id: string, updates: Partial<CustomAgent>) => {
    try {
      const { error } = await supabase
        .from('custom_agents' as any)
        .update(updates as any)
        .eq('id', id);

      if (error) throw error;
      toast.success('Agente atualizado com sucesso!');
      await fetchAgents();
    } catch (error) {
      console.error('Erro ao atualizar agente:', error);
      toast.error('Erro ao atualizar agente');
      throw error;
    }
  };

  const deleteAgent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_agents' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Agente excluído com sucesso!');
      await fetchAgents();
    } catch (error) {
      console.error('Erro ao excluir agente:', error);
      toast.error('Erro ao excluir agente');
      throw error;
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await updateAgent(id, { is_active: isActive });
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return {
    agents,
    loading,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleActive,
    refetch: fetchAgents,
  };
}
