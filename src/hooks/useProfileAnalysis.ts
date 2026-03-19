import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActivity } from '@/hooks/useActivity';
import { toast } from 'sonner';
import { classifyError } from '@/utils/errorClassifier';
import type { ProfileAnalysisInput, ProfileAnalysisOutput, SavedProfileAnalysis } from '@/types/profile';

export function useProfileAnalysis() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<SavedProfileAnalysis[]>([]);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [currentResult, setCurrentResult] = useState<ProfileAnalysisOutput | null>(null);
  const { session } = useAuth();
  const { logActivity } = useActivity();

  const analyzeProfile = async (input: ProfileAnalysisInput) => {
    if (!session?.access_token) {
      toast.error('Você precisa estar logado');
      return null;
    }

    setLoading(true);
    try {
      // Check limits before analyzing
      console.log('🔍 Checking limits...');
      const { data: limitsCheck, error: limitsError } = await supabase.functions.invoke('check-limits', {
        body: { feature: 'profile_analysis', increment: false }
      });

      if (limitsError) {
        console.error('❌ Limits check error:', limitsError);
        toast.error('Erro ao verificar limites');
        return null;
      }

      if (!limitsCheck?.allowed) {
        toast.error(limitsCheck?.reason || 'Limite de análises atingido');
        return null;
      }

      console.log('📤 Enviando requisição de análise...');
      const { data, error } = await supabase.functions.invoke('profile-analysis', {
        body: input,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('❌ Erro na função:', error);
        throw error;
      }

      console.log('✅ Análise recebida:', data);
      setCurrentResult(data);
      setResultModalOpen(true);
      
      // Auto-salvar no histórico
      await saveToHistory(input, data);
      
      // Increment usage after successful analysis
      console.log('📊 Incrementando contador de uso...');
      await supabase.functions.invoke('check-limits', {
        body: { feature: 'profile_analysis', increment: true }
      });
      
      toast.success('Análise concluída!');
      return data;
    } catch (error: any) {
      console.error('❌ Erro ao analisar perfil:', error);
      const classified = classifyError(error, 'analisar perfil');
      toast.error(classified.errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = async (input: ProfileAnalysisInput, result: ProfileAnalysisOutput) => {
    if (!session?.user?.id) return;

    try {
      console.log('💾 Salvando no histórico...');
      const { error } = await supabase
        .from('profile_analyses')
        .insert({
          user_id: session.user.id,
          profile_image: input.image,
          input_data: input as any,
          analysis_result: result as any,
          platform: input.platform,
        });

      if (error) throw error;
      console.log('✅ Salvo no histórico');
      
      // Log activity
      await logActivity('result');
      
      await loadHistory();
    } catch (error) {
      console.error('❌ Erro ao salvar no histórico:', error);
      toast.warning('Análise concluída, mas houve um erro ao salvar no histórico.');
    }
  };

  const loadHistory = async () => {
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profile_analyses')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory((data as any) || []);
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error);
    }
  };

  const deleteAnalysis = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profile_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadHistory();
      toast.success('Análise deletada');
    } catch (error) {
      console.error('❌ Erro ao deletar:', error);
      toast.error('Erro ao deletar análise');
    }
  };

  const toggleFavorite = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('profile_analyses')
        .update({ is_favorite: !currentValue })
        .eq('id', id);

      if (error) throw error;
      await loadHistory();
    } catch (error) {
      console.error('❌ Erro ao favoritar:', error);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      loadHistory();
    }
  }, [session?.user?.id]);

  return {
    loading,
    analyzeProfile,
    history,
    loadHistory,
    deleteAnalysis,
    toggleFavorite,
    resultModalOpen,
    setResultModalOpen,
    currentResult,
  };
}
