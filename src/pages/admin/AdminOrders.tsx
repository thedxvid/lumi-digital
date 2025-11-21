
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, DollarSign, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  product_name: string;
  product_offer_name?: string;
  checkout_link?: string;
  utm_source?: string;
  utm_campaign?: string;
  order_status: string;
  order_value: number;
  order_value_formatted: string;
  payment_method: string;
  created_at: string;
  access_granted: boolean;
  is_eligible_offer?: boolean;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedOrders: Order[] = (data || []).map(order => ({
        id: order.id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        product_name: order.product_name,
        product_offer_name: order.product_offer_name,
        checkout_link: order.checkout_link,
        utm_source: order.utm_source,
        utm_campaign: order.utm_campaign,
        order_status: order.order_status,
        order_value: Number(order.order_value),
        order_value_formatted: new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        }).format(Number(order.order_value)),
        payment_method: order.payment_method || 'N/A',
        created_at: order.created_at,
        access_granted: order.access_granted || false,
        is_eligible_offer: order.is_eligible_offer
      }));
      
      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os pedidos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-lumi-success';
      case 'waiting_payment':
        return 'bg-yellow-500';
      case 'refused':
      case 'cancelled':
        return 'bg-destructive';
      case 'refunded':
      case 'chargeback':
        return 'bg-orange-500';
      default:
        return 'bg-muted';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'paid': 'Pago',
      'waiting_payment': 'Aguardando',
      'refused': 'Recusado',
      'cancelled': 'Cancelado',
      'refunded': 'Reembolsado',
      'chargeback': 'Chargeback'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-64"></div>
        </div>
      </div>
    );
  }

  const totalRevenue = orders
    .filter(order => order.order_status === 'paid')
    .reduce((sum, order) => sum + Number(order.order_value), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gerenciar Pedidos</h1>
        <p className="text-muted-foreground">Controle de vendas e pagamentos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-lumi-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pagos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-lumi-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => o.order_status === 'paid').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-lumi-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Recentes</CardTitle>
          <CardDescription>
            Lista de todos os pedidos processados via webhook
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">
                      {order.customer_name}
                    </h3>
                    <Badge className={getStatusColor(order.order_status)}>
                      {getStatusLabel(order.order_status)}
                    </Badge>
                    {order.is_eligible_offer && (
                      <Badge variant="outline" className="border-lumi-gold text-lumi-gold">
                        🎉 Black Friday
                      </Badge>
                    )}
                    {order.access_granted && (
                      <Badge variant="outline" className="border-lumi-success text-lumi-success">
                        Acesso Concedido
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-4">
                      <span>{order.customer_email}</span>
                      <span>{order.product_name}</span>
                    </div>
                    {order.product_offer_name && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Oferta:</span>
                        <span>{order.product_offer_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>{order.order_value_formatted}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <span className="capitalize">{order.payment_method}</span>
                    </div>
                    {(order.utm_source || order.utm_campaign) && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium">Origem:</span>
                        {order.utm_source && <span className="bg-muted px-2 py-0.5 rounded">{order.utm_source}</span>}
                        {order.utm_campaign && <span className="bg-muted px-2 py-0.5 rounded">{order.utm_campaign}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum pedido encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOrders;
