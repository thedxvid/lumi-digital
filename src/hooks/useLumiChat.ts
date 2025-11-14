
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Message } from '@/types/lumi';

export function useLumiChat() {
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();

  const sendMessage = async (
    message: string, 
    conversationHistory: Message[] = [], 
    images?: string[], 
    agentId?: string,
    productId?: string
  ): Promise<{ message: string; generatedImages?: string[] } | null> => {
    if (!session?.access_token) {
      toast.error('Você precisa estar logado para usar o chat');
      return null;
    }

    setLoading(true);
    
    try {
      console.log('Enviando mensagem para LUMI:', { 
        message, 
        historyLength: conversationHistory.length,
        hasImages: !!images?.length
      });

      // Convert conversation history to OpenAI format
      const formattedHistory = conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('lumi-chat', {
        body: {
          message,
          conversationHistory: formattedHistory,
          images,
          agentId,
          productId
        }
      });

      if (error) {
        console.error('Erro ao enviar mensagem:', error);
        
        if (error.message?.includes('429')) {
          toast.error('Limite de requisições atingido. Aguarde alguns instantes.');
          return { message: 'Ops! Muitas requisições ao mesmo tempo. Aguarde alguns segundos e tente novamente! 💙' };
        } else if (error.message?.includes('402')) {
          toast.error('Créditos insuficientes. Adicione créditos ao workspace.');
          return { message: 'Desculpe, estou com créditos insuficientes. Por favor, entre em contato com o suporte! 💙' };
        }
        
        throw error;
      }

      console.log('Resposta recebida:', { 
        responseLength: data.response?.length 
      });

      // Registrar uso do agente para analytics
      if (agentId) {
        try {
          await supabase.from('agent_usage' as any).insert({
            agent_id: agentId,
            user_id: session.user.id
          });
        } catch (analyticsError) {
          console.error('Erro ao registrar analytics do agente:', analyticsError);
          // Não falhar a requisição se analytics falharem
        }
      }

      return {
        message: data.response,
        generatedImages: data.generatedImages
      }
    } catch (error) {
      console.error('Erro geral no sendMessage:', error);
      toast.error('Erro inesperado no chat com a LUMI');
      return { message: 'Desculpe, encontrei um problema técnico. Estou trabalhando para resolver! 💙' };
    } finally {
      // CRÍTICO: sempre resetar o loading, não importa o que aconteça
      setLoading(false);
    }
  };

  return {
    loading,
    sendMessage,
  };
}
