import { LUMI_AGENTS } from '@/data/lumiAgents';
import { cn } from '@/lib/utils';

interface AgentGalleryWelcomeProps {
  selectedAgentId: string;
  onAgentSelect: (agentId: string) => void;
}

export function AgentGalleryWelcome({ selectedAgentId, onAgentSelect }: AgentGalleryWelcomeProps) {
  return (
    <div className="text-center py-8 px-4 animate-fade-in">
      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-lumi-gold to-lumi-gold-dark rounded-full flex items-center justify-center">
        <span className="text-2xl">✨</span>
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Olá! Eu sou a LUMI
      </h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        Escolha um dos nossos especialistas para começar
      </p>
      
      {/* Grid de Agentes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
        {LUMI_AGENTS.map((agent) => {
          const isSelected = agent.id === selectedAgentId;
          
          return (
            <button
              key={agent.id}
              onClick={() => onAgentSelect(agent.id)}
              className={cn(
                "group relative p-4 rounded-lg border-2 transition-all duration-200",
                "hover:scale-105 hover:shadow-lg",
                isSelected
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              {/* Badge de selecionado */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-scale-in">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
              )}
              
              {/* Avatar */}
              <div className="relative mb-3">
                <img 
                  src={agent.icon} 
                  alt={agent.name}
                  className="w-16 h-16 rounded-full object-cover mx-auto border-2 transition-transform group-hover:scale-110"
                  style={{ borderColor: agent.color }}
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=${agent.color.replace(/[^\w]/g, '')}&color=fff`;
                  }}
                />
                {/* Indicador de cor */}
                <div 
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-background"
                  style={{ backgroundColor: agent.color }}
                />
              </div>
              
              {/* Nome */}
              <h3 className="font-semibold text-sm text-foreground mb-1 line-clamp-2 min-h-[2.5rem]">
                {agent.name}
              </h3>
              
              {/* Descrição */}
              <p className="text-xs text-muted-foreground line-clamp-2 leading-tight">
                {agent.description}
              </p>
            </button>
          );
        })}
      </div>
      
      {/* Dica */}
      <p className="text-xs text-muted-foreground mt-6">
        💡 Dica: Você pode trocar de agente a qualquer momento durante a conversa
      </p>
    </div>
  );
}
