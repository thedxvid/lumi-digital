import { useState } from 'react';
import { Upload, X, ZoomIn, Plus, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ProfileImageUploaderProps {
  image: string | null;
  onImageChange: (image: string | null) => void;
  additionalImages?: string[];
  onAdditionalImagesChange?: (images: string[]) => void;
  maxAdditionalImages?: number;
}

export function ProfileImageUploader({ 
  image, 
  onImageChange, 
  additionalImages = [],
  onAdditionalImagesChange,
  maxAdditionalImages = 5
}: ProfileImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingAdditional, setIsDraggingAdditional] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!validTypes.includes(file.type)) {
      toast.error('Apenas arquivos JPG, PNG e WEBP são permitidos');
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 10MB');
      return false;
    }

    return true;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!validateFile(file)) return;

    try {
      const base64 = await convertToBase64(file);
      onImageChange(base64);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      toast.error('Erro ao processar imagem');
    }
  };

  const handleAdditionalFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !onAdditionalImagesChange) return;

    const remainingSlots = maxAdditionalImages - additionalImages.length;
    if (remainingSlots <= 0) {
      toast.error(`Máximo de ${maxAdditionalImages} imagens adicionais atingido`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const newImages: string[] = [];

    for (const file of filesToProcess) {
      if (!validateFile(file)) continue;
      
      try {
        const base64 = await convertToBase64(file);
        newImages.push(base64);
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
      }
    }

    if (newImages.length > 0) {
      onAdditionalImagesChange([...additionalImages, ...newImages]);
      toast.success(`${newImages.length} imagem(ns) adicionada(s)`);
    }
  };

  const removeAdditionalImage = (index: number) => {
    if (!onAdditionalImagesChange) return;
    const newImages = additionalImages.filter((_, i) => i !== index);
    onAdditionalImagesChange(newImages);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleAdditionalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAdditional(false);
    handleAdditionalFiles(e.dataTransfer.files);
  };

  const openPreview = (img: string) => {
    setPreviewImage(img);
    setShowPreview(true);
  };

  return (
    <div className="space-y-6">
      {/* Screenshot Principal do Perfil */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Screenshot do Perfil (obrigatório)
        </label>
        
        {!image ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-all
              ${isDragging 
                ? 'border-primary bg-primary/10' 
                : 'border-border hover:border-primary/50'
              }
            `}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Arraste o screenshot do perfil aqui ou clique para selecionar
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('profile-image-input')?.click()}
            >
              Selecionar Imagem
            </Button>
            <input
              id="profile-image-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <p className="text-xs text-muted-foreground mt-4">
              JPG, PNG ou WEBP (máx. 10MB)
            </p>
          </div>
        ) : (
          <div className="relative group">
            <img 
              src={image} 
              alt="Preview do perfil" 
              className="w-full h-auto rounded-lg border border-border max-h-64 object-contain bg-muted"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => openPreview(image)}
              >
                <ZoomIn className="h-4 w-4 mr-2" />
                Ampliar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => onImageChange(null)}
              >
                <X className="h-4 w-4 mr-2" />
                Remover
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Imagens Adicionais */}
      {onAdditionalImagesChange && (
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <ImagePlus className="h-4 w-4" />
            Imagens de Posts/Conteúdo (opcional)
          </label>
          <p className="text-xs text-muted-foreground">
            Adicione screenshots de posts, stories ou destaques para uma análise mais completa
          </p>

          {/* Grid de imagens adicionais */}
          <div className="grid grid-cols-3 gap-2">
            {additionalImages.map((img, index) => (
              <div key={index} className="relative group aspect-square">
                <img 
                  src={img} 
                  alt={`Imagem adicional ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-border cursor-pointer"
                  onClick={() => openPreview(img)}
                />
                <button
                  type="button"
                  onClick={() => removeAdditionalImage(index)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            
            {/* Botão de adicionar mais */}
            {additionalImages.length < maxAdditionalImages && (
              <div
                onDrop={handleAdditionalDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingAdditional(true); }}
                onDragLeave={() => setIsDraggingAdditional(false)}
                onClick={() => document.getElementById('additional-images-input')?.click()}
                className={`
                  aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all
                  ${isDraggingAdditional 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }
                `}
              >
                <Plus className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground text-center px-2">
                  {additionalImages.length}/{maxAdditionalImages}
                </span>
              </div>
            )}
          </div>

          <input
            id="additional-images-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleAdditionalFiles(e.target.files)}
          />
        </div>
      )}

      {/* Modal de Preview */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <img src={previewImage || ''} alt="Preview ampliado" className="w-full h-auto" />
        </DialogContent>
      </Dialog>
    </div>
  );
}