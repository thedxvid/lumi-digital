import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LUMI_AGENTS } from '@/data/lumiAgents';

export interface AgentStats {
  agent_id: string;
  agent_name: string;
  total_uses: number;
  unique_users: number;
  last_used: string;
  photo_url: string;
  color: string;
}

export function useAgentAnalytics() {
  const [stats, setStats] = useState<AgentStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentStats();
  }, []);

  const fetchAgentStats = async () => {
    try {
      setLoading(true);

      // Buscar estatísticas agregadas de uso dos agentes
      const { data: usageData, error } = await supabase
        .from('agent_usage' as any)
        .select('agent_id, user_id, created_at') as any;

      if (error) throw error;
      
      // Buscar agentes customizados
      const { data: customAgents } = await supabase
        .from('custom_agents')
        .select('id, name, icon, color, is_active')
        .eq('is_active', true);

      // Combinar agentes padrão e customizados
      const allAgents = [
        ...LUMI_AGENTS,
        ...(customAgents || []).map(agent => ({
          id: agent.id,
          name: agent.name,
          icon: agent.icon,
          color: agent.color
        }))
      ];

      // Agrupar estatísticas por agente
      const agentStatsMap = new Map<string, {
        total_uses: number;
        unique_users: Set<string>;
        last_used: string;
      }>();

      usageData?.forEach((usage: any) => {
        const existing = agentStatsMap.get(usage.agent_id) || {
          total_uses: 0,
          unique_users: new Set<string>(),
          last_used: usage.created_at
        };

        existing.total_uses += 1;
        existing.unique_users.add(usage.user_id);
        
        // Atualizar last_used se for mais recente
        if (new Date(usage.created_at) > new Date(existing.last_used)) {
          existing.last_used = usage.created_at;
        }

        agentStatsMap.set(usage.agent_id, existing);
      });

      // Criar array de estatísticas com metadados dos agentes
      const statsArray: AgentStats[] = Array.from(agentStatsMap.entries())
        .map(([agentId, stats]) => {
          const agent = allAgents.find(a => a.id === agentId);
          return {
            agent_id: agentId,
            agent_name: agent?.name || agentId,
            total_uses: stats.total_uses,
            unique_users: stats.unique_users.size,
            last_used: stats.last_used,
            photo_url: agent?.icon || '',
            color: agent?.color || 'hsl(221, 83%, 53%)'
          };
        })
        .sort((a, b) => b.total_uses - a.total_uses); // Ordenar por mais usados

      setStats(statsArray);
    } catch (error) {
      console.error('Erro ao buscar analytics dos agentes:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    refresh: fetchAgentStats
  };
}
