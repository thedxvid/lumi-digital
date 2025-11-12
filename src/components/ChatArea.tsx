import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { Message } from '@/types/lumi';
import { SuggestedTopics } from './chat/SuggestedTopics';
import { getAgentById } from '@/data/lumiAgents';

interface ChatAreaProps {
  messages: Message[];
  isTyping: boolean;
  isStreaming?: boolean;
  onSendMessage: (message: string, images?: string[], agentId?: string) => void;
  selectedAgentId: string;
  onAgentChange: (agentId: string) => void;
}

export function ChatArea({ messages, isTyping, isStreaming, onSendMessage, selectedAgentId, onAgentChange }: ChatAreaProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll automático otimizado
  useEffect(() => {
    if (messages.length > 0 || isTyping) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [messages, isTyping]);

  const handleSendMessage = (message: string, images?: string[]) => {
    onSendMessage(message, images, selectedAgentId);
  };

  const handleTopicClick = (topic: string) => {
    onSendMessage(topic, undefined, selectedAgentId);
  };

  const selectedAgent = getAgentById(selectedAgentId);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ScrollArea className="flex-1 px-2 sm:px-4 overflow-y-auto" ref={scrollAreaRef}>
        <div className="max-w-full sm:max-w-4xl mx-auto py-4 sm:py-6">
          {messages.length === 0 && !isTyping && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-lumi-gold to-lumi-gold-dark rounded-full flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Olá! Eu sou a LUMI
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Sua luz no caminho do digital. Como posso iluminar seu caminho hoje?
              </p>
              
              <SuggestedTopics agent={selectedAgent!} onTopicClick={handleTopicClick} />
            </div>
          )}

          {messages.map((message, index) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
            />
          ))}

          {isTyping && <TypingIndicator />}
          
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="flex-shrink-0 border-t border-border bg-background">
        <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
      </div>
    </div>
  );
}