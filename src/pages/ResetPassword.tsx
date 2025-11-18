import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { FloatingInput } from '@/components/ui/floating-input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica se há uma sessão de recuperação válida
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidSession(true);
      } else {
        toast.error('Link de recuperação inválido ou expirado');
        setTimeout(() => navigate('/auth'), 2000);
      }
    });
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Senha alterada com sucesso!');
      
      // Redireciona para a página de autenticação após 2 segundos
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      toast.error(error.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <p className="text-muted-foreground">Verificando link de recuperação...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Redefinir Senha</h1>
          <p className="text-muted-foreground">
            Digite sua nova senha abaixo
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-4">
            <FloatingInput
              id="new-password"
              type="password"
              label="Nova Senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />

            <FloatingInput
              id="confirm-password"
              type="password"
              label="Confirmar Nova Senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !newPassword || !confirmPassword}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Redefinindo...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Redefinir Senha
              </span>
            )}
          </Button>
        </form>

        <div className="text-center">
          <Button
            variant="link"
            onClick={() => navigate('/auth')}
            disabled={loading}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Voltar para o login
          </Button>
        </div>
      </Card>
    </div>
  );
}
