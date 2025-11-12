
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
    onStreamDelta?: (delta: string) => void
  ): Promise<{ message: string; generatedImages?: string[] } | null> => {
    if (!session?.access_token) {
      toast.error('Você precisa estar logado para usar o chat');
      return null;
    }

    setLoading(true);
    
    try {
      console.log('Enviando mensagem para LUMI com streaming:', { 
        message, 
        historyLength: conversationHistory.length,
        hasImages: !!images?.length
      });

      // Convert conversation history to OpenAI format
      const formattedHistory = conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Usar fetch direto para streaming
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lumi-chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            conversationHistory: formattedHistory,
            images,
            agentId
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta:', response.status, errorText);
        
        if (response.status === 429) {
          toast.error('Limite de requisições atingido. Aguarde alguns instantes.');
          return { message: 'Ops! Muitas requisições ao mesmo tempo. Aguarde alguns segundos e tente novamente! 💙' };
        } else if (response.status === 402) {
          toast.error('Créditos insuficientes. Adicione créditos ao workspace.');
          return { message: 'Desculpe, estou com créditos insuficientes. Por favor, entre em contato com o suporte! 💙' };
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Processar stream SSE com batching para performance
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';
      let batchBuffer = '';
      let batchTimeout: NodeJS.Timeout | null = null;

      const flushBatch = () => {
        if (batchBuffer && onStreamDelta) {
          onStreamDelta(batchBuffer);
          batchBuffer = '';
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          flushBatch(); // Flush qualquer conteúdo restante
          break;
        }
        
        buffer += decoder.decode(value, { stream: true });
        
        // Processar linhas SSE
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.trim() || line.startsWith(':')) continue;
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                fullResponse += content;
                batchBuffer += content;
                
                // Flush batch a cada 50ms para balance entre performance e fluidez
                if (batchTimeout) clearTimeout(batchTimeout);
                batchTimeout = setTimeout(flushBatch, 50);
              }
            } catch (e) {
              // JSON incompleto - ignorar
            }
          }
        }
      }

      // Processar buffer final se houver conteúdo restante
      if (buffer.trim()) {
        const lines = buffer.split('\n');
        for (let line of lines) {
          if (!line) continue;
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                onStreamDelta?.(content);
              }
            } catch (e) {
              console.error('Erro ao processar buffer final:', e);
            }
          }
        }
      }

      console.log('Resposta completa recebida:', { 
        responseLength: fullResponse.length 
      });

      return {
        message: fullResponse
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
