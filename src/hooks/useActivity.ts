import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ActivityLog {
  id: string;
  user_id: string;
  activity_date: string;
  modules_used: string[] | number;
  chats_started: number;
  results_generated: number;
  time_spent_minutes: number;
  created_at: string;
  updated_at: string;
}

export function useActivity() {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    if (session?.user?.id) {
      loadStreak();
    }
  }, [session]);

  const loadStreak = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_streak', { _user_id: session?.user?.id });

      if (error) throw error;
      setCurrentStreak(data || 0);
    } catch (error) {
      console.error('Error loading streak:', error);
      setCurrentStreak(0);
    } finally {
      setLoading(false);
    }
  };

  const logActivity = async (activityType: 'module' | 'chat' | 'result') => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get or create today's activity log
      const { data: existing } = await supabase
        .from('user_activity_log')
        .select('*')
        .eq('user_id', session?.user?.id)
        .eq('activity_date', today)
        .single();

      const updates: any = {};
      const currentModulesUsed = Array.isArray(existing?.modules_used) ? existing.modules_used.length : (existing?.modules_used || 0);
      
      if (activityType === 'module') {
        updates.modules_used = currentModulesUsed + 1;
      } else if (activityType === 'chat') {
        updates.chats_started = (existing?.chats_started || 0) + 1;
      } else if (activityType === 'result') {
        updates.results_generated = (existing?.results_generated || 0) + 1;
      }

      const existingModulesUsed = Array.isArray(existing?.modules_used) ? existing.modules_used.length : (existing?.modules_used || 0);
      
      const { error } = await supabase
        .from('user_activity_log')
        .upsert({
          user_id: session?.user?.id,
          activity_date: today,
          modules_used: existingModulesUsed,
          chats_started: existing?.chats_started || 0,
          results_generated: existing?.results_generated || 0,
          time_spent_minutes: existing?.time_spent_minutes || 0,
          ...updates
        });

      if (error) throw error;

      // Reload streak after logging activity
      loadStreak();
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  return {
    currentStreak,
    loading,
    logActivity,
    refreshStreak: loadStreak
  };
}
