
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Cache inteligente para otimizar chamadas de IA
class ModuleCache {
  private cache = new Map<string, { result: any; timestamp: number; ttl: number }>();
  
  generateKey(module: string, data: any): string {
    // Remove campos que não afetam o resultado para melhor cache hit
    const { leadName, productName, theme, ...relevantData } = data;
    return `${module}_${JSON.stringify(relevantData)}`;
  }
  
  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.result;
  }
  
  set(key: string, result: any, ttlMinutes = 30): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
}

const moduleCache = new ModuleCache();

export function useAdvancedSalesModules() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const { session } = useAuth();

  const callAdvancedModule = async (module: string, data: any) => {
    if (!session?.access_token) {
      toast.error('Você precisa estar logado para usar esta funcionalidade');
      return null;
    }

    setLoading(true);
    setProgress('Iniciando análise...');

    try {
      // Verificar cache primeiro
      const cacheKey = moduleCache.generateKey(module, data);
      const cachedResult = moduleCache.get(cacheKey);
      
      if (cachedResult) {
        console.log('Using cached result for module:', module);
        setProgress('Resultado encontrado no cache');
        
        // Simular pequeno delay para UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return cachedResult;
      }

      console.log('Calling advanced module:', module, 'with data:', data);
      setProgress('Processando com IA avançada...');
      
      const { data: result, error } = await supabase.functions.invoke('lumi-tools', {
        body: { module, data },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error calling advanced sales module:', error);
        toast.error('Erro ao processar solicitação com IA avançada');
        return null;
      }

      console.log('Advanced module result:', result);
      setProgress('Salvando resultado...');

      // Salvar no cache
      moduleCache.set(cacheKey, result);

      // Salvar automaticamente o resultado com estrutura aprimorada
      if (result) {
        await autoSaveAdvancedResult(module, data, result);
      }

      setProgress('Concluído!');
      toast.success('Análise avançada concluída com sucesso!', {
        description: 'Resultado mais detalhado e personalizado gerado'
      });
      
      return result;
    } catch (error) {
      console.error('Error in advanced sales module call:', error);
      toast.error('Erro inesperado na análise avançada. Tente novamente.');
      return null;
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const autoSaveAdvancedResult = async (moduleId: string, inputData: any, result: any) => {
    if (!session?.user?.id) return;

    try {
      // Gerar título mais descritivo baseado no resultado avançado
      const title = generateAdvancedTitle(moduleId, result, inputData);
      
      // Determinar tipo de asset com mais precisão
      const assetType = mapModuleToAssetType(moduleId);
      
      // Preparar conteúdo rico para salvar
      const content = prepareAdvancedContentForSave(result);

      const { error } = await supabase
        .from('generated_assets')
        .insert({
          title,
          content,
          asset_type: assetType as 'copy' | 'script' | 'email' | 'post_social' | 'sequencia' | 'roteiro',
          module_used: moduleId,
          user_id: session.user.id,
          input_data: { 
            ...inputData, 
            result,
            advanced: true,
            generated_at: new Date().toISOString(),
            ai_model: 'gpt-5-advanced'
          },
          tags: generateSmartTags(moduleId, inputData, result)
        });

      if (error) {
        console.error('Error auto-saving advanced result:', error);
      } else {
        console.log('Advanced result auto-saved successfully');
      }
    } catch (error) {
      console.error('Error in advanced auto-save:', error);
    }
  };

  const generateAdvancedTitle = (moduleId: string, result: any, inputData: any): string => {
    const moduleNames: Record<string, string> = {
      'lead-diagnosis': 'Diagnóstico Avançado de Lead',
      'lead-capture': 'Copy de Captura Profissional',
      'objection-breaking': 'Quebra de Objeção Estratégica',
      'remarketing': 'Estratégia de Remarketing',
      'launch-plan': 'Plano de Lançamento Completo',
      'sales-routine': 'Rotina de Vendas Otimizada',
      'mindset': 'Transformação de Mindset',
      'infoproduct-generator': 'Infoproduto Completo',
      'pesquisa-publico': 'Análise de Público Avançada'
    };

    const baseName = moduleNames[moduleId] || 'Resultado Lumi Avançado';
    
    // Usar dados específicos do resultado para personalizar
    if (result.title) return result.title;
    if (result.leadName || inputData.leadName) return `${baseName} - ${result.leadName || inputData.leadName}`;
    if (result.productName || inputData.productName) return `${baseName} - ${result.productName || inputData.productName}`;
    if (result.theme || inputData.theme) return `${baseName} - ${result.theme || inputData.theme}`;
    if (inputData.targetAudience) return `${baseName} - ${inputData.targetAudience}`;
    
    // Título com timestamp mais descritivo
    const timestamp = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
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

  const prepareAdvancedContentForSave = (result: any): string => {
    if (typeof result === 'string') return result;
    
    // Tentar extrair conteúdo principal de forma mais inteligente
    if (result.content) return result.content;
    if (result.message && result.message.length > 100) return result.message;
    if (result.diagnosis) return result.diagnosis;
    if (result.response) return result.response;
    if (result.structure) return result.structure;
    
    // Para objetos complexos, criar resumo estruturado
    if (typeof result === 'object') {
      let summary = '';
      
      if (result.title) summary += `# ${result.title}\n\n`;
      if (result.diagnosis) summary += `## Diagnóstico\n${result.diagnosis}\n\n`;
      if (result.recommendations) {
        summary += `## Recomendações\n${Array.isArray(result.recommendations) 
          ? result.recommendations.join('\n') 
          : result.recommendations}\n\n`;
      }
      if (result.nextActions) {
        summary += `## Próximos Passos\n${Array.isArray(result.nextActions) 
          ? result.nextActions.join('\n') 
          : result.nextActions}\n\n`;
      }
      
      return summary || JSON.stringify(result, null, 2);
    }
    
    return JSON.stringify(result, null, 2);
  };

  const generateSmartTags = (moduleId: string, inputData: any, result: any): string[] => {
    const tags = ['ai-avancada', moduleId];
    
    // Tags baseadas no input
    if (inputData.targetAudience) tags.push(inputData.targetAudience.toLowerCase());
    if (inputData.productNiche) tags.push(inputData.productNiche.toLowerCase());
    if (inputData.source) tags.push(inputData.source.toLowerCase());
    if (inputData.platform) tags.push(inputData.platform.toLowerCase());
    
    // Tags baseadas no resultado
    if (result.temperature) tags.push(`lead-${result.temperature}`);
    if (result.confidence) tags.push(`confianca-${result.confidence}`);
    
    return tags.slice(0, 8); // Limitar a 8 tags
  };

  const saveAdvancedAsset = async (asset: {
    title: string;
    content: string;
    asset_type: 'copy' | 'script' | 'email' | 'post_social' | 'sequencia' | 'roteiro';
    module_used: string;
    input_data?: any;
    tags?: string[];
  }) => {
    if (!session?.user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('generated_assets')
        .insert({
          ...asset,
          user_id: session.user.id,
          tags: asset.tags || [],
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Conteúdo avançado salvo com sucesso!');
      return data;
    } catch (error) {
      console.error('Error saving advanced asset:', error);
      toast.error('Erro ao salvar conteúdo avançado');
      return null;
    }
  };

  const clearCache = () => {
    moduleCache.clear();
    toast.success('Cache limpo com sucesso');
  };

  return {
    loading,
    progress,
    callAdvancedModule,
    saveAdvancedAsset,
    clearCache,
  };
}
