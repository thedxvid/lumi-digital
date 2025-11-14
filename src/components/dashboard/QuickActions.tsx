import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Sparkles, Video, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Novo Chat',
      description: 'Converse com agentes IA',
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      hoverColor: 'hover:bg-purple-200 dark:hover:bg-purple-900/30',
      path: '/app/chat',
    },
    {
      label: 'Criar Imagem',
      description: 'Engine criativo',
      icon: Sparkles,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-900/20',
      hoverColor: 'hover:bg-pink-200 dark:hover:bg-pink-900/30',
      path: '/app/creative-engine',
    },
    {
      label: 'Gerar Vídeo',
      description: 'Crie vídeos com IA',
      icon: Video,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      hoverColor: 'hover:bg-blue-200 dark:hover:bg-blue-900/30',
      path: '/app/video-generator',
    },
    {
      label: 'Ver Histórico',
      description: 'Resultados anteriores',
      icon: History,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      hoverColor: 'hover:bg-orange-200 dark:hover:bg-orange-900/30',
      path: '/app/history',
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-4">Ações Rápidas</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <Card 
            key={index} 
            className={`cursor-pointer transition-all hover:shadow-lg ${action.hoverColor}`}
            onClick={() => navigate(action.path)}
          >
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className={`w-16 h-16 rounded-xl ${action.bgColor} flex items-center justify-center`}>
                <action.icon className={`w-8 h-8 ${action.color}`} />
              </div>
              <div>
                <p className="font-semibold text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
