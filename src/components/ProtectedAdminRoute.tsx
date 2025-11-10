
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Navigate } from 'react-router-dom';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  // 🔧 MODO DE DESENVOLVIMENTO: Autenticação admin TEMPORARIAMENTE DESATIVADA
  // Para reativar, descomente o código abaixo
  
  /*
  const { isAdmin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lumi-gold"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/app" replace />;
  }
  */

  // Acesso liberado temporariamente
  return <>{children}</>;
}
