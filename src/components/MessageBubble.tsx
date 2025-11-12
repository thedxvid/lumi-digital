import { Message } from '@/types/lumi';
import { ImageGallery } from '@/components/chat/ImageGallery';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MessageBubbleProps {
  message: Message;
}

// Function to safely convert any value to a string
function safeStringify(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  if (typeof value === 'object') {
    try {
      // Handle structured objects like the objection-breaking results
      if (value.value && typeof value.value === 'string') {
        let result = value.value;
        
        if (value.empathy) result += `\n\nEmpathy: ${value.empathy}`;
        if (value.reframe) result += `\n\nReframe: ${value.reframe}`;
        if (value.nextStep) result += `\n\nNext Step: ${value.nextStep}`;
        if (value.socialProof) result += `\n\nSocial Proof: ${value.socialProof}`;
        
        return result;
      }
      
      return JSON.stringify(value, null, 2);
    } catch (error) {
      console.error('Error stringifying object:', error);
      return '[Object - cannot display]';
    }
  }
  
  return String(value);
}

// Function to format message content
function formatMessageContent(content: string, isUser: boolean) {
  const safeContent = safeStringify(content);
  
  // Para usuário: apenas retornar o texto limpo
  if (isUser) {
    return safeContent;
  }
  
  // Para IA: substituir **texto** por • texto e * por •
  const formattedContent = safeContent
    .replace(/\*\*(.*?)\*\*/g, '• $1') // Substituir **texto** por • texto
    .replace(/(?<!\*)\*(?!\*)/g, '•'); // Asteriscos simples também viram bullet points
  
  return formattedContent;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  
  const safeContent = safeStringify(message.content);
  const formattedContent = formatMessageContent(safeContent, isUser);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(safeContent);
      setCopied(true);
      toast.success('Mensagem copiada!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar mensagem');
    }
  };
  
  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`max-w-[80%] break-words ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block px-5 py-3 rounded-2xl break-words overflow-hidden relative group ${
          isUser
            ? 'bg-gradient-to-r from-lumi-gold to-lumi-gold-dark text-white shadow-md' // AMARELO DOURADO
            : 'bg-transparent text-foreground' // SEM FUNDO
        }`}>
          {/* Imagens anexadas */}
          {message.images && message.images.length > 0 && (
            <div className={`mb-3 ${message.images.length > 1 ? 'grid grid-cols-1 sm:grid-cols-2 gap-2' : ''}`}>
              {message.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Imagem ${index + 1}`}
                  className="max-w-full h-auto rounded-lg border border-border/20 cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => {
                    const newWindow = window.open();
                    if (newWindow) {
                      newWindow.document.write(`
                        <html>
                          <head><title>Imagem do Chat</title></head>
                          <body style="margin:0;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh;">
                            <img src="${image}" style="max-width:100%;max-height:100%;object-fit:contain;" />
                          </body>
                        </html>
                      `);
                    }
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Imagens geradas pela IA */}
          {message.generatedImages && message.generatedImages.length > 0 && (
            <ImageGallery images={message.generatedImages} />
          )}
          
          {/* Conteúdo de texto */}
          {safeContent && (
            <div className="relative">
              <span 
                className="text-sm leading-relaxed whitespace-pre-wrap break-words block"
              >
                {formattedContent}
              </span>
              
              {/* Botão de copiar - apenas para mensagens da IA */}
              {!isUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 hover:bg-muted/50"
                  onClick={handleCopy}
                  title="Copiar mensagem"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Timestamp */}
        <div className={`text-xs text-muted-foreground mt-1.5 ${
          isUser ? 'text-right' : 'text-left'
        }`}>
          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
}
