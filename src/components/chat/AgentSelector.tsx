import { Agent } from '@/types/agents';
import { useAgents } from '@/hooks/useAgents';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface AgentSelectorProps {
  selectedAgentId: string;
  onAgentChange: (agentId: string) => void;
}

export function AgentSelector({ selectedAgentId, onAgentChange }: AgentSelectorProps) {
  const { agents, getAgentById } = useAgents();

  return (
    <div className="w-full max-w-2xl mx-auto mb-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
        Escolha seu agente especialista:
      </h3>
      
      <div className="relative">
        {/* Fade gradient sutil no bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
        
        <ScrollArea className="h-[240px] pr-1">
          {/* Divisores sutis ao invés de bordas individuais */}
          <div className="divide-y divide-border/40">
            {agents.map((agent) => {
              const isSelected = agent.id === selectedAgentId;
              
              return (
                <button
                  key={agent.id}
                  onClick={() => onAgentChange(agent.id)}
                  className={cn(
                    // Layout compacto
                    "w-full min-h-[56px] py-2.5 px-3",
                    "flex items-center gap-2.5",
                    // Visual flat
                    "transition-colors duration-150",
                    "touch-manipulation",
                    // Estados sutis
                    isSelected 
                      ? "bg-accent/50" 
                      : "bg-transparent hover:bg-muted/30"
                  )}
                  aria-label={`Selecionar ${agent.name}`}
                  aria-pressed={isSelected}
                >
                  {/* Foto do agente */}
                  <img 
                    src={agent.icon} 
                    alt={agent.name}
                    className="flex-shrink-0 w-8 h-8 rounded-full object-cover border-2"
                    style={{ borderColor: agent.color }}
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=${agent.color.replace(/[^\w]/g, '')}&color=fff`;
                    }}
                  />
                  
                  {/* Conteúdo textual compacto */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium text-sm text-foreground truncate">
                        {agent.name}
                      </h4>
                      
                      {/* Check indicator sutil */}
                      {isSelected && (
                        <Check 
                          className="w-4 h-4 text-foreground/60 flex-shrink-0" 
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    
                    {/* Descrição truncada em 1 linha */}
                    <p 
                      className="text-xs text-muted-foreground line-clamp-1 leading-tight"
                      title={agent.description}
                    >
                      {agent.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
      
      {/* Indicador minimalista do agente selecionado */}
      <div className="mt-2 px-1 text-center">
        <p className="text-[10px] text-muted-foreground/60">
          {getAgentById(selectedAgentId)?.name}
        </p>
      </div>
    </div>
  );
}
