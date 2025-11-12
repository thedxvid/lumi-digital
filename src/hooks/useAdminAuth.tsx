
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export function useAdminAuth() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminRole() {
      console.log('🔍 [useAdminAuth] Checking admin role...', { 
        user: user?.id, 
        authLoading 
      });

      if (!user || authLoading) {
        console.log('❌ [useAdminAuth] No user or still loading');
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        console.log('📞 [useAdminAuth] Calling has_role RPC for user:', user.id);
        const { data, error } = await supabase
          .rpc('has_role', { 
            _user_id: user.id, 
            _role: 'admin' 
          });

        console.log('📊 [useAdminAuth] RPC Response:', { data, error });

        if (error) {
          console.error('❌ [useAdminAuth] Error checking admin role:', error);
          setIsAdmin(false);
        } else {
          console.log(data ? '✅ [useAdminAuth] User IS admin' : '⚠️ [useAdminAuth] User is NOT admin');
          setIsAdmin(data || false);
        }
      } catch (error) {
        console.error('❌ [useAdminAuth] Exception:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdminRole();
  }, [user, authLoading]);

  return { isAdmin, loading: loading || authLoading };
}
