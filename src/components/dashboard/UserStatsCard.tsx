import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, MessageSquare, Flame, TrendingUp } from 'lucide-react';
import { useUserStats } from '@/hooks/useUserStats';
import { Skeleton } from '@/components/ui/skeleton';

export const UserStatsCard = () => {
  const { stats, loading } = useUserStats();

  const statsData = [
    {
      label: 'Criativos Criados',
      value: stats.creativesThisMonth,
      icon: Sparkles,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      label: 'Conversas Ativas',
      value: stats.activeConversations,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      label: 'Sequência Atual',
      value: stats.currentStreak,
      icon: Flame,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      suffix: ' dias',
    },
    {
      label: 'Agente Favorito',
      value: stats.topAgent?.name || 'Nenhum',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      customValue: stats.topAgent ? (
        <div className="flex items-center gap-2">
          <img 
            src={stats.topAgent.icon} 
            alt={stats.topAgent.name}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="text-sm font-medium truncate">{stats.topAgent.name}</span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">Nenhum</span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-12 w-12 rounded-lg mb-3" />
              <Skeleton className="h-6 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-4">Suas Estatísticas</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              {stat.customValue ? (
                stat.customValue
              ) : (
                <p className="text-3xl font-bold text-foreground">
                  {stat.value}{stat.suffix || ''}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
