import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SignInPage, Testimonial } from '@/components/ui/sign-in';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user && !loading && mounted) {
      navigate('/app');
    }
  }, [user, loading, navigate, mounted]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Email ou senha incorretos');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Conta não ativada. Entre em contato com o suporte.');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Login realizado com sucesso!');
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    const { error } = await signUp(email, password, '');
    
    if (error) {
      if (error.message.includes('User already registered')) {
        toast.error('Este email já está cadastrado');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Conta criada! Fazendo login...');
      await signIn(email, password);
    }
  };

  const handleGoogleSignIn = () => {
    toast.info('Login com Google em breve!');
  };

  const handleResetPassword = () => {
    toast.info('Recuperação de senha em breve!');
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
      heroComponent={HeroComponent}
      testimonials={testimonials}
      onSignIn={handleSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleCreateAccount}
      />
    </div>
  );
};

export default Auth;
