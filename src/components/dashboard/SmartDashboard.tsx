import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLumiStore } from '@/hooks/useLumiStore';
import { useActivity } from '@/hooks/useActivity';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function SmartDashboard() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { conversations } = useLumiStore();
  const { currentStreak } = useActivity();
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      loadRecentActivity();
    }
  }, [session]);

  const loadRecentActivity = async () => {
    try {
      // Load recent module results
      const { data: assets } = await supabase
        .from('generated_assets')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

      // Combine with recent conversations
      const recentConvs = conversations
        .slice(0, 2)
        .map(conv => ({
          id: conv.id,
          title: conv.title,
          type: 'chat',
          created_at: new Date(conv.updatedAt).toISOString()
        }));

      const recentAssets = (assets || []).map(asset => ({
        id: asset.id,
        title: asset.title,
        type: 'module',
        module_used: asset.module_used,
        created_at: asset.created_at
      }));

      const combined = [...recentConvs, ...recentAssets]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 4);

      setRecentItems(combined);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: any) => {
    if (item.type === 'chat') {
      navigate(`/app/chat?conversation=${item.id}`);
    } else {
      navigate('/app/history');
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return format(date, 'dd/MM', { locale: ptBR });
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Continue de onde parou</h2>
          {currentStreak > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
              <span className="text-2xl">🔥</span>
              <span className="font-bold text-orange-600">{currentStreak} dias</span>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : recentItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Você ainda não tem atividades recentes
            </p>
            <Button onClick={() => navigate('/app/chat')}>
              Começar agora
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="w-full text-left p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {item.type === 'chat' ? 'Chat' : 'Módulo'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getTimeAgo(item.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
