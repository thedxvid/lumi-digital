
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ChatArea } from '@/components/ChatArea';
import { ChatHistory } from '@/components/dashboard/ChatHistory';
import { AgentSelectorCompact } from '@/components/chat/AgentSelectorCompact';
import { ProductSelector } from '@/components/chat/ProductSelector';
import { useLumiChat } from '@/hooks/useLumiChat';
import { useLumiStore } from '@/hooks/useLumiStore';
import { Message, Conversation } from '@/types/lumi';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, Download } from 'lucide-react';
import { getDefaultAgent, LUMI_AGENTS } from '@/data/lumiAgents';
import { toast } from '@/hooks/use-toast';
import { ConversationExporter } from '@/components/conversation/ConversationExporter';

export default function Chat() {
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const [showHistory, setShowHistory] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(getDefaultAgent().id);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();
  const { loading, sendMessage } = useLumiChat();
  const { conversations, addConversation, updateConversation, deleteConversation, generateUUID } = useLumiStore();
  const lastSyncedConversationRef = useRef<string | undefined>();

  // Sync messages with store when conversation changes
  useEffect(() => {
    // Apenas sincronizar se a conversa mudou
    if (currentConversationId && lastSyncedConversationRef.current !== currentConversationId) {
      const conversation = conversations.find(conv => conv.id === currentConversationId);
      if (conversation) {
        console.log('🔄 Sincronizando mensagens do store');
        setMessages(conversation.messages);
        lastSyncedConversationRef.current = currentConversationId;
      }
    }
  }, [currentConversationId, conversations]);

  // Salvar conversa ao fechar/recarregar a página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentConversationId && messages.length > 0) {
        // Salvar síncronamente no localStorage antes de sair
        const conversation = conversations.find(conv => conv.id === currentConversationId);
        if (conversation) {
          const updated = {
            ...conversation,
            messages: messages,
            updatedAt: Date.now()
          };
          localStorage.setItem('lumi-store', JSON.stringify({
            conversations: conversations.map(c => c.id === currentConversationId ? updated : c),
            settings: {}
          }));
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentConversationId, messages, conversations]);

  // Salvamento automático periódico
  useEffect(() => {
    if (currentConversationId && messages.length > 0) {
      const timer = setInterval(() => {
        updateConversation(currentConversationId, {
          messages: messages,
          updatedAt: Date.now()
        });
      }, 5000); // Salvar a cada 5 segundos
      
      return () => clearInterval(timer);
    }
  }, [currentConversationId, messages]);

  // Handle incoming prompt from other pages (like ModuleRunner)
  useEffect(() => {
    if (location.state?.prompt) {
      const prompt = location.state.prompt;
      handleSendMessage(prompt);
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Create new conversation when agent changes
  useEffect(() => {
    if (selectedAgentId && messages.length > 0) {
      const currentAgent = messages[0]?.agentId;
      if (currentAgent && currentAgent !== selectedAgentId) {
        handleNewChat();
        const agentName = LUMI_AGENTS.find(a => a.id === selectedAgentId)?.name || 'novo agente';
        toast({
          title: `Iniciando nova conversa com ${agentName}`,
          description: "Cada agente mantém sua própria conversa separada.",
        });
      }
    }
  }, [selectedAgentId]);

  // Load conversation from history navigation
  useEffect(() => {
    if (location.state?.conversationId) {
      const conversationId = location.state.conversationId;
      const conversation = conversations.find(conv => conv.id === conversationId);
      
      if (conversation) {
        console.log(`📂 Carregando conversa do histórico: ${conversation.title}`);
        handleSelectConversation(conversationId);
      } else {
        toast({
          title: "Conversa não encontrada",
          description: "A conversa que você tentou abrir não existe mais.",
          variant: "destructive"
        });
      }
      
      // Clear state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state, conversations]);

  const createNewConversation = (firstMessage: Message): Conversation => {
    const conversationId = generateUUID();
    const conversation: Conversation = {
      id: conversationId,
      title: firstMessage.content.slice(0, 50) + (firstMessage.content.length > 50 ? '...' : ''),
      messages: [firstMessage],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    return conversation;
  };

  const handleSendMessage = async (content: string, images?: string[], agentId?: string) => {
    const userMessage: Message = {
      id: generateUUID(),
      content,
      role: 'user',
      timestamp: Date.now(),
      images,
      agentId,
      productId: selectedProductId,
    };

    let conversationId = currentConversationId;

    // If no current conversation, create a new one
    if (!conversationId) {
      const newConversation = createNewConversation(userMessage);
      const savedConversation = await addConversation(newConversation);
      conversationId = savedConversation?.id || newConversation.id;
      setCurrentConversationId(conversationId);
      setMessages([userMessage]);
      lastSyncedConversationRef.current = conversationId;
    } else {
      // Add message to existing conversation
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      
      // ⚠️ SALVAR IMEDIATAMENTE - NÃO ESPERAR 5 SEGUNDOS!
      await updateConversation(conversationId, {
        messages: updatedMessages,
        updatedAt: Date.now()
      });
      
      console.log('💾 Mensagem do usuário salva imediatamente');
    }

    try {
      // ⚠️ IMPORTANTE: Usar updatedMessages (com a mensagem do usuário) em vez de messages
      const messagesForApi = conversationId 
        ? [...messages, userMessage]
        : [userMessage];
      
      const response = await sendMessage(
        content, 
        messagesForApi, 
        images, 
        agentId,
        selectedProductId
      );
      
      if (response) {
        const assistantMessage: Message = {
          id: generateUUID(),
          content: response.message,
          role: 'assistant',
          timestamp: Date.now(),
          generatedImages: response.generatedImages,
          agentId,
        };

        // Usar o array atualizado com AMBAS as mensagens
        const finalMessages = [...messagesForApi, assistantMessage];
        setMessages(finalMessages);
        
        if (conversationId) {
          await updateConversation(conversationId, {
            messages: finalMessages,
            updatedAt: Date.now()
          });
          console.log('💾 Resposta da IA salva');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSelectConversation = (id: string) => {
    // Salvar conversa atual ANTES de trocar
    if (currentConversationId && messages.length > 0) {
      updateConversation(currentConversationId, {
        messages: messages,
        updatedAt: Date.now()
      });
      console.log('💾 Salvando conversa atual antes de trocar');
    }
    
    // Agora carregar a nova conversa
    const conversation = conversations.find(conv => conv.id === id);
    if (conversation) {
      console.log(`📂 Carregando conversa "${conversation.title}" com ${conversation.messages.length} mensagens`);
      setCurrentConversationId(id);
      setMessages(conversation.messages);
      setShowHistory(false);
      lastSyncedConversationRef.current = id;
    }
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id);
    if (currentConversationId === id) {
      setCurrentConversationId(undefined);
      setMessages([]);
    }
  };

  const handleNewChat = () => {
    // Salvar conversa atual antes de criar nova
    if (currentConversationId && messages.length > 0) {
      updateConversation(currentConversationId, {
        messages: messages,
        updatedAt: Date.now()
      });
    }
    
    setCurrentConversationId(undefined);
    setMessages([]);
    setShowHistory(false);
    lastSyncedConversationRef.current = undefined; // Reset ref
  };

  return (
    <div className="flex flex-row h-screen w-full overflow-hidden md:-mt-8">
      {/* Chat History Sidebar - Mobile */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-background md:hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Histórico de Conversas</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Agent selector mobile */}
          <div className="p-4 border-b space-y-4">
            <AgentSelectorCompact
              selectedAgentId={selectedAgentId}
              onAgentChange={setSelectedAgentId}
            />
            <ProductSelector
              selectedProductId={selectedProductId}
              onProductChange={setSelectedProductId}
            />
          </div>
          
          <ChatHistory
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
          />
        </div>
      )}

      {/* Chat History Sidebar - Desktop */}
      <div className="hidden md:flex md:w-80 border-r border-border bg-muted/20 relative z-20 flex-shrink-0 h-full">
        <div className="flex flex-col w-full h-full">
          <div className="p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h2 className="text-base font-semibold truncate">Conversas</h2>
              <div className="flex gap-1 flex-shrink-0">
                {currentConversationId && messages.length > 0 && (
                  <ConversationExporter 
                    conversation={{
                      id: currentConversationId,
                      title: conversations.find(c => c.id === currentConversationId)?.title || 'Conversa Atual',
                      messages: messages,
                      createdAt: conversations.find(c => c.id === currentConversationId)?.createdAt || Date.now(),
                      updatedAt: Date.now(),
                      agentId: selectedAgentId
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Exportar conversa"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </ConversationExporter>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewChat}
                  className="text-primary hover:text-primary/80 h-8 w-8"
                  title="Novo chat"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Agent selector desktop */}
          <div className="p-4 border-b border-border flex-shrink-0 space-y-4">
            <AgentSelectorCompact
              selectedAgentId={selectedAgentId}
              onAgentChange={setSelectedAgentId}
            />
            <ProductSelector
              selectedProductId={selectedProductId}
              onProductChange={setSelectedProductId}
            />
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <ChatHistory
              conversations={conversations}
              currentConversationId={currentConversationId}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={handleDeleteConversation}
            />
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-0 min-w-0 overflow-hidden h-screen">
        {/* Mobile Agent Selector & Actions - Sticky */}
        <div className="md:hidden sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border flex-shrink-0 shadow-sm">
          <div className="flex items-center justify-between p-3 border-b border-border/50">
            <h1 className="text-base font-semibold">Chat LUMI</h1>
            <div className="flex gap-2">
              {currentConversationId && messages.length > 0 && (
                <ConversationExporter 
                  conversation={{
                    id: currentConversationId,
                    title: conversations.find(c => c.id === currentConversationId)?.title || 'Conversa Atual',
                    messages: messages,
                    createdAt: conversations.find(c => c.id === currentConversationId)?.createdAt || Date.now(),
                    updatedAt: Date.now(),
                    agentId: selectedAgentId
                  }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </ConversationExporter>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewChat}
                className="h-8 gap-1"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">Novo</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(true)}
                className="h-8 text-xs"
              >
                Histórico
              </Button>
            </div>
          </div>
          <div className="p-3">
            <AgentSelectorCompact
              selectedAgentId={selectedAgentId}
              onAgentChange={setSelectedAgentId}
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatArea
            messages={messages}
            isTyping={loading}
            onSendMessage={handleSendMessage}
            selectedAgentId={selectedAgentId}
            onAgentChange={setSelectedAgentId}
          />
        </div>
      </div>
    </div>
  );
}
