import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUsageLimits } from './useUsageLimits';
import { 
  estimateImageCost, 
  estimateVideoCost, 
  estimateCarouselCost,
  formatCostUSD 
} from '@/config/falPricing';

interface BYOKCostSummary {
  today: number;
  week: number;
  month: number;
  allTime: number;
}

interface BYOKCostRecord {
  id: string;
  feature_type: string;
  api_model: string;
  estimated_cost_usd: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const useBYOKCosts = () => {
  const { user } = useAuth();
  const { limits } = useUsageLimits();
  const [costs, setCosts] = useState<BYOKCostSummary>({ today: 0, week: 0, month: 0, allTime: 0 });
  const [recentCosts, setRecentCosts] = useState<BYOKCostRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasBYOK, setHasBYOK] = useState(false);

  // Verificar se usuário tem BYOK ativo
  useEffect(() => {
    const checkBYOK = async () => {
      if (!user?.id) {
        setHasBYOK(false);
        return;
      }

      // Verificar se tem api_tier = 'pro' E chave válida
      const isPro = limits?.api_tier === 'pro';
      
      if (!isPro) {
        setHasBYOK(false);
        return;
      }

      // Verificar se tem chave Fal.ai válida
      const { data: apiKey } = await supabase
        .from('user_api_keys')
        .select('is_valid, is_active')
        .eq('user_id', user.id)
        .eq('provider', 'fal_ai')
        .maybeSingle();

      setHasBYOK(apiKey?.is_valid === true && apiKey?.is_active === true);
    };

    checkBYOK();
  }, [user?.id, limits?.api_tier]);

  // Carregar custos do usuário
  const loadCosts = useCallback(async () => {
    if (!user?.id || !hasBYOK) return;

    setIsLoading(true);
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Buscar todos os custos do mês (para calcular todos os períodos)
      const { data, error } = await supabase
        .from('user_byok_costs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const records = (data || []) as BYOKCostRecord[];
      setRecentCosts(records.slice(0, 20));

      // Calcular totais por período
      const todayTotal = records
        .filter(r => r.created_at >= startOfDay)
        .reduce((sum, r) => sum + Number(r.estimated_cost_usd), 0);

      const weekTotal = records
        .filter(r => r.created_at >= startOfWeek)
        .reduce((sum, r) => sum + Number(r.estimated_cost_usd), 0);

      const monthTotal = records
        .reduce((sum, r) => sum + Number(r.estimated_cost_usd), 0);

      // Buscar total all-time separadamente
      const { data: allTimeData } = await supabase
        .from('user_byok_costs')
        .select('estimated_cost_usd')
        .eq('user_id', user.id);

      const allTimeTotal = (allTimeData || [])
        .reduce((sum, r) => sum + Number(r.estimated_cost_usd), 0);

      setCosts({
        today: todayTotal,
        week: weekTotal,
        month: monthTotal,
        allTime: allTimeTotal,
      });
    } catch (error) {
      console.error('Erro ao carregar custos BYOK:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, hasBYOK]);

  // Carregar custos quando BYOK estiver disponível
  useEffect(() => {
    if (hasBYOK) {
      loadCosts();
    }
  }, [hasBYOK, loadCosts]);

  // Registrar novo custo (chamado localmente após geração bem-sucedida)
  const registerCost = useCallback(async (
    featureType: 'creative_image' | 'carousel' | 'video',
    apiModel: string,
    estimatedCostUsd: number,
    metadata?: Record<string, unknown>
  ) => {
    if (!user?.id || !hasBYOK) return;

    try {
      await supabase
        .from('user_byok_costs')
        .insert([{
          user_id: user.id,
          feature_type: featureType,
          api_model: apiModel,
          estimated_cost_usd: estimatedCostUsd,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : {},
        }]);

      // Atualizar totais localmente
      setCosts(prev => ({
        ...prev,
        today: prev.today + estimatedCostUsd,
        week: prev.week + estimatedCostUsd,
        month: prev.month + estimatedCostUsd,
        allTime: prev.allTime + estimatedCostUsd,
      }));
    } catch (error) {
      console.error('Erro ao registrar custo BYOK:', error);
    }
  }, [user?.id, hasBYOK]);

  return {
    hasBYOK,
    costs,
    recentCosts,
    isLoading,
    loadCosts,
    registerCost,
    // Helpers para estimativa
    estimateImageCost,
    estimateVideoCost,
    estimateCarouselCost,
    formatCostUSD,
  };
};
