import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAgentAnalytics } from '@/hooks/useAgentAnalytics';
import { TrendingUp, Users, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AgentAnalytics() {
  const { stats, loading } = useAgentAnalytics();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics de Agentes</CardTitle>
          <CardDescription>Carregando estatísticas...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics de Agentes</CardTitle>
          <CardDescription>Nenhum uso registrado ainda</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            As estatísticas de uso dos agentes aparecerão aqui assim que os usuários começarem a interagir.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Analytics de Agentes
        </CardTitle>
        <CardDescription>
          Estatísticas de uso dos agentes especializados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.map((stat, index) => (
            <div
              key={stat.agent_id}
              className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
            >
              {/* Ranking badge */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">#{index + 1}</span>
              </div>

              {/* Foto do agente */}
              <img
                src={stat.photo_url}
                alt={stat.agent_name}
                className="flex-shrink-0 w-12 h-12 rounded-full object-cover border-2"
                style={{ borderColor: stat.color }}
                onError={(e) => {
                  const target = e.currentTarget;
                  target.onerror = null;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(stat.agent_name)}&background=${stat.color.replace(/[^\w]/g, '')}&color=fff`;
                }}
              />

              {/* Informações do agente */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {stat.agent_name}
                </h3>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>{stat.total_uses} usos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{stat.unique_users} usuários</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {formatDistanceToNow(new Date(stat.last_used), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Barra de progresso relativa */}
              <div className="flex-shrink-0 w-24">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${(stat.total_uses / stats[0].total_uses) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
