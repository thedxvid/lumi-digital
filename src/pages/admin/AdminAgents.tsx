import { useState } from 'react';
import { useCustomAgents, CustomAgent } from '@/hooks/useCustomAgents';
import { CustomAgentForm } from '@/components/admin/CustomAgentForm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AdminAgents() {
  const { agents, loading, createAgent, updateAgent, deleteAgent, toggleActive } = useCustomAgents();
  const [formOpen, setFormOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<CustomAgent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);

  const handleEdit = (agent: CustomAgent) => {
    setEditAgent(agent);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditAgent(null);
    setFormOpen(true);
  };

  const handleSubmit = async (agentData: Omit<CustomAgent, 'id' | 'created_at' | 'updated_at'>) => {
    if (editAgent) {
      await updateAgent(editAgent.id, agentData);
    } else {
      await createAgent(agentData);
    }
  };

  const handleDeleteConfirm = async () => {
    if (agentToDelete) {
      await deleteAgent(agentToDelete);
      setDeleteDialogOpen(false);
      setAgentToDelete(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setAgentToDelete(id);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agentes Customizados</h1>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie agentes personalizados para o chat
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Agente
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Carregando agentes...
        </div>
      ) : agents.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold mb-2">Nenhum agente customizado</h3>
          <p className="text-muted-foreground mb-4">
            Crie seu primeiro agente personalizado para expandir as capacidades do chat
          </p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Agente
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {agents.map((agent) => (
            <Card key={agent.id} className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ backgroundColor: agent.color + '20', color: agent.color }}
                >
                  {agent.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-foreground mb-1">{agent.name}</h3>
                      <p className="text-muted-foreground text-sm mb-3">{agent.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {agent.capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="px-2 py-1 bg-accent text-accent-foreground text-xs rounded"
                          >
                            {cap === 'text' ? 'Texto' : 'Imagem'}
                          </span>
                        ))}
                      </div>

                      {agent.suggested_topics.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Tópicos sugeridos:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {agent.suggested_topics.slice(0, 2).map((topic, i) => (
                              <li key={i}>• {topic}</li>
                            ))}
                            {agent.suggested_topics.length > 2 && (
                              <li className="text-xs">+ {agent.suggested_topics.length - 2} mais...</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={agent.is_active}
                          onCheckedChange={(checked) => toggleActive(agent.id, checked)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {agent.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(agent)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(agent.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CustomAgentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        editAgent={editAgent}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir agente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O agente será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
