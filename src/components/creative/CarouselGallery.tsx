import { useEffect, useState, useMemo } from 'react';
import { CarouselCard } from './CarouselCard';
import { CarouselFilters } from './CarouselFilters';
import { useCarousel } from '@/hooks/useCarousel';
import { Loader2 } from 'lucide-react';

export function CarouselGallery() {
  const { history, loadHistory, deleteCarousel, loading } = useCarousel();
  const [searchTerm, setSearchTerm] = useState('');
  const [themeFilter, setThemeFilter] = useState('all');
  const [slideCountFilter, setSlideCountFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredAndSortedHistory = useMemo(() => {
    let filtered = [...history];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.prompt.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Theme filter
    if (themeFilter !== 'all') {
      filtered = filtered.filter(item => item.theme === themeFilter);
    }

    // Slide count filter
    if (slideCountFilter !== 'all') {
      const [min, max] = slideCountFilter.split('-').map(Number);
      filtered = filtered.filter(item => {
        const count = item.image_count;
        return count >= min && count <= max;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'most-slides':
          return b.image_count - a.image_count;
        case 'least-slides':
          return a.image_count - b.image_count;
        default:
          return 0;
      }
    });

    return filtered;
  }, [history, searchTerm, themeFilter, slideCountFilter, sortBy]);

  if (loading && history.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (history.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Nenhum carrossel gerado ainda. Comece criando seu primeiro carrossel! 🎠
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CarouselFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        themeFilter={themeFilter}
        onThemeFilterChange={setThemeFilter}
        slideCountFilter={slideCountFilter}
        onSlideCountFilterChange={setSlideCountFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      {filteredAndSortedHistory.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhum resultado encontrado com os filtros aplicados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedHistory.map((item) => (
            <CarouselCard
              key={item.id}
              id={item.id}
              images={item.images}
              prompt={item.title || item.prompt}
              createdAt={item.created_at}
              onDelete={deleteCarousel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
