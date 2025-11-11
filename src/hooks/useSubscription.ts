import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Subscription, PlanType, DurationMonths } from '@/types/subscription';

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading subscription:', error);
      }

      setSubscription(data as Subscription || null);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (
    planType: PlanType,
    durationMonths: DurationMonths
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Você precisa estar autenticado');
        return false;
      }

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + durationMonths);

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_type: planType,
          duration_months: durationMonths,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update usage limits
      await updateUsageLimits(planType);
      
      setSubscription(data as Subscription);
      toast.success('Plano ativado com sucesso!');
      return true;
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Erro ao ativar plano');
      return false;
    }
  };

  const updateUsageLimits = async (planType: PlanType) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const limits = getPlanLimits(planType);

    await supabase
      .from('usage_limits')
      .upsert({
        user_id: user.id,
        plan_type: planType,
        ...limits,
      }, {
        onConflict: 'user_id'
      });
  };

  const getPlanLimits = (planType: PlanType) => {
    switch (planType) {
      case 'basic':
        return {
          creative_images_daily_limit: 10,
          creative_images_monthly_limit: 300,
          profile_analysis_daily_limit: 5,
          carousels_monthly_limit: 3,
          videos_monthly_limit: 0,
        };
      case 'pro':
        return {
          creative_images_daily_limit: 30,
          creative_images_monthly_limit: 900,
          profile_analysis_daily_limit: 10,
          carousels_monthly_limit: 10,
          videos_monthly_limit: 15,
        };
      default:
        return {
          creative_images_daily_limit: 0,
          creative_images_monthly_limit: 0,
          profile_analysis_daily_limit: 0,
          carousels_monthly_limit: 0,
          videos_monthly_limit: 0,
        };
    }
  };

  const cancelSubscription = async (): Promise<boolean> => {
    try {
      if (!subscription) {
        toast.error('Nenhuma assinatura ativa');
        return false;
      }

      const { error } = await supabase
        .from('subscriptions')
        .update({ is_active: false })
        .eq('id', subscription.id);

      if (error) throw error;

      setSubscription(null);
      toast.success('Assinatura cancelada');
      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Erro ao cancelar assinatura');
      return false;
    }
  };

  return {
    subscription,
    loading,
    createSubscription,
    cancelSubscription,
    refreshSubscription: loadSubscription,
  };
};
