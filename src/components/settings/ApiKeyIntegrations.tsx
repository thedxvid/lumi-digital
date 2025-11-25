import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FalAiKeyManager } from './FalAiKeyManager';
import { Plug } from 'lucide-react';

export function ApiKeyIntegrations() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Plug className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Minhas Integrações</CardTitle>
            <CardDescription>
              Conecte suas próprias APIs para uso ilimitado
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <FalAiKeyManager />
      </CardContent>
    </Card>
  );
}