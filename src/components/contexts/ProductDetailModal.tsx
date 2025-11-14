import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Edit, Copy, Trash2, Calendar, Clock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProductDetailModalProps {
  product: {
    id: string;
    name: string;
    description: string;
    icon: string;
    detailed_context?: string;
    system_prompt?: string;
    created_at?: string;
    updated_at?: string;
    pdf_filename?: string;
    user_role?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (product: any) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (product: any) => void;
}

export function ProductDetailModal({
  product,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onDuplicate,
}: ProductDetailModalProps) {
  if (!product) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Data não disponível';
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatRelativeDate = (dateString?: string) => {
    if (!dateString) return 'Data não disponível';
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true,
      locale: ptBR 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{product.icon}</span>
            <div>
              <DialogTitle className="text-2xl">{product.name}</DialogTitle>
              <DialogDescription>{product.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Contexto Detalhado */}
            {product.detailed_context && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Contexto Detalhado</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
                  {product.detailed_context}
                </p>
              </div>
            )}

            {/* Quem você é */}
            {product.user_role && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Quem você é</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
                  {product.user_role}
                </p>
              </div>
            )}

            {/* Documento PDF */}
            {product.pdf_filename && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Documento PDF</h3>
                <div className="flex items-center gap-2 bg-muted/50 p-4 rounded-lg">
                  <Badge variant="secondary">{product.pdf_filename}</Badge>
                  <p className="text-xs text-muted-foreground">
                    PDF carregado como contexto adicional
                  </p>
                </div>
              </div>
            )}

            <Separator />

            {/* System Prompt Gerado */}
            {product.system_prompt && (
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  Como a Lumi usa este produto
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Este é o prompt do sistema que a Lumi utiliza para personalizar as respostas:
                </p>
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                  <p className="text-xs font-mono text-foreground/80 whitespace-pre-wrap">
                    {product.system_prompt}
                  </p>
                </div>
              </div>
            )}

            <Separator />

            {/* Metadados */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Informações</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2 text-sm">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Criado</p>
                    <p className="text-xs text-muted-foreground">{formatDate(product.created_at)}</p>
                    <p className="text-xs text-muted-foreground">({formatRelativeDate(product.created_at)})</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Última atualização</p>
                    <p className="text-xs text-muted-foreground">{formatDate(product.updated_at)}</p>
                    <p className="text-xs text-muted-foreground">({formatRelativeDate(product.updated_at)})</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <Separator />

        {/* Ações */}
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onEdit(product);
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          {onDuplicate && (
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onDuplicate(product);
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => {
              onDelete(product.id);
              onOpenChange(false);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
