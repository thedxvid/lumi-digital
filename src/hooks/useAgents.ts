import { useMemo } from 'react';
import { LUMI_AGENTS } from '@/data/lumiAgents';
import { useCustomAgents } from './useCustomAgents';
import { Agent } from '@/types/agents';

export function useAgents() {
  const { agents: customAgents, loading } = useCustomAgents();

  const allAgents = useMemo(() => {
    const activeCustomAgents = customAgents
      .filter(agent => agent.is_active && (agent as any).entity_type === 'agent')
      .map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        icon: agent.icon,
        color: agent.color,
        systemPrompt: agent.system_prompt,
        suggestedTopics: agent.suggested_topics,
        capabilities: agent.capabilities,
      })) as Agent[];

    return [...LUMI_AGENTS, ...activeCustomAgents];
  }, [customAgents]);

  const getAgentById = (id: string): Agent | undefined => {
    return allAgents.find(agent => agent.id === id);
  };

  return {
    agents: allAgents,
    loading,
    getAgentById,
  };
}
