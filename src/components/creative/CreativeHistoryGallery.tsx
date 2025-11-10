import { useEffect } from 'react';
import { CreativeCard } from './CreativeCard';
import { useCreativeEngine } from '@/hooks/useCreativeEngine';
import { Loader2 } from 'lucide-react';

export function CreativeHistoryGallery() {
  const { history, loadHistory, deleteHistoryItem, loading } = useCreativeEngine();

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
          Nenhum criativo gerado ainda. Comece enviando suas primeiras imagens! 🎨
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {history.map((item) => (
        <CreativeCard
          key={item.id}
          id={item.id}
          generatedImage={item.generated_image}
          prompt={item.prompt}
          createdAt={item.created_at}
          onDelete={deleteHistoryItem}
        />
      ))}
    </div>
  );
}