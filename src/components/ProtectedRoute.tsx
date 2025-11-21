import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading, signOut } = useAuth();
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function checkAccess() {
      if (!user) {
        setCheckingAccess(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('access_granted')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking access:', error);
        setAccessGranted(true); // Fallback para permitir acesso em caso de erro
        setCheckingAccess(false);
        return;
      }

      setAccessGranted(profile?.access_granted ?? true);
      setCheckingAccess(false);

      // Se acesso foi negado, fazer logout e mostrar toast
      if (profile && !profile.access_granted) {
        toast({
          title: "Acesso Negado",
          description: "Sua conta foi desativada. Entre em contato com o suporte.",
          variant: "destructive",
        });
        await signOut();
      }
    }

    checkAccess();
  }, [user, signOut, toast]);

  if (authLoading || checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || accessGranted === false) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
