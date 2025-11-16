import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share2, X, RefreshCw, Type, Clapperboard } from "lucide-react";
import { toast } from "sonner";
import { TextOverlayForm, type TextOverlayConfig } from "./TextOverlayForm";

interface CreativeResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onRegenerate?: () => void;
  suggestedCopy?: {
    headline: string;
    secondary: string;
    cta: string;
  };
  onApplyText?: (config: TextOverlayConfig) => Promise<void>;
  applyingText?: boolean;
}

export function CreativeResultModal({ 
  open, 
  onOpenChange, 
  imageUrl,
  onRegenerate,
  suggestedCopy,
  onApplyText,
  applyingText
}: CreativeResultModalProps) {
  const [showTextEditor, setShowTextEditor] = useState(false);
  const navigate = useNavigate();

  const handleAnimateImage = () => {
    // Navigate to video generator with image pre-loaded
    navigate('/app/video-generator', {
      state: { 
        preloadedImage: imageUrl,
        mode: 'image-to-video'
      }
    });
    toast.success('Redirecionando para o gerador de vídeos...');
  };

  const handleApplyText = async (config: TextOverlayConfig) => {
    if (onApplyText) {
      await onApplyText(config);
      setShowTextEditor(false);
    }
  };
  
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `criativo-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Criativo baixado com sucesso!');
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error('Erro ao baixar criativo');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Criativo Gerado',
          text: 'Confira este criativo que criei!',
          url: imageUrl
        });
      } else {
        await navigator.clipboard.writeText(imageUrl);
        toast.success('Link copiado para área de transferência!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Criativo Gerado com Sucesso! 🎨</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview da Imagem */}
          <div className="relative rounded-lg overflow-hidden border bg-muted">
            <img 
              src={imageUrl} 
              alt="Criativo gerado" 
              className="w-full h-auto"
            />
          </div>

          {/* Editor de Texto */}
          {showTextEditor && onApplyText ? (
            <TextOverlayForm 
              suggestedCopy={suggestedCopy}
              onApply={handleApplyText}
              loading={applyingText}
            />
          ) : (
            <>
              {/* Ações Principais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {onApplyText && (
                  <Button 
                    onClick={() => setShowTextEditor(true)} 
                    variant="default"
                    size="lg"
                  >
                    <Type className="w-4 h-4 mr-2" />
                    Adicionar Texto
                  </Button>
                )}
                <Button 
                  onClick={handleAnimateImage}
                  variant="default"
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Clapperboard className="w-4 h-4 mr-2" />
                  Animar Imagem
                </Button>
              </div>

              {/* Ações Secundárias */}
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleDownload} variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar
                </Button>
                <Button onClick={handleShare} variant="outline" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
                {onRegenerate && (
                  <Button onClick={onRegenerate} variant="outline" className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerar
                  </Button>
                )}
                <Button 
                  onClick={() => onOpenChange(false)} 
                  variant="secondary"
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Fechar
                </Button>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                O criativo também foi salvo na aba "Resultados" para você acessar depois.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
