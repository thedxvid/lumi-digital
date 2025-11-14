import { useUserContexts } from '@/hooks/useUserContexts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProductSelectorProps {
  selectedProductId?: string;
  onProductChange: (productId?: string) => void;
}

export function ProductSelector({ selectedProductId, onProductChange }: ProductSelectorProps) {
  const { contexts: products, loading } = useUserContexts();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        Produto (Contexto)
        <button 
          onClick={() => navigate('/app/contexts')}
          className="text-xs text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors font-normal"
        >
          (Criar)
        </button>
      </label>
      <Select value={selectedProductId || 'none'} onValueChange={(value) => onProductChange(value === 'none' ? undefined : value)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Nenhum produto selecionado</span>
            </div>
          </SelectItem>
          
          {products.length > 0 && (
            <>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  <div className="flex items-center gap-2">
                    <span>{product.icon}</span>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {product.description}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
      
      {selectedProductId && (
        <p className="text-xs text-muted-foreground">
          A Lumi usará o contexto deste produto nas respostas
        </p>
      )}
    </div>
  );
}
