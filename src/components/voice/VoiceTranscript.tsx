import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceTranscriptProps {
  currentTranscript: string;
  conversationTranscripts: Array<{
    id: string;
    content: string;
    timestamp: number;
    speaker: 'user' | 'assistant';
  }>;
  onSaveConversation: () => void;
  onClearTranscripts: () => void;
}

export function VoiceTranscript({
  currentTranscript,
  conversationTranscripts,
  onSaveConversation,
  onClearTranscripts
}: VoiceTranscriptProps) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Typewriter effect for current transcript
  useEffect(() => {
    if (!currentTranscript) {
      setDisplayText('');
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    setDisplayText('');
    
    let index = 0;
    const typeInterval = setInterval(() => {
      setDisplayText(currentTranscript.slice(0, index + 1));
      index++;
      
      if (index >= currentTranscript.length) {
        clearInterval(typeInterval);
        setIsTyping(false);
      }
    }, 30);

    return () => clearInterval(typeInterval);
  }, [currentTranscript]);

  const handleCopyTranscript = () => {
    const fullTranscript = conversationTranscripts
      .map(t => `${t.speaker === 'assistant' ? 'LUMI' : 'Usuário'}: ${t.content}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(fullTranscript);
    toast.success('Transcrição copiada!');
  };

  return (
    <div className="space-y-4">
      {/* Real-time transcript display */}
      <Card className="p-4 bg-gradient-to-br from-lumi-gold/5 to-lumi-gold-light/5 border-lumi-gold/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <div className="w-2 h-2 bg-lumi-gold rounded-full animate-pulse" />
            Transcrição em Tempo Real
          </h3>
          <div className="flex gap-2">
            {conversationTranscripts.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyTranscript}
                  className="h-8"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSaveConversation}
                  className="h-8 bg-lumi-gold/10 border-lumi-gold/20 hover:bg-lumi-gold/20"
                >
                  <Save className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearTranscripts}
                  className="h-8"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="min-h-[60px] max-h-[200px] overflow-y-auto">
          {displayText ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-lumi-gold">LUMI:</span> {displayText}
              {isTyping && <span className="animate-pulse">|</span>}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/60 italic">
              A transcrição aparecerá aqui quando a LUMI começar a falar...
            </p>
          )}
        </div>
      </Card>

      {/* Conversation history */}
      {conversationTranscripts.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 text-foreground">Histórico da Conversa</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {conversationTranscripts.map((transcript) => (
              <div 
                key={transcript.id}
                className={`p-3 rounded-lg ${
                  transcript.speaker === 'assistant' 
                    ? 'bg-lumi-gold/10 border border-lumi-gold/20' 
                    : 'bg-lumi-blue/10 border border-lumi-blue/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${
                    transcript.speaker === 'assistant' ? 'text-lumi-gold' : 'text-lumi-blue'
                  }`}>
                    {transcript.speaker === 'assistant' ? 'LUMI' : 'Usuário'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(transcript.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-foreground">{transcript.content}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}