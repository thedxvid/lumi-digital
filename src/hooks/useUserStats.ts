import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useActivity } from './useActivity';
import { LUMI_AGENTS } from '@/data/lumiAgents';

interface UserStats {
  creativesThisMonth: number;
  activeConversations: number;
  currentStreak: number;
  topAgent: {
    name: string;
    icon: string;
    uses: number;
  } | null;
}

export function useUserStats() {
  const [stats, setStats] = useState<UserStats>({
    creativesThisMonth: 0,
    activeConversations: 0,
    currentStreak: 0,
    topAgent: null,
  });
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();
  const { currentStreak } = useActivity();

  useEffect(() => {
    if (session?.user?.id) {
      fetchStats();
    }
  }, [session?.user?.id]);

  useEffect(() => {
    setStats(prev => ({ ...prev, currentStreak }));
  }, [currentStreak]);

  const fetchStats = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);

      // Fetch creatives from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: creativesCount } = await supabase
        .from('creative_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Fetch active conversations
      const { count: conversationsCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);

      // Fetch top agent
      const { data: agentUsage } = await supabase
        .from('agent_usage' as any)
        .select('agent_id')
        .eq('user_id', session.user.id) as any;

      let topAgent = null;
      if (agentUsage && agentUsage.length > 0) {
        const agentCounts = agentUsage.reduce((acc: any, item: any) => {
          acc[item.agent_id] = (acc[item.agent_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const topAgentId = Object.entries(agentCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
        if (topAgentId) {
          const agent = LUMI_AGENTS.find(a => a.id === topAgentId[0]);
          if (agent) {
            topAgent = {
              name: agent.name,
              icon: agent.icon,
              uses: topAgentId[1] as number,
            };
          }
        }
      }

      setStats({
        creativesThisMonth: creativesCount || 0,
        activeConversations: conversationsCount || 0,
        currentStreak,
        topAgent,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refresh: fetchStats };
}
