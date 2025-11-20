import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCheck, UserX, Mail, Calendar, Trash2, X } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onSendEmail: () => void;
  onExtendSubscription: () => void;
  onDelete: () => void;
}

export const BulkActionsBar = ({
  selectedCount,
  onClearSelection,
  onActivate,
  onDeactivate,
  onSendEmail,
  onExtendSubscription,
  onDelete
}: BulkActionsBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-card border shadow-lg rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('🔵 Botão Ativar clicado');
                onActivate();
              }}
              className="h-8"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Ativar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('🔴 Botão Desativar clicado');
                onDeactivate();
              }}
              className="h-8"
            >
              <UserX className="h-4 w-4 mr-2" />
              Desativar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onSendEmail}
              className="h-8"
            >
              <Mail className="h-4 w-4 mr-2" />
              Enviar Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExtendSubscription}
              className="h-8"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Estender Plano
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="h-8"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Deletar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
