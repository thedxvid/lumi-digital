import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { CustomAgent } from '@/hooks/useCustomAgents';
import { X, Plus } from 'lucide-react';

interface CustomAgentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (agent: Omit<CustomAgent, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  editAgent?: CustomAgent | null;
}

export function CustomAgentForm({ open, onOpenChange, onSubmit, editAgent }: CustomAgentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🤖',
    color: 'hsl(221, 83%, 53%)',
    system_prompt: '',
    suggested_topics: [''],
    capabilities: ['text'] as ('text' | 'image')[],
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editAgent) {
      setFormData({
        name: editAgent.name,
        description: editAgent.description,
        icon: editAgent.icon,
        color: editAgent.color,
        system_prompt: editAgent.system_prompt,
        suggested_topics: editAgent.suggested_topics.length ? editAgent.suggested_topics : [''],
        capabilities: editAgent.capabilities,
        is_active: editAgent.is_active,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        icon: '🤖',
        color: 'hsl(221, 83%, 53%)',
        system_prompt: '',
        suggested_topics: [''],
        capabilities: ['text'],
        is_active: true,
      });
    }
  }, [editAgent, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        suggested_topics: formData.suggested_topics.filter(t => t.trim() !== ''),
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const updateTopic = (index: number, value: string) => {
    const newTopics = [...formData.suggested_topics];
    newTopics[index] = value;
    setFormData({ ...formData, suggested_topics: newTopics });
  };

  const addTopic = () => {
    setFormData({ ...formData, suggested_topics: [...formData.suggested_topics, ''] });
  };

  const removeTopic = (index: number) => {
    const newTopics = formData.suggested_topics.filter((_, i) => i !== index);
    setFormData({ ...formData, suggested_topics: newTopics });
  };

  const toggleCapability = (capability: 'text' | 'image') => {
    const has = formData.capabilities.includes(capability);
    const newCapabilities = has
      ? formData.capabilities.filter(c => c !== capability)
      : [...formData.capabilities, capability];
    setFormData({ ...formData, capabilities: newCapabilities });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editAgent ? 'Editar Agente' : 'Criar Novo Agente'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Agente de Vendas"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Ícone (Emoji) *</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="💼"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Especialista em estratégias de vendas..."
              rows={2}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Cor (HSL) *</Label>
            <Input
              id="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="hsl(221, 83%, 53%)"
              required
            />
            <div
              className="w-12 h-12 rounded-lg border border-border"
              style={{ backgroundColor: formData.color }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="system_prompt">System Prompt *</Label>
            <Textarea
              id="system_prompt"
              value={formData.system_prompt}
              onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
              placeholder="Você é um especialista em..."
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Tópicos Sugeridos</Label>
            {formData.suggested_topics.map((topic, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={topic}
                  onChange={(e) => updateTopic(index, e.target.value)}
                  placeholder="Como criar uma estratégia..."
                />
                {formData.suggested_topics.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTopic(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addTopic} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Tópico
            </Button>
          </div>

          <div className="space-y-3">
            <Label>Capacidades</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.capabilities.includes('text')}
                  onChange={() => toggleCapability('text')}
                  className="rounded"
                />
                <span>Texto</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.capabilities.includes('image')}
                  onChange={() => toggleCapability('image')}
                  className="rounded"
                />
                <span>Imagem</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Agente Ativo</Label>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : editAgent ? 'Atualizar' : 'Criar Agente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
