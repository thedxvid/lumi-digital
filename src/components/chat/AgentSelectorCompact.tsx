import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { LUMI_AGENTS } from '@/data/lumiAgents';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AgentSelectorCompactProps {
  selectedAgentId: string;
  onAgentChange: (agentId: string) => void;
}

export function AgentSelectorCompact({ selectedAgentId, onAgentChange }: AgentSelectorCompactProps) {
  const navigate = useNavigate();
  const { agents, getAgentById } = useAgents();
  
  const customAgents = agents.filter(agent => 
    !LUMI_AGENTS.some(defaultAgent => defaultAgent.id === agent.id)
  );
  
  const selectedAgent = getAgentById(selectedAgentId);

  return (
    <div className="space-y-2">
      {/* Header com título e botão Gerenciar */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Agente de IA
        </label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/app/admin/agents')}
          className="h-7 px-2"
        >
          <Settings className="h-3.5 w-3.5" />
          <span className="ml-1.5 text-xs">Gerenciar</span>
        </Button>
      </div>
      
      {/* Select com categorias */}
      <Select value={selectedAgentId} onValueChange={onAgentChange}>
        <SelectTrigger className="w-full">
          <SelectValue>
            {selectedAgent && (
              <div className="flex items-center gap-2">
                <span style={{ color: selectedAgent.color }}>
                  {selectedAgent.icon}
                </span>
                <span className="truncate">{selectedAgent.name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* Categoria: Agentes Padrão */}
          <SelectGroup>
            <SelectLabel>Agentes Padrão</SelectLabel>
            {LUMI_AGENTS.map(agent => (
              <SelectItem key={agent.id} value={agent.id}>
                <div className="flex items-center gap-2">
                  <span style={{ color: agent.color }}>
                    {agent.icon}
                  </span>
                  <span>{agent.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
          
          {/* Categoria: Meus Agentes */}
          {customAgents.length > 0 && (
            <SelectGroup>
              <SelectLabel>Meus Agentes</SelectLabel>
              {customAgents.map(agent => (
                <SelectItem key={agent.id} value={agent.id}>
                  <div className="flex items-center gap-2">
                    <span style={{ color: agent.color }}>
                      {agent.icon}
                    </span>
                    <span>{agent.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
      
      {/* Descrição do agente selecionado */}
      {selectedAgent && (
        <p className="text-xs text-muted-foreground leading-tight">
          {selectedAgent.description}
        </p>
      )}
    </div>
  );
}
