import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserContext {
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
  created_by?: string;
  context_type?: 'product' | 'idea' | 'campaign';
  detailed_context?: string;
}

interface CreateContextInput {
  context_type: 'product' | 'idea' | 'campaign';
  name: string;
  description: string;
  detailed_context: string;
  icon?: string;
}

const CONTEXT_CONFIG = {
  product: {
    icon: '🎯',
    color: '#f59e0b',
    label: 'Produto'
  },
  idea: {
    icon: '💡',
    color: '#8b5cf6',
    label: 'Ideia/Projeto'
  },
  campaign: {
    icon: '📢',
    color: '#ec4899',
    label: 'Campanha'
  }
};

function generateSystemPrompt(input: CreateContextInput): string {
  const typeLabel = CONTEXT_CONFIG[input.context_type].label;
  
  return `Você é a Lumi, especialista em marketing digital.

CONTEXTO DO USUÁRIO:
Tipo: ${typeLabel}
Nome: ${input.name}
Descrição: ${input.description}
Detalhes: ${input.detailed_context}

Ao responder, considere sempre este contexto e adapte suas sugestões para este cenário específico. Seja prático, criativo e focado em resultados que ajudem especificamente este ${typeLabel.toLowerCase()}.`;
}

export function useUserContexts() {
  const [contexts, setContexts] = useState<UserContext[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContexts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setContexts([]);
        return;
      }

      const { data, error } = await supabase
        .from('custom_agents' as any)
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContexts((data as any) || []);
    } catch (error) {
      console.error('Erro ao buscar contextos:', error);
      toast.error('Erro ao carregar seus contextos');
    } finally {
      setLoading(false);
    }
  };

  const createContext = async (input: CreateContextInput) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const config = CONTEXT_CONFIG[input.context_type];
      const contextData = {
        name: input.name,
        description: input.description,
        icon: input.icon || config.icon,
        color: config.color,
        system_prompt: generateSystemPrompt(input),
        suggested_topics: [],
        capabilities: ['text', 'image'],
        is_active: true,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('custom_agents' as any)
        .insert([contextData as any])
        .select()
        .single();

      if (error) throw error;
      toast.success('Contexto criado com sucesso!');
      await fetchContexts();
      return data;
    } catch (error) {
      console.error('Erro ao criar contexto:', error);
      toast.error('Erro ao criar contexto');
      throw error;
    }
  };

  const updateContext = async (id: string, input: Partial<CreateContextInput>) => {
    try {
      const updates: any = {};
      
      if (input.name) updates.name = input.name;
      if (input.description) updates.description = input.description;
      if (input.icon) updates.icon = input.icon;
      
      // Se qualquer campo relevante mudou, regenerar o system_prompt
      if (input.context_type || input.name || input.description || input.detailed_context) {
        const existingContext = contexts.find(c => c.id === id);
        if (existingContext) {
          const fullInput: CreateContextInput = {
            context_type: (input.context_type as any) || (existingContext as any).context_type || 'product',
            name: input.name || existingContext.name,
            description: input.description || existingContext.description,
            detailed_context: input.detailed_context || (existingContext as any).detailed_context || '',
          };
          updates.system_prompt = generateSystemPrompt(fullInput);
        }
      }

      const { error } = await supabase
        .from('custom_agents' as any)
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast.success('Contexto atualizado com sucesso!');
      await fetchContexts();
    } catch (error) {
      console.error('Erro ao atualizar contexto:', error);
      toast.error('Erro ao atualizar contexto');
      throw error;
    }
  };

  const deleteContext = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_agents' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Contexto excluído com sucesso!');
      await fetchContexts();
    } catch (error) {
      console.error('Erro ao excluir contexto:', error);
      toast.error('Erro ao excluir contexto');
      throw error;
    }
  };

  useEffect(() => {
    fetchContexts();
  }, []);

  return {
    contexts,
    loading,
    createContext,
    updateContext,
    deleteContext,
    refetch: fetchContexts,
  };
}
