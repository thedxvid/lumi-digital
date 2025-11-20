import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Calendar, CreditCard, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Purchase {
  id: string;
  package_type: string;
  credits_amount: number;
  price_paid: number;
  purchased_at: string;
  expires_at: string | null;
  is_active: boolean;
  stripe_payment_id: string | null;
}

export function PurchaseHistory() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPurchases();
    }
  }, [user]);

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('video_addons')
        .select('*')
        .eq('user_id', user?.id)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPackageName = (type: string) => {
    const packages: Record<string, string> = {
      'addon_10': 'Pacote +10 Vídeos',
      'addon_20': 'Pacote +20 Vídeos',
      'addon_30': 'Pacote +30 Vídeos'
    };
    return packages[type] || type;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Histórico de Compras
          </CardTitle>
          <CardDescription>
            Carregando seu histórico de compras...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Histórico de Compras
        </CardTitle>
        <CardDescription>
          Veja todas as suas compras de pacotes extras de vídeos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {purchases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Você ainda não realizou nenhuma compra</p>
            <p className="text-sm mt-1">
              Seus pacotes extras aparecerão aqui após a compra
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">
                        {getPackageName(purchase.package_type)}
                      </h3>
                      <Badge variant={purchase.is_active ? 'default' : 'secondary'}>
                        {purchase.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {purchase.credits_amount} créditos de vídeo
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {formatPrice(purchase.price_paid)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {format(new Date(purchase.purchased_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  {purchase.stripe_payment_id && (
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-3.5 w-3.5" />
                      <span className="font-mono text-xs">
                        {purchase.stripe_payment_id.substring(0, 20)}...
                      </span>
                    </div>
                  )}
                </div>

                {purchase.expires_at && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Expira em: {format(new Date(purchase.expires_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
