import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, LogIn, LogOut, RefreshCw, Monitor, Smartphone, Globe, ChevronDown } from 'lucide-react';

interface LoginHistoryEntry {
  id: string;
  user_id: string;
  action: string;
  login_method: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface UserLoginHistoryProps {
  userId: string;
}

const parseUserAgent = (userAgent: string | null): { device: string; browser: string } => {
  if (!userAgent) return { device: 'Desconhecido', browser: 'Desconhecido' };
  
  let device = 'Desktop';
  if (/mobile/i.test(userAgent)) device = 'Mobile';
  else if (/tablet/i.test(userAgent)) device = 'Tablet';
  
  let browser = 'Outro';
  if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) browser = 'Chrome';
  else if (/firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
  else if (/edge/i.test(userAgent)) browser = 'Edge';
  else if (/opera|opr/i.test(userAgent)) browser = 'Opera';
  
  return { device, browser };
};

const ActionIcon = ({ action }: { action: string }) => {
  switch (action) {
    case 'login':
      return <LogIn className="h-4 w-4 text-green-500" />;
    case 'logout':
      return <LogOut className="h-4 w-4 text-red-500" />;
    case 'token_refresh':
      return <RefreshCw className="h-4 w-4 text-blue-500" />;
    default:
      return <Globe className="h-4 w-4 text-muted-foreground" />;
  }
};

const ActionBadge = ({ action }: { action: string }) => {
  switch (action) {
    case 'login':
      return <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/30">Login</Badge>;
    case 'logout':
      return <Badge variant="secondary" className="bg-red-500/20 text-red-600 border-red-500/30">Logout</Badge>;
    case 'token_refresh':
      return <Badge variant="outline" className="bg-blue-500/20 text-blue-600 border-blue-500/30">Token</Badge>;
    default:
      return <Badge variant="outline">{action}</Badge>;
  }
};

export const UserLoginHistory = ({ userId }: UserLoginHistoryProps) => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<LoginHistoryEntry[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    fetchHistory();
  }, [userId, page]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_login_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize);

      if (error) throw error;

      if (page === 1) {
        setHistory(data || []);
      } else {
        setHistory(prev => [...prev, ...(data || [])]);
      }
      
      setHasMore((data?.length || 0) > pageSize);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && page === 1) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center py-8">
            Nenhum registro de acesso encontrado
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Histórico de Acesso ({history.length} registros)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {history.map((entry) => {
          const { device, browser } = parseUserAgent(entry.user_agent);
          const DeviceIcon = device === 'Mobile' || device === 'Tablet' ? Smartphone : Monitor;
          
          return (
            <div 
              key={entry.id} 
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
            >
              <div className="mt-0.5">
                <ActionIcon action={entry.action} />
              </div>
              
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <ActionBadge action={entry.action} />
                  {entry.login_method && (
                    <Badge variant="outline" className="text-xs">
                      {entry.login_method === 'password' ? 'Senha' : entry.login_method}
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {new Date(entry.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {entry.ip_address && (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {entry.ip_address}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <DeviceIcon className="h-3 w-3" />
                    {device} • {browser}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {hasMore && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full" 
            onClick={() => setPage(p => p + 1)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ChevronDown className="h-4 w-4 mr-2" />
            )}
            Carregar mais
          </Button>
        )}
      </CardContent>
    </Card>
  );
};