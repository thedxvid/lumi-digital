import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { UsageLimits, VideoAddonType } from '@/types/subscription';
import { allVideoAddons } from '@/data/pricingPlans';

type FeatureType = 'creative_images' | 'profile_analysis' | 'carousels' | 'videos';

export const useUsageLimits = () => {
  const [limits, setLimits] = useState<UsageLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLimits();
    
    // Listen for custom event to refresh limits
    const handleRefresh = () => {
      loadLimits();
    };
    
    window.addEventListener('usage-limits-updated', handleRefresh);
    
    return () => {
      window.removeEventListener('usage-limits-updated', handleRefresh);
    };
  }, []);

  const loadLimits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('usage_limits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading limits:', error);
      }

      setLimits(data as UsageLimits || null);
    } catch (error) {
      console.error('Error loading limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkLimit = async (feature: FeatureType, increment = false): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Você precisa estar autenticado');
        return false;
      }

      const { data, error } = await supabase.functions.invoke('check-limits', {
        body: { feature, increment }
      });

      if (error) throw error;

      if (!data.allowed) {
        if (data.requiresUpgrade) {
          toast.error(data.reason || 'Limite atingido', {
            action: {
              label: 'Fazer Upgrade',
              onClick: () => window.location.href = '/pricing'
            }
          });
        } else {
          toast.error(data.reason || 'Limite atingido', {
            action: {
              label: 'Comprar Pacote',
              onClick: () => window.location.href = '/video-addons'
            }
          });
        }
      }

      await loadLimits();
      return data.allowed;
    } catch (error) {
      console.error('Error checking limit:', error);
      toast.error('Erro ao verificar limite');
      return false;
    }
  };

  const purchaseVideoAddon = async (packageType: VideoAddonType): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Você precisa estar autenticado');
        return false;
      }

      // Find package config from all available addons
      const pkg = allVideoAddons.find(addon => addon.type === packageType);
      
      if (!pkg) {
        toast.error('Pacote não encontrado');
        return false;
      }

      // Insert addon record
      const { error: addonError } = await supabase
        .from('video_addons')
        .insert({
          user_id: user.id,
          package_type: packageType,
          credits_amount: pkg.credits,
          price_paid: pkg.price,
          is_active: true,
        });

      if (addonError) throw addonError;

      // Update usage limits
      if (limits) {
        const { error: updateError } = await supabase
          .from('usage_limits')
          .update({
            video_credits: limits.video_credits + pkg.credits,
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      }

      await loadLimits();
      toast.success(`Pacote de ${pkg.credits} vídeos adicionado!`);
      return true;
    } catch (error) {
      console.error('Error purchasing addon:', error);
      toast.error('Erro ao comprar pacote');
      return false;
    }
  };

  const getUsagePercentage = (feature: FeatureType): number => {
    if (!limits) return 0;

    switch (feature) {
      case 'creative_images':
        return (limits.creative_images_daily_used / limits.creative_images_daily_limit) * 100;
      case 'profile_analysis':
        return (limits.profile_analysis_daily_used / limits.profile_analysis_daily_limit) * 100;
      case 'carousels':
        return (limits.carousels_monthly_used / limits.carousels_monthly_limit) * 100;
      case 'videos':
        const totalLimit = limits.videos_monthly_limit + limits.video_credits;
        const totalUsed = limits.videos_monthly_used + limits.video_credits_used;
        return totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;
      default:
        return 0;
    }
  };

  return {
    limits,
    loading,
    checkLimit,
    purchaseVideoAddon,
    getUsagePercentage,
    refreshLimits: loadLimits,
  };
};
