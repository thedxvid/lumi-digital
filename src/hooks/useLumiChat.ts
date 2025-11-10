
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
    agentId?: string
  ): Promise<{ message: string; generatedImages?: string[] } | null> => {
    if (!session?.access_token) {
      toast.error('Você precisa estar logado para usar o chat');
      return null;
    }

    setLoading(true);
    
    try {
      // Implementar retry com backoff exponencial
      const maxRetries = 3;
      let lastError: any = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Tentativa ${attempt}/${maxRetries} - Enviando mensagem para LUMI:`, { 
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
              agentId
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (error) {
            console.error(`Erro na tentativa ${attempt}:`, error);
            lastError = error;
            
            // Se for um erro de rede ou temporário, tentar novamente
            if (attempt < maxRetries && (
              error.message?.includes('503') || 
              error.message?.includes('502') || 
              error.message?.includes('timeout') ||
              error.message?.includes('network')
            )) {
              const backoffDelay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
              console.log(`Aguardando ${backoffDelay}ms antes da próxima tentativa...`);
              await new Promise(resolve => setTimeout(resolve, backoffDelay));
              continue;
            }
            
            // Para outros erros, não tentar novamente
            throw error;
          }

          if (data?.error) {
            console.error('Erro retornado pela LUMI:', data);
            return { 
              message: data.message || 'Desculpe, não consegui processar sua mensagem neste momento. 💙'
            };
          }

          if (!data?.message) {
            throw new Error('Resposta inválida da LUMI');
          }

          console.log('Resposta da LUMI recebida com sucesso:', { 
            responseLength: data.message.length,
            hasImages: !!data.generatedImages,
            usage: data.usage,
            attempt
          });

          return {
            message: data.message,
            generatedImages: data.generatedImages
          };

        } catch (error) {
          console.error(`Erro na tentativa ${attempt}:`, error);
          lastError = error;
          
          // Se for a última tentativa, quebrar o loop
          if (attempt === maxRetries) {
            break;
          }
          
          // Aguardar antes da próxima tentativa
          const backoffDelay = Math.pow(2, attempt) * 1000;
          console.log(`Aguardando ${backoffDelay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }

      // Se chegou aqui, todas as tentativas falharam
      console.error('Todas as tentativas falharam. Último erro:', lastError);
      
      // Mensagem de erro personalizada baseada no tipo de erro
      if (lastError?.message?.includes('503') || lastError?.message?.includes('502')) {
        toast.error('A LUMI está temporariamente indisponível. Tente novamente em alguns minutos.');
        return { message: 'Ops! Estou passando por uma manutenção rápida. Tente novamente em alguns minutinhos! 💙' };
      } else if (lastError?.message?.includes('timeout')) {
        toast.error('Timeout na comunicação. Tente novamente.');
        return { message: 'Desculpe, demorei mais que o esperado para responder. Pode tentar novamente? 💙' };
      } else {
        toast.error('Erro inesperado no chat com a LUMI');
        return { message: 'Desculpe, encontrei um problema técnico. Estou trabalhando para resolver! 💙' };
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
