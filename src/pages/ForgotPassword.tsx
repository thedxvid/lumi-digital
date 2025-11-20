import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthErrors } from '@/hooks/useAuthErrors';
import { Button } from '@/components/ui/button';
import { FloatingInput } from '@/components/ui/floating-input';
import { Card } from '@/components/ui/card';
import { SupportButton } from '@/components/ui/support-button';
import { toast } from 'sonner';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();
  const { validateEmail, translateError } = useAuthErrors();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    // Validar email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || '');
      toast.error(emailValidation.error);
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Calling send-password-recovery edge function...');
      
      // Usar a edge function customizada que envia email personalizado em português
      const { data, error } = await supabase.functions.invoke('send-password-recovery', {
        body: { email }
      });

      console.log('🔐 Edge function response:', { success: !!data, error: error?.message });

      if (error) {
        console.error('Password recovery error:', error);
        toast.error('Erro ao enviar email. Tente novamente.');
        return;
      }

      setEmailSent(true);
      toast.success('Email de recuperação enviado! 📧');
    } catch (error: any) {
      console.error('Password recovery error:', error);
      toast.error('Erro ao enviar email. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md p-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Email Enviado!</h1>
            <p className="text-muted-foreground">
              Enviamos um link de recuperação para <strong>{email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Verifique sua caixa de entrada e spam. O link expira em 1 hora.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/auth')}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para o login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Recuperar Senha</h1>
          <p className="text-muted-foreground">
            Digite seu email para receber o link de recuperação
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FloatingInput
              id="email"
              type="email"
              label="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
              }}
              required
              disabled={loading}
              autoFocus
              className={emailError ? 'border-red-500' : ''}
            />
            {emailError && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span>⚠️</span> {emailError}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !email}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Enviando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Enviar Link de Recuperação
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
            <ArrowLeft className="w-4 h-4 mr-1" />
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
