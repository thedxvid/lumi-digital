import { useState } from 'react';
import { Upload, X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ProfileImageUploaderProps {
  image: string | null;
  onImageChange: (image: string | null) => void;
}

export function ProfileImageUploader({ image, onImageChange }: ProfileImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!validTypes.includes(file.type)) {
      alert('Apenas arquivos JPG, PNG e WEBP são permitidos');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 10MB');
      return;
    }

    try {
      const base64 = await convertToBase64(file);
      onImageChange(base64);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      alert('Erro ao processar imagem');
    }
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

  return (
    <div className="space-y-4">
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
            className="w-full h-auto rounded-lg border border-border"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setShowPreview(true)}
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

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <img src={image || ''} alt="Preview ampliado" className="w-full h-auto" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
