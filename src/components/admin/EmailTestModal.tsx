
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, CheckCircle, XCircle } from 'lucide-react';

interface EmailTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EmailTestModal = ({ open, onOpenChange }: EmailTestModalProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);
  const { toast } = useToast();

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um email para teste',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('🧪 Iniciando teste de email para:', email);

      const { data, error } = await supabase.functions.invoke('test-email', {
        body: { email }
      });

      console.log('📧 Resposta do teste de email:', { data, error });

      if (error) {
        throw new Error(`Erro na função de teste: ${error.message}`);
      }

      setResult({
        success: data?.success || false,
        message: data?.message || 'Resposta inesperada',
        data: data?.data
      });

      if (data?.success) {
        toast({
          title: 'Sucesso!',
          description: 'Email de teste enviado com sucesso!'
        });
      } else {
        toast({
          title: 'Erro',
          description: data?.error || 'Falha no teste de email',
          variant: 'destructive'
        });
      }

    } catch (error) {
      console.error('❌ Erro no teste de email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setResult({
        success: false,
        message: errorMessage
      });

      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>🧪 Teste do Sistema de Email</DialogTitle>
          <DialogDescription>
            Envie um email de teste para verificar se o sistema está funcionando corretamente.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleTest} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testEmail">Email de Destino</Label>
            <Input
              id="testEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite um email para teste"
              disabled={loading}
            />
          </div>

          {result && (
            <div className={`p-4 rounded-lg border ${
              result.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.success ? 'Sucesso!' : 'Erro'}
                </span>
              </div>
              <p className={`text-sm ${
                result.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {result.message}
              </p>
              {result.data?.email_id && (
                <p className="text-xs text-gray-600 mt-2">
                  ID do email: {result.data.email_id}
                </p>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Informação:</strong> Este teste enviará um email simples para verificar se o sistema está configurado corretamente.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Fechar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Teste
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmailTestModal;
