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
  };
  onEdit: (product: any) => void;
  onDelete: (id: string) => void;
  onViewDetails: (product: any) => void;
  onDuplicate?: (product: any) => void;
}

export function ProductCard({ product, onEdit, onDelete, onViewDetails, onDuplicate }: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
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
            <div className="text-4xl shrink-0">{product.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg truncate">{product.name}</CardTitle>
                {isNew() && (
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent onClick={(e) => e.stopPropagation()}>
        <div className="space-y-3">
          {product.detailed_context && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Contexto Detalhado
              </p>
              <p className={`text-sm text-foreground/80 ${!isExpanded && 'line-clamp-3'}`}>
                {product.detailed_context}
              </p>
              {product.detailed_context.length > 150 && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs mt-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                >
                  {isExpanded ? 'Ver menos' : 'Ver mais'}
                </Button>
              )}
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Criado {formatDate(product.created_at)}</span>
            <span>Atualizado {formatDate(product.updated_at)}</span>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(product);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(product.id);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
