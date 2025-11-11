import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share2, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface CreativeResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onRegenerate?: () => void;
}

export function CreativeResultModal({ 
  open, 
  onOpenChange, 
  imageUrl,
  onRegenerate 
}: CreativeResultModalProps) {
  
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

          {/* Ações */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleDownload} className="flex-1">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
