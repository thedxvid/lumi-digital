import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-lumi-success/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-lumi-success" />
            </div>
            <CardTitle className="text-2xl">App Instalado! 🎉</CardTitle>
            <CardDescription>
              LUMI está instalada no seu dispositivo e pronta para uso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Você pode acessar LUMI diretamente da tela inicial do seu dispositivo
            </p>
            <Button 
              onClick={() => navigate('/app')} 
              className="w-full bg-lumi-primary hover:bg-lumi-primary/90"
            >
              Abrir LUMI
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-4xl mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-lumi-primary flex items-center justify-center shadow-lg shadow-lumi-primary/30">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            Instale LUMI no seu dispositivo
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tenha acesso rápido à sua assistente de IA direto da tela inicial
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Download className="h-8 w-8 text-lumi-primary mb-2" />
              <CardTitle className="text-lg">Acesso Instantâneo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Abra LUMI com um toque, sem precisar do navegador
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Smartphone className="h-8 w-8 text-lumi-primary mb-2" />
              <CardTitle className="text-lg">Funciona Offline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Acesse suas conversas e funcionalidades mesmo sem internet
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle className="h-8 w-8 text-lumi-primary mb-2" />
              <CardTitle className="text-lg">Experiência Nativa</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Interface otimizada que parece um app nativo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Install Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Como Instalar</CardTitle>
            <CardDescription>
              Siga as instruções para o seu dispositivo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Android/Chrome */}
            {!isIOS && deferredPrompt && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-lumi-primary" />
                  Android / Chrome
                </h3>
                <p className="text-sm text-muted-foreground">
                  Clique no botão abaixo para instalar LUMI como um aplicativo:
                </p>
                <Button 
                  onClick={handleInstallClick}
                  size="lg"
                  className="w-full bg-lumi-success hover:bg-lumi-success/90"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Instalar LUMI
                </Button>
              </div>
            )}

            {/* iOS */}
            {isIOS && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-lumi-primary" />
                  iPhone / iPad
                </h3>
                <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Toque no botão de <strong>Compartilhar</strong> (ícone com seta para cima) na barra do Safari</li>
                  <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></li>
                  <li>Toque em <strong>"Adicionar"</strong> no canto superior direito</li>
                  <li>LUMI agora está na sua tela inicial! 🎉</li>
                </ol>
              </div>
            )}

            {/* Desktop */}
            {!deferredPrompt && !isIOS && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Download className="h-5 w-5 text-lumi-primary" />
                  Desktop (Chrome/Edge)
                </h3>
                <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Clique no ícone de <strong>instalação</strong> na barra de endereços (ao lado das estrelas)</li>
                  <li>Ou acesse o menu ⋮ {">"} <strong>"Instalar LUMI"</strong></li>
                  <li>Clique em <strong>"Instalar"</strong> na janela que aparecer</li>
                  <li>LUMI será aberta como um aplicativo! 🎉</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button 
            onClick={() => navigate('/app')}
            variant="outline"
            size="lg"
          >
            Continuar no navegador
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Install;
