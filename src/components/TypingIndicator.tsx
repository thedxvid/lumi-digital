import { Lightbulb } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-6">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-lumi-gold to-lumi-gold-dark">
        <Lightbulb className="h-4 w-4 text-white" />
      </div>
      
      <div className="max-w-[80%]">
        <div className="inline-block px-4 py-3 rounded-lg bg-lumi-chat-ai text-foreground border border-border">
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">LUMI está pensando</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-lumi-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-1 bg-lumi-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 h-1 bg-lumi-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}