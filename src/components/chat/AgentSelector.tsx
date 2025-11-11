import { Agent } from '@/types/agents';
import { useAgents } from '@/hooks/useAgents';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface AgentSelectorProps {
  selectedAgentId: string;
  onAgentChange: (agentId: string) => void;
}

export function AgentSelector({ selectedAgentId, onAgentChange }: AgentSelectorProps) {
  const { agents, getAgentById } = useAgents();
  const selectedAgent = getAgentById(selectedAgentId);

  return (
    <div className="mb-6">
      <Select value={selectedAgentId} onValueChange={onAgentChange}>
        <SelectTrigger className="w-full max-w-xs mx-auto">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedAgent?.icon}</span>
              <span className="font-medium text-sm">{selectedAgent?.name}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {agents.map((agent) => (
            <SelectItem key={agent.id} value={agent.id}>
              <div className="flex items-center gap-3 py-2">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{ backgroundColor: agent.color + '20', color: agent.color }}
                >
                  {agent.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {agent.description}
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
