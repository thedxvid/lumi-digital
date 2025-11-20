import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2, Eye, RefreshCw, Edit } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import type { CarouselHistoryItem } from '@/hooks/useCarousel';
import { toast } from 'sonner';

interface CarouselResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carousel: CarouselHistoryItem | null;
  onRegenerate?: () => void;
  onEdit?: () => void;
}

export function CarouselResultModal({ 
  open, 
  onOpenChange, 
  carousel,
  onRegenerate,
  onEdit 
}: CarouselResultModalProps) {
  if (!carousel) return null;

  const handleDownloadAll = async () => {
    try {
      for (let i = 0; i < carousel.images.length; i++) {
        const image = carousel.images[i];
        // Download the base image without text
        const imageUrl = image.url;
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `carousel-${carousel.id}-slide-${i + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        if (i < carousel.images.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      toast.success('Todas as imagens foram baixadas! 📥');
    } catch (error) {
      console.error('Error downloading images:', error);
      toast.error('Erro ao baixar imagens');
    }
  };

  const handleShare = () => {
    const shareText = `Confira meu carrossel: ${carousel.prompt}`;
    if (navigator.share) {
      navigator.share({
        title: 'Carrossel Gerado',
        text: shareText,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Texto copiado para a área de transferência!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            🎉 Carrossel Gerado com Sucesso!
          </DialogTitle>
          <DialogDescription>
            {carousel.prompt}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Carousel Preview */}
          <div className="relative rounded-lg border border-border bg-muted/30 p-8">
            <Carousel className="w-full">
              <CarouselContent>
                {carousel.images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="space-y-4">
                      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-background">
                        <img
                          src={image.url}
                          alt={image.description}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Slide {index + 1} de {carousel.images.length}</p>
                        <p className="text-sm text-muted-foreground">{image.description}</p>
                        {image.copy && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <p className="font-semibold">{image.copy.headline}</p>
                            {image.copy.secondary && <p>{image.copy.secondary}</p>}
                            {image.copy.cta && <p className="mt-1 font-medium">{image.copy.cta}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Button
              variant="outline"
              onClick={handleDownloadAll}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar Todos
            </Button>
            
            <Button
              variant="outline"
              onClick={handleShare}
              className="w-full"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>

            {onRegenerate && (
              <Button
                variant="outline"
                onClick={onRegenerate}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerar
              </Button>
            )}

            {onEdit && (
              <Button
                variant="outline"
                onClick={onEdit}
                className="w-full"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                onOpenChange(false);
                // Will show in the Resultados tab
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver nos Resultados
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
