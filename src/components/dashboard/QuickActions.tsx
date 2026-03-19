import { MessageSquare, Sparkles, Video, History, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Novo Chat',
      description: 'Converse com agentes IA',
      icon: MessageSquare,
      path: '/app/chat',
    },
    {
      label: 'Criar Imagem',
      description: 'Engine criativo',
      icon: Sparkles,
      path: '/app/creative-engine',
    },
    {
      label: 'Gerar Vídeo',
      description: 'Crie vídeos com IA',
      icon: Video,
      path: '/app/video-generator',
    },
    {
      label: 'Ver Histórico',
      description: 'Resultados anteriores',
      icon: History,
      path: '/app/history',
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-medium tracking-tight text-foreground/80 mb-4">Ações Rápidas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className="group flex items-center gap-4 p-4 rounded-xl bg-card border border-transparent hover:border-lumi-gold/20 hover:bg-[hsl(var(--lumi-accent-subtle))] transition-all duration-200 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-muted/50 group-hover:bg-lumi-gold/10 flex items-center justify-center transition-colors duration-200">
              <action.icon className="w-5 h-5 text-muted-foreground group-hover:text-lumi-gold transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{action.label}</p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/30 flex-shrink-0 group-hover:text-lumi-gold/60 group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
};
