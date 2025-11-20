import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAuthErrors } from '@/hooks/useAuthErrors';
import { SignInPage, Testimonial } from '@/components/ui/sign-in';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { Button } from '@/components/ui/button';
import { SupportButton } from '@/components/ui/support-button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const { translateError, validateEmail, validatePassword } = useAuthErrors();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user && !loading && mounted) {
      toast.success(`Bem-vindo de volta! 🎉`);
      navigate('/app');
    }
  }, [user, loading, navigate, mounted]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Limpar erros anteriores
    setEmailError('');
    setPasswordError('');
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Validar email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || '');
      toast.error(emailValidation.error);
      return;
    }

    // Validar senha
    if (!password || password.length < 6) {
      setPasswordError('Senha deve ter no mínimo 6 caracteres');
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        const friendlyError = translateError(error);
        toast.error(friendlyError);
        
        // Definir erro específico
        if (error.message.includes('credentials') || error.message.includes('password')) {
          setPasswordError('Email ou senha incorretos');
        } else if (error.message.includes('email')) {
          setEmailError(friendlyError);
        }
      } else {
        toast.success('Login realizado com sucesso! 🎉');
      }
    } catch (error: any) {
      const friendlyError = translateError(error);
      toast.error(friendlyError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Limpar erros anteriores
    setEmailError('');
    setPasswordError('');
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Validar email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || '');
      toast.error(emailValidation.error);
      return;
    }

    // Validar senha
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error || '');
      toast.error(passwordValidation.error);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signUp(email, password, '');
      
      if (error) {
        const friendlyError = translateError(error);
        toast.error(friendlyError);
        if (error.message.includes('already registered')) {
          setEmailError('Este email já está cadastrado');
        }
      } else {
        toast.success('Conta criada com sucesso! Bem-vindo à LUMI 🎉');
        await signIn(email, password);
      }
    } catch (error: any) {
      const friendlyError = translateError(error);
      toast.error(friendlyError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    toast.info('Login com Google em breve!');
  };

  const handleResetPassword = () => {
    navigate('/forgot-password');
  };

  const handleCreateAccount = () => {
    toast.info('Cadastro em breve! Use o formulário de login para criar sua conta.');
  };

  const testimonials: Testimonial[] = [
    {
      avatarSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      name: "Ana Silva",
      handle: "@anasilva",
      text: "A LUMI transformou completamente meu negócio digital. Resultados incríveis em poucos dias!"
    },
    {
      avatarSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      name: "Carlos Santos",
      handle: "@carlossantos",
      text: "Ferramenta excepcional! A IA realmente entende as necessidades do meu negócio."
    },
    {
      avatarSrc: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      name: "Maria Costa",
      handle: "@mariacosta",
      text: "Nunca imaginei que seria tão fácil começar meu infoproduto. Plataforma incrível!"
    }
  ];

  // Hero component com FallingPattern
  const HeroComponent = (
    <div className="relative h-full w-full bg-gradient-to-br from-background via-background to-muted">
      <FallingPattern 
        color="hsl(var(--foreground))"
        backgroundColor="hsl(var(--background))"
        duration={100}
        blurIntensity="0.8em"
        density={1.5}
        className="h-full w-full opacity-30"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-transparent to-background/40">
        <div className="text-center text-foreground z-10 p-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
            Bem-vindo à LUMI
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            Transforme conhecimento em renda digital
          </p>
        </div>
      </div>
    </div>
  );

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh]">
      {/* Botão de voltar */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/')}
        className="fixed top-safe left-4 md:absolute md:top-4 md:left-4 z-50 flex items-center gap-2 hover:bg-background/80 backdrop-blur-sm mt-4 md:mt-0"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <SignInPage
        title={
          <span className="font-bold text-foreground">
            Entrar na <span className="text-foreground">LUMI</span>
          </span>
        }
        description="Acesse sua conta e continue transformando seu conhecimento em renda"
        logoSrc="/lovable-uploads/6b34a50f-dd26-4cb2-aac7-e17de61a6471.png"
        footerText="Desenvolvido com 💜 por LUMI"
        heroComponent={HeroComponent}
        testimonials={testimonials}
        onSubmit={handleSignIn}
        onResetPassword={handleResetPassword}
        hideSignUp={true}
        hideGoogleSignIn={true}
        isSubmitting={isSubmitting}
        emailError={emailError}
        passwordError={passwordError}
      />
      
      {/* Botão de Suporte Flutuante */}
      <SupportButton variant="floating" />
    </div>
  );
};

export default Auth;
