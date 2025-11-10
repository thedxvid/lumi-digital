import { useState } from 'react';
import { Download, Maximize2, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ImageGalleryProps {
  images: string[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `lumi-image-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Imagem baixada com sucesso!');
  };

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        {images.map((image, index) => (
          <div 
            key={index} 
            className="relative group rounded-lg overflow-hidden border border-border bg-accent/30"
          >
            <img
              src={image}
              alt={`Imagem gerada ${index + 1}`}
              className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelectedImage(image)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(image);
                }}
                className="gap-2"
              >
                <Maximize2 className="w-4 h-4" />
                Ampliar
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(image, index);
                }}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Baixar
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl p-0">
          <div className="relative">
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-4 h-4" />
            </Button>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Imagem ampliada"
                className="w-full h-auto"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
