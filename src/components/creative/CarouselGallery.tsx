import { useEffect } from 'react';
import { CarouselCard } from './CarouselCard';
import { useCarousel } from '@/hooks/useCarousel';
import { Loader2 } from 'lucide-react';

export function CarouselGallery() {
  const { history, loadHistory, deleteCarousel, loading } = useCarousel();

  useEffect(() => {
    loadHistory();
  }, []);

  if (loading && history.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Nenhum carrossel gerado ainda. Comece criando seu primeiro carrossel! 🎠
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {history.map((item) => (
        <CarouselCard
          key={item.id}
          id={item.id}
          images={item.images}
          prompt={item.prompt}
          createdAt={item.created_at}
          onDelete={deleteCarousel}
        />
      ))}
    </div>
  );
}
