
import { Message } from '@/types/lumi';
import { Lightbulb, User } from 'lucide-react';
import { ImageGallery } from '@/components/chat/ImageGallery';

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

// Function to convert asterisks to bold text
function formatMessageContent(content: string) {
  // Ensure content is always a string
  const safeContent = safeStringify(content);
  
  // Replace **text** with <strong>text</strong>
  const formattedContent = safeContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  return formattedContent;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  
  // Ensure message.content is always a string before processing
  const safeContent = safeStringify(message.content);
  const formattedContent = formatMessageContent(safeContent);
  
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-6`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser 
          ? 'bg-primary' 
          : 'bg-gradient-to-br from-lumi-gold to-lumi-gold-dark'
      }`}>
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Lightbulb className="h-4 w-4 text-white" />
        )}
      </div>
      
      <div className={`max-w-[80%] break-words ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block px-4 py-3 rounded-lg break-words overflow-hidden ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground border border-border'
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
                    // Abrir imagem em nova aba para visualização maior
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
            <span 
              className="text-sm leading-relaxed whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: formattedContent }}
            />
          )}
        </div>
        
        <div className={`text-xs text-muted-foreground mt-1 ${
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
