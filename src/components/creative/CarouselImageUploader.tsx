import { useState, useCallback } from 'react';
import { Upload, X, MoveUp, MoveDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CarouselImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages: number;
}

export function CarouselImageUploader({ images, onImagesChange, maxImages }: CarouselImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast.error(`Você pode adicionar no máximo ${maxImages} imagens`);
      return;
    }

    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} não é uma imagem válida`);
        return false;
      }
      if (file.size > 20 * 1024 * 1024) { // 20MB
        toast.error(`${file.name} é muito grande (máx 20MB)`);
        return false;
      }
      return true;
    });

    try {
      const base64Images = await Promise.all(
        validFiles.map(file => convertToBase64(file))
      );
      onImagesChange([...images, ...base64Images]);
      toast.success(`${base64Images.length} imagem(ns) adicionada(s)`);
    } catch (error) {
      console.error('Error converting images:', error);
      toast.error('Erro ao processar imagens');
    }
  }, [images, maxImages, onImagesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  }, [handleFiles]);

  const removeImage = useCallback((index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  }, [images, onImagesChange]);

  const moveImage = useCallback((index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    const newImages = [...images];
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suas Fotos de Referência (Opcional)</CardTitle>
        <CardDescription>
          Envie suas fotos para usar diretamente nos slides ou como referência para a IA gerar novas imagens mantendo sua identidade visual.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-8
            transition-colors duration-200
            ${isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
            }
          `}
        >
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Upload className="w-12 h-12 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium mb-1">
                Arraste imagens aqui ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WEBP até 20MB • Máximo {maxImages} imagens
              </p>
            </div>
            <Button type="button" variant="outline" onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.multiple = true;
              input.onchange = (e) => handleFileInput(e as any);
              input.click();
            }}>
              Selecionar Imagens
            </Button>
          </div>
        </div>

        {images.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              {images.length} de {maxImages} imagens adicionadas
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Slide ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-border"
                  />
                  <div className="absolute top-2 left-2 bg-background/90 px-2 py-1 rounded text-xs font-medium">
                    Slide {index + 1}
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => moveImage(index, 'up')}
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                    )}
                    {index < images.length - 1 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => moveImage(index, 'down')}
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
