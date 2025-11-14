import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { Message } from '@/types/lumi';
import { AgentGalleryWelcome } from './chat/AgentGalleryWelcome';

interface ChatAreaProps {
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (message: string, images?: string[], agentId?: string) => void;
  selectedAgentId: string;
  onAgentChange: (agentId: string) => void;
}

export function ChatArea({ messages, isTyping, onSendMessage, selectedAgentId, onAgentChange }: ChatAreaProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll automático suave
  useEffect(() => {
    if (messages.length > 0 || isTyping) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isTyping]);

  const handleSendMessage = (message: string, images?: string[]) => {
    onSendMessage(message, images, selectedAgentId);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ScrollArea className="flex-1 px-2 sm:px-4 overflow-y-auto" ref={scrollAreaRef}>
        <div className="max-w-full sm:max-w-4xl mx-auto py-4 sm:py-6">
          {messages.length === 0 && !isTyping && (
            <AgentGalleryWelcome 
              selectedAgentId={selectedAgentId}
              onAgentSelect={onAgentChange}
            />
          )}

          {messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message}
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