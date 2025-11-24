import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Search } from 'lucide-react';
import { useApiCosts } from '@/hooks/useApiCosts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export const CostBreakdownTable = () => {
  const { costs } = useApiCosts();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCosts = costs
    .filter((cost) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        cost.feature_type.toLowerCase().includes(search) ||
        cost.api_provider.toLowerCase().includes(search) ||
        cost.user_id?.toLowerCase().includes(search)
      );
    })
    .slice(0, 100);

  const exportToCSV = () => {
    const headers = ['Data', 'Hora', 'Feature', 'Provider', 'Custo (USD)', 'User ID'];
    const rows = filteredCosts.map((cost) => [
      format(new Date(cost.created_at), 'dd/MM/yyyy', { locale: ptBR }),
      format(new Date(cost.created_at), 'HH:mm:ss'),
      cost.feature_type,
      cost.api_provider,
      Number(cost.cost_usd).toFixed(4),
      cost.user_id || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `api-costs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getFeatureBadgeColor = (feature: string) => {
    const colors: Record<string, string> = {
      video: 'bg-purple-500',
      creative_image: 'bg-blue-500',
      carousel: 'bg-green-500',
      profile_analysis: 'bg-orange-500',
      chat: 'bg-pink-500',
      other: 'bg-gray-500',
    };
    return colors[feature] || 'bg-gray-500';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Últimas Operações</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[200px]"
            />
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Feature</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead>User ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum custo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredCosts.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(cost.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge className={getFeatureBadgeColor(cost.feature_type)} variant="secondary">
                        {cost.feature_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{cost.api_provider}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      ${Number(cost.cost_usd).toFixed(4)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {cost.user_id ? cost.user_id.slice(0, 8) + '...' : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
