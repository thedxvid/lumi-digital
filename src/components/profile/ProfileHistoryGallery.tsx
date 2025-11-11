import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, Trash2, Star, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { SavedProfileAnalysis } from '@/types/profile';
import { ProfileAnalysisResult } from './ProfileAnalysisResult';

interface ProfileHistoryGalleryProps {
  history: SavedProfileAnalysis[];
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, currentValue: boolean) => void;
}

export function ProfileHistoryGallery({ 
  history, 
  onDelete, 
  onToggleFavorite 
}: ProfileHistoryGalleryProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState<SavedProfileAnalysis | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');

  const filteredHistory = filterPlatform === 'all'
    ? history
    : history.filter(item => item.platform === filterPlatform);

  const platforms = Array.from(new Set(history.map(item => item.platform)));

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Nenhuma análise realizada ainda</p>
        <p className="text-sm text-muted-foreground">
          Faça sua primeira análise na aba "Analisar"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      {platforms.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterPlatform === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPlatform('all')}
          >
            Todas
          </Button>
          {platforms.map(platform => (
            <Button
              key={platform}
              variant={filterPlatform === platform ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPlatform(platform)}
            >
              {platform}
            </Button>
          ))}
        </div>
      )}

      {/* Grid de Análises */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHistory.map((item) => (
          <Card key={item.id} variant="glass" className="overflow-hidden">
            <div className="relative">
              <img
                src={item.profile_image}
                alt="Preview do perfil"
                className="w-full h-48 object-cover"
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                onClick={() => onToggleFavorite(item.id, item.is_favorite)}
              >
                <Star
                  className={`h-4 w-4 ${
                    item.is_favorite ? 'fill-yellow-500 text-yellow-500' : ''
                  }`}
                />
              </Button>
            </div>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{item.platform}</Badge>
                <Badge variant="outline">
                  {item.analysis_result.pontuacao_geral}/100
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(item.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="font-medium mb-1">Nicho</p>
                <p className="text-muted-foreground line-clamp-2">
                  {item.input_data.niche}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedAnalysis(item)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Análise
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Deseja realmente deletar esta análise?')) {
                      onDelete(item.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Visualização */}
      <Dialog open={!!selectedAnalysis} onOpenChange={() => setSelectedAnalysis(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Análise de Perfil</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
            {selectedAnalysis && (
              <ProfileAnalysisResult
                result={selectedAnalysis.analysis_result}
                onClose={() => setSelectedAnalysis(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
