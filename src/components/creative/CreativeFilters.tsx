import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

interface CreativeFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  objectiveFilter: string;
  onObjectiveFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
}

export function CreativeFilters({
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  objectiveFilter,
  onObjectiveFilterChange,
  sortBy,
  onSortByChange
}: CreativeFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por texto..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={typeFilter} onValueChange={onTypeFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="social-post">Post para Redes Sociais</SelectItem>
              <SelectItem value="story">Story/Reels</SelectItem>
              <SelectItem value="ad">Anúncio Pago</SelectItem>
              <SelectItem value="banner">Banner/Header</SelectItem>
              <SelectItem value="email">E-mail Marketing</SelectItem>
              <SelectItem value="product">Produto/E-commerce</SelectItem>
              <SelectItem value="infographic">Infográfico</SelectItem>
              <SelectItem value="free">Criativo Livre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Objetivo</Label>
          <Select value={objectiveFilter} onValueChange={onObjectiveFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos objetivos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos objetivos</SelectItem>
              <SelectItem value="sales">Vendas</SelectItem>
              <SelectItem value="engagement">Engajamento</SelectItem>
              <SelectItem value="educational">Educacional</SelectItem>
              <SelectItem value="awareness">Awareness</SelectItem>
              <SelectItem value="promotional">Promocional</SelectItem>
              <SelectItem value="informative">Informativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Ordenar por</Label>
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mais Recentes</SelectItem>
              <SelectItem value="oldest">Mais Antigos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
