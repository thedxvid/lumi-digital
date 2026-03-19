
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActivity } from '@/hooks/useActivity';
import { toast } from 'sonner';
import { classifyError } from '@/utils/errorClassifier';

export function useSalesModules() {
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();
  const { logActivity } = useActivity();

  const callModule = async (module: string, data: any) => {
    if (!session?.access_token) {
      toast.error('Você precisa estar logado para usar esta funcionalidade');
      return null;
    }

    setLoading(true);
    try {
      console.log('Calling module:', module, 'with data:', data);
      
      const { data: result, error } = await supabase.functions.invoke('lumi-tools', {
        body: { module, data },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error calling sales module:', error);
        const classified = classifyError(error, 'processar solicitação');
        toast.error(classified.errorMessage);
        return null;
      }

      console.log('Module result:', result);

      // Salvar automaticamente o resultado
      if (result) {
        await autoSaveResult(module, data, result);
      }

      toast.success('Análise concluída com sucesso!');
      return result;
    } catch (error) {
      console.error('Error in sales module call:', error);
      const classified = classifyError(error, 'processar solicitação');
      toast.error(classified.errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const autoSaveResult = async (moduleId: string, inputData: any, result: any) => {
    if (!session?.user?.id) return;

    try {
      // Gerar título baseado no módulo e resultado
      const title = generateTitle(moduleId, result, inputData);
      
      // Determinar tipo de asset baseado no módulo
      const assetType = mapModuleToAssetType(moduleId);
      
      // Preparar conteúdo para salvar
      const content = prepareContentForSave(result);

      const { error } = await supabase
        .from('generated_assets')
        .insert({
          title,
          content,
          asset_type: assetType as 'copy' | 'script' | 'email' | 'post_social' | 'sequencia' | 'roteiro',
          module_used: moduleId,
          user_id: session.user.id,
          input_data: { ...inputData, result }
        });

      if (error) {
        console.error('Error auto-saving result:', error);
        toast.warning('Resultado gerado, mas houve um erro ao salvar automaticamente.');
      } else {
        console.log('Result auto-saved successfully');
        // Log activity after successful save
        await logActivity('result');
      }
    } catch (error) {
      console.error('Error in auto-save:', error);
      toast.warning('Resultado gerado, mas houve um erro ao salvar automaticamente.');
    }
  };

  const generateTitle = (moduleId: string, result: any, inputData: any): string => {
    const moduleNames: Record<string, string> = {
      'lead-diagnosis': 'Diagnóstico de Lead',
      'lead-capture': 'Captação de Leads',
      'objection-breaking': 'Quebra de Objeção',
      'remarketing': 'Estratégia de Remarketing',
      'launch-plan': 'Plano de Lançamento',
      'sales-routine': 'Rotina de Vendas',
      'mindset': 'Boost de Mindset',
      'infoproduct-generator': 'Infoproduto',
      'pesquisa-publico': 'Pesquisa de Público'
    };

    const baseName = moduleNames[moduleId] || 'Resultado Lumi';
    
    // Tentar usar dados específicos do resultado para personalizar o título
    if (result.title) return result.title;
    if (result.leadName || inputData.leadName) return `${baseName} - ${result.leadName || inputData.leadName}`;
    if (result.productName || inputData.productName) return `${baseName} - ${result.productName || inputData.productName}`;
    if (result.theme || inputData.theme) return `${baseName} - ${result.theme || inputData.theme}`;
    
    // Título com timestamp
    const timestamp = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `${baseName} - ${timestamp}`;
  };

  const mapModuleToAssetType = (moduleId: string): string => {
    const mapping: Record<string, string> = {
      'lead-diagnosis': 'copy',
      'lead-capture': 'copy',
      'objection-breaking': 'script',
      'remarketing': 'sequencia',
      'launch-plan': 'roteiro',
      'sales-routine': 'roteiro',
      'mindset': 'copy',
      'infoproduct-generator': 'roteiro',
      'pesquisa-publico': 'copy'
    };
    return mapping[moduleId] || 'copy';
  };

  const prepareContentForSave = (result: any): string => {
    if (typeof result === 'string') return result;
    
    // Extrair conteúdo principal baseado no tipo de resultado
    if (result.content) return result.content;
    if (result.structure) return result.structure;
    if (result.diagnosis) return result.diagnosis;
    if (result.response) return result.response;
    if (result.message) return result.message;
    
    // Fallback para JSON formatado
    return JSON.stringify(result, null, 2);
  };

  const saveAsset = async (asset: {
    title: string;
    content: string;
    asset_type: 'copy' | 'script' | 'email' | 'post_social' | 'sequencia' | 'roteiro';
    module_used: string;
    input_data?: any;
  }) => {
    if (!session?.user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('generated_assets')
        .insert({
          ...asset,
          user_id: session.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Conteúdo salvo com sucesso!');
      return data;
    } catch (error) {
      console.error('Error saving asset:', error);
      toast.error('Erro ao salvar conteúdo');
      return null;
    }
  };

  const saveLead = async (lead: {
    name: string;
    contact?: string;
    source?: string;
    behavior_notes?: string;
    temperature: 'quente' | 'morno' | 'frio';
  }) => {
    if (!session?.user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...lead,
          user_id: session.user.id,
          status: 'ativo' as const,
          last_interaction: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Lead salvo com sucesso!');
      return data;
    } catch (error) {
      console.error('Error saving lead:', error);
      toast.error('Erro ao salvar lead');
      return null;
    }
  };

  return {
    loading,
    callModule,
    saveAsset,
    saveLead,
  };
}
