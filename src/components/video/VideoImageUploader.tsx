import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface VideoImageUploaderProps {
  maxImages: 1 | 2;
  onImagesChange: (images: string[]) => void;
  disabled?: boolean;
}

export const VideoImageUploader = ({ maxImages, onImagesChange, disabled }: VideoImageUploaderProps) => {
  const [images, setImages] = useState<string[]>([]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Validate file count
    if (files.length + images.length > maxImages) {
      toast.error(`Você pode fazer upload de no máximo ${maxImages} ${maxImages === 1 ? 'imagem' : 'imagens'}`);
      return;
    }

    // Validate each file
    for (const file of files) {
      // Check file type
      if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
        toast.error(`${file.name}: Formato não suportado. Use PNG, JPG ou WEBP`);
        return;
      }

      // Check file size (20MB)
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name}: Arquivo muito grande. Máximo 20MB`);
        return;
      }
    }

    // Convert files to base64
    const newImages: string[] = [];
    for (const file of files) {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newImages.push(await base64Promise);
    }

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    onImagesChange(updatedImages);
    
    toast.success(`${files.length} ${files.length === 1 ? 'imagem carregada' : 'imagens carregadas'} com sucesso`);
  }, [images, maxImages, onImagesChange]);

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-3">
      <Label>
        Imagens de Entrada {maxImages === 2 && '(até 2 imagens)'}
      </Label>
      
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {images.map((img, index) => (
            <div key={index} className="relative aspect-video bg-muted rounded-lg overflow-hidden group">
              <img 
                src={img} 
                alt={`Imagem ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded text-xs font-medium">
                {maxImages === 2 ? (index === 0 ? 'Primeiro Frame' : 'Último Frame') : 'Imagem'}
              </div>
            </div>
          ))}
        </div>
      )}

      {canAddMore && (
        <div>
          <input
            type="file"
            id="video-image-upload"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            multiple={maxImages === 2}
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
          />
          <label htmlFor="video-image-upload">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={disabled}
              asChild
            >
              <span className="cursor-pointer flex items-center justify-center gap-2">
                <Upload className="h-4 w-4" />
                {images.length === 0 ? (
                  maxImages === 2 ? 'Fazer Upload de Imagens' : 'Fazer Upload de Imagem'
                ) : (
                  'Adicionar Mais Imagens'
                )}
              </span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG ou WEBP - Máximo 20MB por imagem
          </p>
        </div>
      )}

      {images.length === 0 && (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            {maxImages === 2 
              ? 'Faça upload de 1 ou 2 imagens para gerar o vídeo'
              : 'Faça upload de 1 imagem para gerar o vídeo'}
          </p>
        </div>
      )}
    </div>
  );
};
