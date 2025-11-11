import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface CarouselFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  themeFilter: string;
  onThemeFilterChange: (value: string) => void;
  slideCountFilter: string;
  onSlideCountFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
}

export function CarouselFilters({
  searchTerm,
  onSearchChange,
  themeFilter,
  onThemeFilterChange,
  slideCountFilter,
  onSlideCountFilterChange,
  sortBy,
  onSortByChange,
}: CarouselFiltersProps) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="space-y-2">
        <Label htmlFor="search" className="text-sm font-medium">
          Buscar
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Buscar por título ou conteúdo..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="theme" className="text-sm font-medium">
            Tema
          </Label>
          <Select value={themeFilter} onValueChange={onThemeFilterChange}>
            <SelectTrigger id="theme">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="minimalist">Minimalista</SelectItem>
              <SelectItem value="vibrant">Vibrante</SelectItem>
              <SelectItem value="professional">Profissional</SelectItem>
              <SelectItem value="modern">Moderno</SelectItem>
              <SelectItem value="creative">Criativo</SelectItem>
              <SelectItem value="elegant">Elegante</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="slideCount" className="text-sm font-medium">
            Nº de Slides
          </Label>
          <Select value={slideCountFilter} onValueChange={onSlideCountFilterChange}>
            <SelectTrigger id="slideCount">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="2-3">2-3 slides</SelectItem>
              <SelectItem value="4-6">4-6 slides</SelectItem>
              <SelectItem value="7-10">7-10 slides</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortBy" className="text-sm font-medium">
            Ordenar Por
          </Label>
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger id="sortBy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mais Recentes</SelectItem>
              <SelectItem value="oldest">Mais Antigos</SelectItem>
              <SelectItem value="most-slides">Mais Slides</SelectItem>
              <SelectItem value="least-slides">Menos Slides</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
