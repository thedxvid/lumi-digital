import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface UserContextFormProps {
  onSubmit: (data: {
    context_type: 'product';
    name: string;
    description: string;
    detailed_context: string;
    icon?: string;
  }) => Promise<void>;
  onCancel: () => void;
  initialData?: {
    name?: string;
    description?: string;
    detailed_context?: string;
    icon?: string;
  };
}

const PRODUCT_ICON = '🎯';

const CONTEXT_GUIDE = 'Descreva seu produto, público-alvo e principais benefícios. Exemplo: "Curso online com 40 aulas sobre SEO técnico e content marketing, voltado para empreendedores digitais iniciantes que querem aumentar o tráfego orgânico."';

export function UserContextForm({ onSubmit, onCancel, initialData }: UserContextFormProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [detailedContext, setDetailedContext] = useState(initialData?.detailed_context || '');
  const [icon, setIcon] = useState(initialData?.icon || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !description.trim() || !detailedContext.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        context_type: 'product',
        name: name.trim(),
        description: description.trim(),
        detailed_context: detailedContext.trim(),
        icon: icon.trim() || undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Produto *</Label>
        <Input
          id="name"
          placeholder="Ex: Curso de SEO Avançado, E-book de Tráfego Pago"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição Curta *</Label>
        <Textarea
          id="description"
          placeholder="Resuma em poucas palavras o que é seu contexto"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={200}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="detailed-context">Contexto Detalhado *</Label>
        <p className="text-sm text-muted-foreground mb-2">
          {CONTEXT_GUIDE}
        </p>
        <Textarea
          id="detailed-context"
          placeholder="Descreva em detalhes para que a IA possa te ajudar melhor..."
          value={detailedContext}
          onChange={(e) => setDetailedContext(e.target.value)}
          rows={6}
          maxLength={1000}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="icon">Ícone (opcional)</Label>
        <div className="flex gap-2 items-center">
          <Input
            id="icon"
            placeholder={PRODUCT_ICON}
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            maxLength={2}
            className="w-20 text-center text-2xl"
          />
          <span className="text-sm text-muted-foreground">
            Deixe vazio para usar o padrão: {PRODUCT_ICON}
          </span>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={loading || !name.trim() || !description.trim() || !detailedContext.trim()}
          className="flex-1"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Atualizar Produto' : 'Cadastrar Produto'}
        </Button>
      </div>
    </form>
  );
}
