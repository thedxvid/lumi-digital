import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Download, Heart } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreativeFilters } from "./CreativeFilters";
import type { CreativeHistoryItem } from "@/hooks/useCreativeEngine";

interface CreativeHistoryGalleryProps {
  history: CreativeHistoryItem[];
  onDelete: (id: string) => Promise<void>;
  onToggleFavorite?: (id: string, currentValue: boolean) => Promise<void>;
}

export function CreativeHistoryGallery({ history, onDelete, onToggleFavorite }: CreativeHistoryGalleryProps) {
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [objectiveFilter, setObjectiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `criativo-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Criativo baixado com sucesso!');
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error('Erro ao baixar criativo');
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await onDelete(itemToDelete);
      setItemToDelete(null);
    }
  };

  // Filter and sort history
  const filteredHistory = history
    .filter(item => {
      const matchesSearch = !searchTerm || 
        item.main_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.prompt.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === "all" || item.creative_type === typeFilter;
      const matchesObjective = objectiveFilter === "all" || item.objective === objectiveFilter;
      
      return matchesSearch && matchesType && matchesObjective;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
    });

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <p>Nenhum criativo gerado ainda.</p>
            <p className="text-sm mt-2">Comece criando seu primeiro criativo na aba "Criar"!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <CreativeFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            objectiveFilter={objectiveFilter}
            onObjectiveFilterChange={setObjectiveFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
          />
        </CardContent>
      </Card>

      {filteredHistory.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p>Nenhum criativo encontrado com os filtros aplicados.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistory.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-square">
                <img
                  src={item.generated_image}
                  alt="Criativo gerado"
                  className="w-full h-full object-cover"
                />
                {onToggleFavorite && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                    onClick={() => onToggleFavorite(item.id, item.is_favorite || false)}
                  >
                    <Heart 
                      className={`w-4 h-4 ${item.is_favorite ? 'fill-red-500 text-red-500' : ''}`} 
                    />
                  </Button>
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                {item.main_text && (
                  <p className="font-semibold line-clamp-2">{item.main_text}</p>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {item.creative_type && (
                    <Badge variant="secondary" className="text-xs">
                      {item.creative_type}
                    </Badge>
                  )}
                  {item.objective && (
                    <Badge variant="outline" className="text-xs">
                      {item.objective}
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.prompt}
                </p>
                
                <p className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(item.generated_image)}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setItemToDelete(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este criativo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
