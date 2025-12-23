
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: () => void;
}

type UserRole = 'user' | 'admin';
type PlanType = 'basic' | 'pro';
type DurationMonths = 1 | 3 | 6;

const AddUserModal = ({ open, onOpenChange, onUserAdded }: AddUserModalProps) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'user' as UserRole,
    accessGranted: true,
    planType: 'basic' as PlanType,
    durationMonths: 3 as DurationMonths
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Função para gerar senha aleatória
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast({
        title: 'Erro',
        description: 'Email é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Gerar senha automaticamente
      const generatedPassword = generatePassword();

      console.log('🔧 Chamando Edge Function para criar usuário...');

      // Chamar a Edge Function para criar o usuário
      const response = await supabase.functions.invoke('create-user-admin', {
        body: {
          email: formData.email,
          password: generatedPassword,
          role: formData.role,
          access_granted: formData.accessGranted,
          plan_type: formData.planType,
          duration_months: formData.durationMonths
        }
      });

      console.log('📝 Resposta da Edge Function:', response);

      // Extrair mensagem de erro do response (Edge Function retorna no data mesmo com erro)
      const { data, error } = response;
      
      // Quando a Edge Function retorna status 400/409, o erro vem no data
      if (data && !data.success) {
        const errorMsg = data.error || 'Erro desconhecido ao criar usuário';
        console.error('❌ Erro retornado pela Edge Function:', errorMsg);
        
        // Mensagem amigável para email duplicado
        if (errorMsg.includes('Já existe') || errorMsg.includes('already') || errorMsg.includes('EMAIL_EXISTS')) {
          throw new Error('Este email já está cadastrado no sistema. Tente outro email.');
        }
        
        throw new Error(errorMsg);
      }

      // Erro de rede ou conexão
      if (error) {
        console.error('❌ Erro de conexão com Edge Function:', error);
        throw new Error('Erro de conexão com o servidor. Tente novamente.');
      }

      if (!data?.success) {
        throw new Error('Resposta inesperada do servidor');
      }

      console.log('✅ Usuário criado com sucesso');

      // Enviar email de boas-vindas com as credenciais
      try {
        console.log('📧 Enviando email de boas-vindas...');
        
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-welcome-email', {
          body: {
            email: formData.email,
            name: formData.email.split('@')[0],
            password: generatedPassword,
            product_name: 'LUMI - Plataforma de IA para Negócios Digitais'
          }
        });

        console.log('📧 Resposta do envio de email:', { emailData, emailError });

        if (emailError) {
          console.error('⚠️ Erro ao enviar email:', emailError);
          toast({
            title: 'Usuário criado com sucesso!',
            description: `Porém houve um problema ao enviar o email de boas-vindas: ${emailError.message}. Você pode fornecer as credenciais manualmente.`,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Sucesso!',
            description: 'Usuário criado e email de boas-vindas enviado com sucesso!'
          });
        }
      } catch (emailError) {
        console.error('⚠️ Erro ao enviar email:', emailError);
        const errorMessage = emailError instanceof Error ? emailError.message : 'Erro desconhecido';
        toast({
          title: 'Usuário criado com sucesso!',
          description: `Porém houve um problema ao enviar o email: ${errorMessage}. Você pode fornecer as credenciais manualmente.`,
          variant: 'destructive'
        });
      }

      // Reset form
      setFormData({
        email: '',
        role: 'user',
        accessGranted: true,
        planType: 'basic',
        durationMonths: 3
      });

      onUserAdded();
      onOpenChange(false);

    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      const errorMessage = error instanceof Error ? error.message : 'Não foi possível criar o usuário';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | UserRole | PlanType | DurationMonths) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Usuário</DialogTitle>
          <DialogDescription>
            Crie um novo usuário no sistema. Uma senha será gerada automaticamente e enviada por email junto com as credenciais de acesso.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Digite o email"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              As credenciais de acesso serão enviadas automaticamente para este email
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Tipo de Usuário</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value: UserRole) => handleInputChange('role', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário Comum</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="accessGranted"
              checked={formData.accessGranted}
              onCheckedChange={(checked) => handleInputChange('accessGranted', checked)}
              disabled={loading}
            />
            <Label htmlFor="accessGranted">Conceder acesso imediatamente</Label>
          </div>

          {formData.accessGranted && (
            <>
              <div className="space-y-2">
                <Label htmlFor="planType">Plano</Label>
                <Select 
                  value={formData.planType} 
                  onValueChange={(value: PlanType) => handleInputChange('planType', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Básico (10 imagens/dia, 5 análises/dia)</SelectItem>
                    <SelectItem value="pro">PRO (30 imagens/dia, 10 análises/dia, 15 vídeos/mês)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="durationMonths">Duração do Plano</Label>
                <Select 
                  value={formData.durationMonths.toString()} 
                  onValueChange={(value) => handleInputChange('durationMonths', parseInt(value) as DurationMonths)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a duração" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 mês</SelectItem>
                    <SelectItem value="3">3 meses (padrão)</SelectItem>
                    <SelectItem value="6">6 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Informação:</strong> Uma senha segura será gerada automaticamente e enviada por email junto com as instruções de acesso.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando e enviando...
                </>
              ) : (
                'Criar Usuário'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserModal;
