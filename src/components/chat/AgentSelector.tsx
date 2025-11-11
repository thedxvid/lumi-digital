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
    <div className="w-full max-w-2xl mx-auto mb-6">
      <h3 className="text-base font-semibold text-foreground mb-3 px-2">
        Escolha seu agente especialista:
      </h3>
      
      <div className="relative">
        {/* Fade gradient no bottom para indicar scroll */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none z-10 rounded-b-lg" />
        
        <ScrollArea className="h-[320px] pr-2">
          <div className="space-y-3 pb-4">
            {agents.map((agent) => {
              const isSelected = agent.id === selectedAgentId;
              
              return (
                <button
                  key={agent.id}
                  onClick={() => onAgentChange(agent.id)}
                  className={cn(
                    // Layout e sizing
                    "w-full min-h-[80px] p-4",
                    "flex items-start gap-3",
                    // Visual
                    "rounded-lg border-2 transition-all duration-200",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    // Área tocável adequada (garantindo mínimo 44x44px)
                    "touch-manipulation",
                    // Estados
                    isSelected 
                      ? "border-lumi-gold bg-lumi-gold/5 shadow-md" 
                      : "border-border bg-card hover:border-lumi-gold/50 hover:bg-muted/50"
                  )}
                  aria-label={`Selecionar ${agent.name}`}
                  aria-pressed={isSelected}
                >
                  {/* Ícone do agente */}
                  <div 
                    className={cn(
                      "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all",
                      isSelected && "ring-2 ring-lumi-gold ring-offset-2 ring-offset-background"
                    )}
                    style={{ 
                      backgroundColor: agent.color + '20', 
                      color: agent.color 
                    }}
                  >
                    {agent.icon}
                  </div>
                  
                  {/* Conteúdo textual */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={cn(
                        "font-semibold text-base leading-tight",
                        isSelected ? "text-lumi-gold-dark" : "text-foreground"
                      )}>
                        {agent.name}
                      </h4>
                      
                      {/* Check indicator */}
                      {isSelected && (
                        <Check 
                          className="w-5 h-5 text-lumi-gold flex-shrink-0 mt-0.5" 
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    
                    {/* Descrição truncada em 2 linhas */}
                    <p 
                      className={cn(
                        "text-sm leading-[1.5]",
                        "line-clamp-2",
                        isSelected ? "text-foreground/90" : "text-muted-foreground"
                      )}
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
      
      {/* Indicador do agente selecionado */}
      <div className="mt-3 px-2 text-center">
        <p className="text-xs text-muted-foreground">
          Agente selecionado: <span className="font-medium text-lumi-gold">{getAgentById(selectedAgentId)?.name}</span>
        </p>
      </div>
    </div>
  );
}
