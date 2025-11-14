import { LUMI_AGENTS } from '@/data/lumiAgents';
import { cn } from '@/lib/utils';

interface AgentGalleryWelcomeProps {
  selectedAgentId: string;
  onAgentSelect: (agentId: string) => void;
}

export function AgentGalleryWelcome({ selectedAgentId, onAgentSelect }: AgentGalleryWelcomeProps) {
  const selectedAgent = LUMI_AGENTS.find(agent => agent.id === selectedAgentId);
  
  if (!selectedAgent) return null;
  
  return (
    <div className="text-center py-6 px-4 animate-fade-in">
      <div className="max-w-sm mx-auto">
        {/* Avatar do agente selecionado */}
        <div className="relative inline-block mb-3">
          <img 
            src={selectedAgent.icon} 
            alt={selectedAgent.name}
            className="w-20 h-20 rounded-full object-cover border-2"
            style={{ borderColor: selectedAgent.color }}
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAgent.name)}&background=${selectedAgent.color.replace(/[^\w]/g, '')}&color=fff`;
            }}
          />
          <div 
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background"
            style={{ backgroundColor: selectedAgent.color }}
          />
        </div>
        
        {/* Nome e descrição */}
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {selectedAgent.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          {selectedAgent.description}
        </p>
      </div>
    </div>
  );
}
