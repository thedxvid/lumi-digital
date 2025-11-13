import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { UserContextForm } from '@/components/contexts/UserContextForm';
import { ProductCard } from '@/components/contexts/ProductCard';
import { ProductFilters } from '@/components/contexts/ProductFilters';
import { ProductDetailModal } from '@/components/contexts/ProductDetailModal';
import { ProductCardSkeleton } from '@/components/contexts/ProductCardSkeleton';
import { useUserContexts } from '@/hooks/useUserContexts';
import { Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function UserContexts() {
  const { contexts, loading, createContext, updateContext, deleteContext } = useUserContexts();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailProduct, setDetailProduct] = useState<any>(null);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtrar e ordenar produtos
  const filteredAndSortedContexts = useMemo(() => {
    let filtered = [...contexts];

    // Aplicar busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ctx) =>
          ctx.name.toLowerCase().includes(query) ||
          ctx.description.toLowerCase().includes(query) ||
          (ctx.detailed_context && ctx.detailed_context.toLowerCase().includes(query))
      );
    }

    // Aplicar ordenação
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    return filtered;
  }, [contexts, searchQuery, sortBy]);

  const hasActiveFilters = searchQuery.trim() !== '' || sortBy !== 'recent';

  const handleClearFilters = () => {
    setSearchQuery('');
    setSortBy('recent');
  };

  const handleCreate = async (data: any) => {
    try {
      await createContext(data);
      setIsCreateOpen(false);
      toast.success('Produto cadastrado com sucesso!');
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingProduct) return;
    try {
      await updateContext(editingProduct.id, data);
      setEditingProduct(null);
      toast.success('Produto atualizado com sucesso!');
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteContext(deleteId);
      setDeleteId(null);
      toast.success('Produto excluído com sucesso!');
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleDuplicate = async (product: any) => {
    try {
      await createContext({
        context_type: 'product',
        name: `${product.name} (Cópia)`,
        description: product.description,
        detailed_context: product.detailed_context,
        icon: product.icon,
      });
      toast.success('Produto duplicado com sucesso!');
    } catch (error) {
      toast.error('Erro ao duplicar produto');
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Meus Produtos
            </h1>
            <p className="text-muted-foreground">
              Cadastre seus produtos para que a Lumi possa te ajudar de forma personalizada
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        {contexts.length === 0 ? (
          /* Empty State */
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Nenhum produto cadastrado ainda
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Cadastre seu primeiro produto para que a Lumi possa te ajudar de forma personalizada.
              </p>
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Cadastrar Primeiro Produto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Filtros */}
            <ProductFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              totalCount={contexts.length}
              filteredCount={filteredAndSortedContexts.length}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
            />

            {/* Lista de Produtos */}
            {filteredAndSortedContexts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Tente ajustar os filtros de busca ou adicione um novo produto.
                  </p>
                  <Button variant="outline" onClick={handleClearFilters}>
                    Limpar filtros
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'flex flex-col gap-4'
                }
              >
                {filteredAndSortedContexts.map((context) => (
                  <ProductCard
                    key={context.id}
                    product={context}
                    onEdit={setEditingProduct}
                    onDelete={setDeleteId}
                    onViewDetails={setDetailProduct}
                    onDuplicate={handleDuplicate}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Modal de Criar */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Produto</DialogTitle>
              <DialogDescription>
                Preencha as informações abaixo para cadastrar seu produto
              </DialogDescription>
            </DialogHeader>
            <UserContextForm
              onSubmit={handleCreate}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Modal de Editar */}
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Produto</DialogTitle>
              <DialogDescription>
                Atualize as informações do seu produto
              </DialogDescription>
            </DialogHeader>
            <UserContextForm
              initialData={editingProduct}
              onSubmit={handleUpdate}
              onCancel={() => setEditingProduct(null)}
            />
          </DialogContent>
        </Dialog>

        {/* Modal de Detalhes */}
        <ProductDetailModal
          product={detailProduct}
          open={!!detailProduct}
          onOpenChange={(open) => !open && setDetailProduct(null)}
          onEdit={setEditingProduct}
          onDelete={setDeleteId}
          onDuplicate={handleDuplicate}
        />

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
