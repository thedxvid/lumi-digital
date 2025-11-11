import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { Message } from '@/types/lumi';
import { AgentSelector } from './chat/AgentSelector';
import { SuggestedTopics } from './chat/SuggestedTopics';
import { getDefaultAgent, getAgentById } from '@/data/lumiAgents';

interface ChatAreaProps {
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (message: string, images?: string[], agentId?: string) => void;
}

export function ChatArea({ messages, isTyping, onSendMessage }: ChatAreaProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [selectedAgentId, setSelectedAgentId] = useState(getDefaultAgent().id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (message: string, images?: string[]) => {
    onSendMessage(message, images, selectedAgentId);
  };

  const handleTopicClick = (topic: string) => {
    onSendMessage(topic, undefined, selectedAgentId);
  };

  const selectedAgent = getAgentById(selectedAgentId) || getDefaultAgent();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ScrollArea className="flex-1 px-2 sm:px-4" ref={scrollAreaRef}>
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
              
              <AgentSelector selectedAgentId={selectedAgentId} onAgentChange={setSelectedAgentId} />
              
              <SuggestedTopics agent={selectedAgent} onTopicClick={handleTopicClick} />
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isTyping && <TypingIndicator />}
          
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
    </div>
  );
}