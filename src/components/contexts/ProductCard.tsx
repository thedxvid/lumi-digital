import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Trash2, MoreVertical, Eye, Copy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    icon: string;
    detailed_context?: string;
    created_at?: string;
    updated_at?: string;
    image_url?: string;
    created_by?: string | null;
  };
  onEdit: (product: any) => void;
  onDelete: (id: string) => void;
  onViewDetails: (product: any) => void;
  onDuplicate?: (product: any) => void;
}

export function ProductCard({ product, onEdit, onDelete, onViewDetails, onDuplicate }: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDefaultProduct = !product.created_by; // Produto padrão se created_by for NULL
  
  const isNew = () => {
    if (!product.created_at) return false;
    const createdDate = new Date(product.created_at);
    const daysDiff = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff < 7;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Data não disponível';
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true,
      locale: ptBR 
    });
  };

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onClick={() => onViewDetails(product)}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex gap-3 flex-1 min-w-0">
            {product.image_url ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border">
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="text-4xl shrink-0">{product.icon}</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg truncate">{product.name}</CardTitle>
                {isDefaultProduct && (
                  <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    Produto Padrão
                  </Badge>
                )}
                {isNew() && !isDefaultProduct && (
                  <Badge variant="default" className="text-xs">
                    Novo
                  </Badge>
                )}
              </div>
              <CardDescription className="line-clamp-2">
                {product.description}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onViewDetails(product);
              }}>
                <Eye className="h-4 w-4 mr-2" />
                Ver detalhes
              </DropdownMenuItem>
              {!isDefaultProduct && (
                <>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onEdit(product);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  {onDuplicate && (
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(product);
                    }}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(product.id);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {product.detailed_context && (
            <div 
              className={`text-sm text-muted-foreground transition-all duration-300 ${
                isExpanded ? '' : 'line-clamp-3'
              }`}
            >
              {product.detailed_context}
            </div>
          )}
          
          {product.detailed_context && product.detailed_context.length > 150 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-primary hover:text-primary/80 p-0 h-auto font-normal"
            >
              {isExpanded ? 'Ver menos' : 'Ver mais'}
            </Button>
          )}

          <Separator />

          <div className="flex flex-col gap-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Criado {formatDate(product.created_at)}</span>
            </div>
            {product.updated_at && product.updated_at !== product.created_at && (
              <div className="flex items-center justify-between">
                <span>Atualizado {formatDate(product.updated_at)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
