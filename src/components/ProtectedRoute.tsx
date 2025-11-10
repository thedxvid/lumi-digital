
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();

  // 🔧 MODO DE DESENVOLVIMENTO: Verificação de access_granted temporariamente DESATIVADA
  // Para reativar, descomente o código abaixo e remova o return direto
  
  /*
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!user || authLoading) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('access_granted, subscription_status')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking user access:', error);
          setAccessGranted(false);
        } else {
          setAccessGranted(profile?.access_granted || false);
        }
      } catch (error) {
        console.error('Error checking access:', error);
        setAccessGranted(false);
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lumi-gold"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (accessGranted === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-lumi-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-lumi-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Acesso Não Autorizado
          </h2>
          <p className="text-muted-foreground mb-4">
            Sua conta não possui acesso liberado à plataforma LUMI. 
            Isso pode acontecer se o pagamento ainda não foi processado ou se houve algum problema com sua compra.
          </p>
          <p className="text-sm text-muted-foreground">
            Entre em contato com nosso suporte para resolver esta situação.
          </p>
        </div>
      </div>
    );
  }
  */

  // Modo de desenvolvimento: apenas verificar se está autenticado
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lumi-gold"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
