import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthErrors } from '@/hooks/useAuthErrors';
import { Button } from '@/components/ui/button';
import { FloatingInput } from '@/components/ui/floating-input';
import { Card } from '@/components/ui/card';
import { SupportButton } from '@/components/ui/support-button';
import { toast } from 'sonner';
import { Lock, CheckCircle, Shield } from 'lucide-react';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();
  const { validatePassword, translateError } = useAuthErrors();

  useEffect(() => {
    let mounted = true;
    
    const checkRecoverySession = async () => {
      console.log('🔐 Checking recovery session...', {
        url: window.location.href,
        hash: window.location.hash,
        search: window.location.search
      });

      try {
        // Tentar múltiplas vezes pois a sessão pode levar alguns ms para estabelecer após o redirect
        let session = null;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (attempts < maxAttempts && !session && mounted) {
          const { data, error } = await supabase.auth.getSession();
          
          console.log(`🔐 Session check attempt ${attempts + 1}/${maxAttempts}:`, { 
            hasSession: !!data.session, 
            userId: data.session?.user?.id,
            error: error?.message 
          });

          if (error) {
            console.error('🔐 Session error:', error);
            toast.error('Erro ao verificar sessão. Solicite um novo link de recuperação.');
            setTimeout(() => navigate('/forgot-password'), 2000);
            return;
          }

          if (data.session) {
            session = data.session;
            break;
          }

          attempts++;
          if (attempts < maxAttempts) {
            // Aguardar 500ms antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        if (!session) {
          console.error('🔐 No active session after all retries - token may be invalid or expired');
          toast.error('Link de recuperação inválido ou expirado. Solicite um novo link.');
          setTimeout(() => navigate('/forgot-password'), 2000);
          return;
        }

        if (mounted) {
          console.log('🔐 Valid recovery session found - user can reset password');
          toast.success('Link válido! Redefina sua senha abaixo.');
          setIsValidSession(true);
        }
      } catch (error) {
        console.error('🔐 Error checking recovery session:', error);
        if (mounted) {
          toast.error('Erro ao verificar link de recuperação');
          navigate('/forgot-password');
        }
      }
    };

    checkRecoverySession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const getPasswordStrengthColor = (strength: 'weak' | 'medium' | 'strong') => {
    switch (strength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
    }
  };

  const getPasswordStrengthText = (strength: 'weak' | 'medium' | 'strong') => {
    switch (strength) {
      case 'weak': return 'Fraca';
      case 'medium': return 'Média';
      case 'strong': return 'Forte';
    }
  };

  const passwordValidation = validatePassword(newPassword);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    // Validar senhas
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error || '');
      toast.error(passwordValidation.error);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem');
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        const friendlyError = translateError(error);
        toast.error(friendlyError);
        throw error;
      }

      toast.success('Senha alterada com sucesso! 🎉 Redirecionando para o login...');
      
      // Fazer logout para forçar novo login com a nova senha
      await supabase.auth.signOut();
      
      // Redireciona para a página de autenticação após 2 segundos
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (error: any) {
      const friendlyError = translateError(error);
      toast.error(friendlyError);
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
            <div>
              <FloatingInput
                id="new-password"
                type="password"
                label="Nova Senha"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError('');
                }}
                required
                minLength={6}
                disabled={loading}
                className={passwordError ? 'border-red-500' : ''}
              />
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Força da senha:</span>
                    <span className={`font-medium ${
                      passwordValidation.strength === 'weak' ? 'text-red-500' :
                      passwordValidation.strength === 'medium' ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {getPasswordStrengthText(passwordValidation.strength)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <div className={`h-1 flex-1 rounded ${passwordValidation.strength === 'weak' ? 'bg-red-500' : 'bg-muted'}`} />
                    <div className={`h-1 flex-1 rounded ${passwordValidation.strength === 'medium' || passwordValidation.strength === 'strong' ? getPasswordStrengthColor(passwordValidation.strength) : 'bg-muted'}`} />
                    <div className={`h-1 flex-1 rounded ${passwordValidation.strength === 'strong' ? 'bg-green-500' : 'bg-muted'}`} />
                  </div>
                  <div className="flex items-start gap-1 text-xs text-muted-foreground mt-2">
                    <Shield className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>Use pelo menos 8 caracteres com letras e números para maior segurança</span>
                  </div>
                </div>
              )}
              {passwordError && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠️</span> {passwordError}
                </p>
              )}
            </div>

            <div>
              <FloatingInput
                id="confirm-password"
                type="password"
                label="Confirmar Nova Senha"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError('');
                }}
                required
                minLength={6}
                disabled={loading}
                className={passwordError && confirmPassword ? 'border-red-500' : ''}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠️</span> As senhas não coincidem
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
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

        <div className="text-center space-y-2">
          <Button
            variant="link"
            onClick={() => navigate('/auth')}
            disabled={loading}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Voltar para o login
          </Button>
          
          <div className="pt-2 border-t border-border">
            <SupportButton variant="inline" className="w-full" />
          </div>
        </div>
      </Card>
      
      {/* Botão de Suporte Flutuante */}
      <SupportButton variant="floating" />
    </div>
  );
}
