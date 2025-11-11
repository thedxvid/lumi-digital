import { Download, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from '@/components/ui/carousel';
import { CarouselImage } from '@/hooks/useCarousel';

interface CarouselCardProps {
  id: string;
  images: CarouselImage[];
  prompt: string;
  createdAt: string;
  onDelete: (id: string) => void;
}

export function CarouselCard({ 
  id, 
  images, 
  prompt, 
  createdAt, 
  onDelete 
}: CarouselCardProps) {
  const handleDownloadAll = async () => {
    for (let i = 0; i < images.length; i++) {
      const link = document.createElement('a');
      link.href = images[i].url;
      link.download = `carrossel-${id}-imagem-${i + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <Card className="overflow-hidden group">
      <div className="relative">
        <Carousel className="w-full">
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={index}>
                <div className="aspect-square relative">
                  <img
                    src={image.url}
                    alt={image.description}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                    {index + 1}/{images.length}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
        
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
          <Button
            size="icon"
            variant="secondary"
            onClick={handleDownloadAll}
            className="rounded-full pointer-events-auto"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            onClick={() => onDelete(id)}
            className="rounded-full pointer-events-auto"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-4 space-y-2">
        <p className="text-sm line-clamp-2">{prompt}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{images.length} imagens</span>
          <span>{format(new Date(createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
        </div>
      </div>
    </Card>
  );
}
