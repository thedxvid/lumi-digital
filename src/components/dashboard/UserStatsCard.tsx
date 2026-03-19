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
    },
    {
      label: 'Conversas Ativas',
      value: stats.activeConversations,
      icon: MessageSquare,
    },
    {
      label: 'Sequência Atual',
      value: stats.currentStreak,
      icon: Flame,
      suffix: ' dias',
    },
    {
      label: 'Agente Favorito',
      value: stats.topAgent?.name || 'Nenhum',
      icon: TrendingUp,
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border/50 rounded-xl overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card p-5">
            <Skeleton className="h-4 w-20 mb-3" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-medium tracking-tight text-foreground/80 mb-4">Suas Estatísticas</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border/50 rounded-xl overflow-hidden">
        {statsData.map((stat, index) => (
          <div key={index} className="bg-card p-5 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="w-4 h-4 text-lumi-gold" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                {stat.label}
              </span>
            </div>
            {stat.customValue ? (
              stat.customValue
            ) : (
              <p className="font-space-grotesk text-2xl font-semibold tabular-nums text-foreground">
                {stat.value}{stat.suffix || ''}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
