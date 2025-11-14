import { useAgents } from '@/hooks/useAgents';
import { useUserContexts } from '@/hooks/useUserContexts';
import { LUMI_AGENTS } from '@/data/lumiAgents';
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
  const { agents, getAgentById } = useAgents();
  const { contexts } = useUserContexts();
  
  const customAgents = agents.filter(agent => 
    !LUMI_AGENTS.some(defaultAgent => defaultAgent.id === agent.id)
  );
  
  // Filtrar apenas contexts que NÃO são produtos (entity_type !== 'product')
  const agentContexts = contexts.filter(context => context.entity_type !== 'product');
  
  // Combine agents and agent contexts for lookup (exclude products)
  const allOptions = [...agents, ...agentContexts];
  const selectedAgent = allOptions.find(item => item.id === selectedAgentId) || getAgentById(selectedAgentId);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Agente de IA
      </label>
      
      {/* Select com categorias */}
      <Select value={selectedAgentId} onValueChange={onAgentChange}>
        <SelectTrigger className="w-full">
          <SelectValue>
            {selectedAgent && (
              <div className="flex items-center gap-2">
                <img 
                  src={selectedAgent.icon} 
                  alt={selectedAgent.name}
                  className="w-6 h-6 rounded-full object-cover border"
                  style={{ borderColor: selectedAgent.color }}
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAgent.name)}&background=${selectedAgent.color.replace(/[^\w]/g, '')}&color=fff`;
                  }}
                />
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
                  <img 
                    src={agent.icon} 
                    alt={agent.name}
                    className="w-5 h-5 rounded-full object-cover border"
                    style={{ borderColor: agent.color }}
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=${agent.color.replace(/[^\w]/g, '')}&color=fff`;
                    }}
                  />
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
                    <img 
                      src={agent.icon} 
                      alt={agent.name}
                      className="w-5 h-5 rounded-full object-cover border"
                      style={{ borderColor: agent.color }}
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=${agent.color.replace(/[^\w]/g, '')}&color=fff`;
                      }}
                    />
                    <span>{agent.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          
          {/* Categoria: Meus Agentes */}
          {agentContexts.length > 0 && (
            <SelectGroup>
              <SelectLabel>Meus Agentes</SelectLabel>
              {agentContexts.map(context => (
                <SelectItem key={context.id} value={context.id}>
                  <div className="flex items-center gap-2">
                    <span style={{ color: context.color }}>
                      {context.icon}
                    </span>
                    <span>{context.name}</span>
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
