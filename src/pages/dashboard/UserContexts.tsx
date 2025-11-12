import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { UserContextForm } from '@/components/contexts/UserContextForm';
import { useUserContexts } from '@/hooks/useUserContexts';
import { Plus, Trash2, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function UserContexts() {
  const { contexts, loading, createContext, deleteContext } = useUserContexts();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async (data: any) => {
    try {
      await createContext(data);
      setIsCreateOpen(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteContext(deleteId);
      setDeleteId(null);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-lumi-gold" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Meus Agentes
            </h1>
            <p className="text-muted-foreground">
              Crie agentes personalizados para que a Lumi entenda melhor seus produtos, ideias e campanhas
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Agente
          </Button>
        </div>

        {contexts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Nenhum agente criado ainda
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Crie seu primeiro agente para que a Lumi possa te ajudar de forma personalizada com seus produtos, ideias ou campanhas.
              </p>
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Primeiro Agente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contexts.map(context => (
              <Card key={context.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{context.icon}</div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{context.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {context.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(context.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Agente</DialogTitle>
              <DialogDescription>
                Preencha as informações abaixo para criar um agente personalizado
              </DialogDescription>
            </DialogHeader>
            <UserContextForm
              onSubmit={handleCreate}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este contexto? Esta ação não pode ser desfeita.
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
