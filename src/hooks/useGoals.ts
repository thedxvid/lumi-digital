import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Goal {
  id: string;
  user_id: string;
  goal_type: 'revenue' | 'leads' | 'products' | 'daily_usage' | 'custom';
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline?: string;
  status: 'active' | 'completed' | 'cancelled' | 'paused';
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    if (session?.user?.id) {
      loadGoals();
    }
  }, [session]);

  const loadGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals((data || []) as Goal[]);
    } catch (error) {
      console.error('Error loading goals:', error);
      toast.error('Erro ao carregar metas');
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goalData: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'completed_at'>) => {
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .insert([{ ...goalData, user_id: session?.user?.id }])
        .select()
        .single();

      if (error) throw error;
      
      setGoals(prev => [data as Goal, ...prev]);
      toast.success('Meta criada com sucesso!');
      return data;
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Erro ao criar meta');
      return null;
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => prev.map(g => g.id === id ? (data as Goal) : g));
      toast.success('Meta atualizada!');
      return data;
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Erro ao atualizar meta');
      return null;
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGoals(prev => prev.filter(g => g.id !== id));
      toast.success('Meta removida');
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Erro ao remover meta');
    }
  };

  const completeGoal = async (id: string) => {
    return updateGoal(id, { 
      status: 'completed', 
      completed_at: new Date().toISOString() 
    });
  };

  const incrementGoalProgress = async (id: string, amount: number) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const newValue = goal.current_value + amount;
    const updates: Partial<Goal> = { current_value: newValue };

    if (newValue >= goal.target_value) {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();
    }

    return updateGoal(id, updates);
  };

  return {
    goals,
    loading,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    incrementGoalProgress,
    refreshGoals: loadGoals
  };
}
