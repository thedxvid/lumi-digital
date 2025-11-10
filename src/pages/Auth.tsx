import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Mail, Lock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
const Auth = () => {
  const {
    user,
    signIn,
    signUp,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Garantir que o componente seja montado corretamente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect authenticated users
  useEffect(() => {
    if (user && !loading && mounted) {
      navigate('/app');
    }
  }, [user, loading, navigate, mounted]);
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const {
      error
    } = await signIn(email, password);
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos. Verifique suas credenciais ou cadastre-se.');
      } else if (error.message.includes('Email not confirmed')) {
        setError('Sua conta ainda não foi ativada. Entre em contato com o suporte.');
      } else {
        setError(error.message);
      }
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password, fullName);
    if (error) {
      if (error.message.includes('User already registered')) {
        setError('Este email já está cadastrado. Faça login.');
      } else {
        setError(error.message);
      }
    } else {
      setError('');
      // Auto login após cadastro bem-sucedido
      await signIn(email, password);
    }
    setIsLoading(false);
  };

  // Se não montado, não renderizar nada
  if (!mounted) {
    return null;
  }

  // Estado de carregamento com timeout
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lumi-gold/5 to-lumi-gold-dark/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lumi-gold mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen flex flex-col bg-gradient-to-br from-lumi-gold/5 to-lumi-gold-dark/10">
      {/* Header */}
      <header className="p-4 sm:p-6">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-gradient-to-br from-lumi-gold to-lumi-gold-dark rounded-full flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Lumi</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {isSignUp ? 'Criar Conta LUMI' : 'Acesse sua conta LUMI'}
            </h2>
            <p className="text-muted-foreground">
              {isSignUp 
                ? 'Crie sua conta para acessar a plataforma' 
                : 'Entre com suas credenciais'}
            </p>
          </div>

          <Card className="border-border/50 shadow-lg bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-xl">
                {isSignUp ? 'Cadastro' : 'Login'}
              </CardTitle>
              <CardDescription className="text-center">
                {isSignUp 
                  ? 'Preencha os dados para criar sua conta' 
                  : 'Use seu email e senha para entrar'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>}

              {isSignUp ? (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome Completo</Label>
                    <Input 
                      id="signup-name" 
                      name="fullName" 
                      type="text" 
                      placeholder="Seu nome completo" 
                      className="bg-background" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="signup-email" 
                        name="email" 
                        type="email" 
                        placeholder="seu@email.com" 
                        className="pl-10 bg-background" 
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="signup-password" 
                        name="password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-10 bg-background" 
                        required 
                        minLength={6}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-lumi-gold to-lumi-gold-dark hover:from-lumi-gold-dark hover:to-lumi-gold" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Criando conta...' : 'Criar Conta'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="signin-email" 
                        name="email" 
                        type="email" 
                        placeholder="seu@email.com" 
                        className="pl-10 bg-background" 
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="signin-password" 
                        name="password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-10 bg-background" 
                        required 
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-lumi-gold to-lumi-gold-dark hover:from-lumi-gold-dark hover:to-lumi-gold" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              )}

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-sm text-lumi-gold hover:underline"
                >
                  {isSignUp 
                    ? 'Já tem uma conta? Faça login' 
                    : 'Não tem uma conta? Cadastre-se'}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mt-6 bg-lumi-gold/10 border-lumi-gold/20">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold text-foreground mb-2">
                🔐 Acesso Exclusivo para Clientes
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Esta plataforma é exclusiva para quem adquiriu nossos produtos. 
                Suas credenciais foram enviadas por email após a confirmação do pagamento.
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Não recebeu o email? Verifique sua caixa de spam</p>
                <p>• Problemas com acesso? Entre em contato com o suporte</p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Ao continuar, você concorda com nossos{' '}
              <span className="text-lumi-gold hover:underline cursor-pointer">
                Termos de Uso
              </span>{' '}
              e{' '}
              <span className="text-lumi-gold hover:underline cursor-pointer">
                Política de Privacidade
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>;
};
export default Auth;