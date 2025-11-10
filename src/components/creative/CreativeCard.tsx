import { Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CreativeCardProps {
  id: string;
  generatedImage: string;
  prompt: string;
  createdAt: string;
  onDelete: (id: string) => void;
}

export function CreativeCard({ 
  id, 
  generatedImage, 
  prompt, 
  createdAt, 
  onDelete 
}: CreativeCardProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `criativo-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="overflow-hidden group">
      <div className="relative aspect-square">
        <img
          src={generatedImage}
          alt={prompt}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="icon"
            variant="secondary"
            onClick={handleDownload}
            className="rounded-full"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            onClick={() => onDelete(id)}
            className="rounded-full"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <p className="text-sm line-clamp-2">{prompt}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>
    </Card>
  );
}