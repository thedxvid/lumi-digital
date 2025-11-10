import { AIChatInput } from '@/components/ui/ai-chat-input';

interface ChatInputProps {
  onSendMessage: (message: string, images?: string[]) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  return (
    <div className="border-t border-border bg-background p-4">
      <AIChatInput onSendMessage={onSendMessage} disabled={disabled} />
    </div>
  );
}
