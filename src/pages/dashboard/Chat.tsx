
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ChatArea } from '@/components/ChatArea';
import { ChatHistory } from '@/components/dashboard/ChatHistory';
import { useLumiChat } from '@/hooks/useLumiChat';
import { useLumiStore } from '@/hooks/useLumiStore';
import { Message, Conversation } from '@/types/lumi';
import { Button } from '@/components/ui/button';
import { MessageSquare, X } from 'lucide-react';

export default function Chat() {
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const [showHistory, setShowHistory] = useState(false);
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
        updateConversation(currentConversationId, {
          messages: messages,
          updatedAt: Date.now()
        });
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []); // SEM dependências - só roda na montagem/desmontagem

  // Handle incoming prompt from other pages (like ModuleRunner)
  useEffect(() => {
    if (location.state?.prompt) {
      const prompt = location.state.prompt;
      handleSendMessage(prompt);
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
    };

    let conversationId = currentConversationId;

    // If no current conversation, create a new one
    if (!conversationId) {
      const newConversation = createNewConversation(userMessage);
      const savedConversation = await addConversation(newConversation);
      conversationId = savedConversation?.id || newConversation.id;
      setCurrentConversationId(conversationId);
      setMessages([userMessage]);
      lastSyncedConversationRef.current = conversationId; // Atualizar ref para nova conversa
    } else {
      // Add message to existing conversation
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      await updateConversation(conversationId, {
        messages: updatedMessages,
        updatedAt: Date.now()
      });
    }

    try {
      const response = await sendMessage(content, messages, images, agentId);
      
      if (response) {
        const assistantMessage: Message = {
          id: generateUUID(),
          content: response.message,
          role: 'assistant',
          timestamp: Date.now(),
          generatedImages: response.generatedImages,
          agentId,
        };

        // Use callback to ensure we have the latest state
        setMessages(prev => {
          const updatedMessages = [...prev, assistantMessage];
          if (conversationId) {
            updateConversation(conversationId, {
              messages: updatedMessages,
              updatedAt: Date.now()
            });
          }
          return updatedMessages;
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: generateUUID(),
        content: 'Desculpe, encontrei um problema técnico. Pode tentar novamente? 💙',
        role: 'assistant',
        timestamp: Date.now(),
      };

      // Use callback to ensure we have the latest state
      setMessages(prev => {
        const updatedMessages = [...prev, errorMessage];
        if (conversationId) {
          updateConversation(conversationId, {
            messages: updatedMessages,
            updatedAt: Date.now()
          });
        }
        return updatedMessages;
      });
    }
  };

  const handleSelectConversation = (id: string) => {
    // Salvar conversa atual ANTES de trocar
    if (currentConversationId && messages.length > 0) {
      updateConversation(currentConversationId, {
        messages: messages,
        updatedAt: Date.now()
      });
    }
    
    // Agora carregar a nova conversa
    const conversation = conversations.find(conv => conv.id === id);
    if (conversation) {
      setCurrentConversationId(id);
      setMessages(conversation.messages);
      setShowHistory(false);
      lastSyncedConversationRef.current = id; // Atualizar ref para nova conversa
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
    <div className="flex flex-row h-[calc(100vh-8rem)] md:h-[calc(100vh-3rem)] -mx-4 -my-4 md:-mx-6 md:-my-6 lg:-mx-10 lg:-my-10 md:mt-[-1.5rem] md:mb-[-1.5rem]">
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
          <ChatHistory
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
          />
        </div>
      )}

      {/* Chat History Sidebar - Desktop */}
      <div className="hidden md:flex md:w-80 border-r border-border bg-muted/20 relative z-20 flex-shrink-0">
        <div className="flex flex-col w-full h-full">
          <div className="p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Conversas</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewChat}
                className="text-primary hover:text-primary/80"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
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
      <div className="flex-1 flex flex-col relative z-0 min-w-0 overflow-hidden h-full">
        {/* Mobile Header with History Button */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h1 className="text-lg font-semibold">Chat LUMI</h1>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewChat}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(true)}
            >
              Histórico
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatArea
            messages={messages}
            isTyping={loading}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </div>
  );
}
