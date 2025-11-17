import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Heart, Play, Clock, Maximize2, Zap, AlertCircle, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { VideoHistoryItem } from '@/types/video';
import { VideoPlayer } from './VideoPlayer';
import { Skeleton } from '@/components/ui/skeleton';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface VideoHistoryGalleryProps {
  history: VideoHistoryItem[];
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, currentValue: boolean) => void;
  onViewFullscreen: (item: VideoHistoryItem) => void;
}

const VideoCard = ({ item, onDelete, onToggleFavorite, onViewFullscreen }: {
  item: VideoHistoryItem;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, currentValue: boolean) => void;
  onViewFullscreen: (item: VideoHistoryItem) => void;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const entry = useIntersectionObserver(cardRef, {
    threshold: 0.25,
    rootMargin: '100px',
    freezeOnceVisible: true,
  });

  const isVisible = !!entry?.isIntersecting;

  const getAPIDisplayName = (apiName?: string) => {
    switch (apiName) {
      case 'fal_veo3_fast':
        return 'Veo 3 Fast';
      case 'fal_veo31':
        return 'Veo 3.1';
      case 'fal_hunyuan':
        return 'Hunyuan';
      case 'fal_wan_fast':
        return 'Wan Fast';
      default:
        return apiName || 'Veo 3 Fast';
    }
  };

  const handleDownload = async (url: string, id: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `video-${id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading video:', error);
    }
  };

  return (
    <Card ref={cardRef} className="overflow-hidden group">
      <div className="relative aspect-video bg-muted">
        {!isVisible ? (
          <Skeleton className="w-full h-full" />
        ) : hasError ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">Erro ao carregar vídeo</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
              }}
            >
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <Skeleton className="w-full h-full" />
              </div>
            )}
            <video
              src={item.video_url}
              className="w-full h-full object-cover cursor-pointer"
              preload="metadata"
              onLoadedMetadata={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
              onClick={(e) => {
                const video = e.currentTarget;
                if (video.paused) {
                  video.play();
                } else {
                  video.pause();
                }
              }}
            />
          </>
        )}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onViewFullscreen(item)}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <p className="text-sm line-clamp-2 font-medium">
            {item.prompt}
          </p>
          
          <div className="flex flex-wrap gap-1">
            {item.api_used && (
              <Badge variant="default" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                {getAPIDisplayName(item.api_used)}
              </Badge>
            )}
            {item.aspect_ratio && (
              <Badge variant="secondary" className="text-xs">
                {item.aspect_ratio}
              </Badge>
            )}
            {item.duration && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {item.duration}
              </Badge>
            )}
            {item.resolution && (
              <Badge variant="secondary" className="text-xs">
                {item.resolution}
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {format(new Date(item.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleFavorite(item.id, item.is_favorite || false)}
            className={item.is_favorite ? 'text-red-500' : ''}
          >
            <Heart className={`h-4 w-4 ${item.is_favorite ? 'fill-current' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDownload(item.video_url, item.id)}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(item.id)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const VideoHistoryGallery = ({
  history,
  onDelete,
  onToggleFavorite,
  onViewFullscreen,
}: VideoHistoryGalleryProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  const filteredHistory = filter === 'favorites'
    ? history.filter(item => item.is_favorite)
    : history;

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <Play className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">Nenhum vídeo gerado ainda</p>
          <p className="text-sm mt-1">Crie seu primeiro vídeo na aba "Criar"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          Todos ({history.length})
        </Button>
        <Button
          variant={filter === 'favorites' ? 'default' : 'outline'}
          onClick={() => setFilter('favorites')}
          size="sm"
        >
          <Heart className="h-4 w-4 mr-1" />
          Favoritos ({history.filter(h => h.is_favorite).length})
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHistory.map((item) => (
          <VideoCard
            key={item.id}
            item={item}
            onDelete={setDeleteId}
            onToggleFavorite={onToggleFavorite}
            onViewFullscreen={onViewFullscreen}
          />
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este vídeo do histórico? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
