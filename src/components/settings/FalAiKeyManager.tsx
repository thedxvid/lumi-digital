import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useApiKeyIntegrations } from '@/hooks/useApiKeyIntegrations';
import { Video, Check, X, Loader2, ExternalLink, AlertCircle } from 'lucide-react';

export function FalAiKeyManager() {
  const { keys, loading, validating, saveKey, validateKey, deleteKey, maskApiKey } = useApiKeyIntegrations();
  const [apiKey, setApiKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const falKey = keys.find(k => k.provider === 'fal_ai');
  const isConnected = !!falKey && falKey.is_active;
  const isValid = falKey?.is_valid;

  useEffect(() => {
    if (!isConnected) {
      setIsEditing(true);
    }
  }, [isConnected]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      return;
    }
    const success = await saveKey('fal_ai', apiKey);
    if (success) {
      setApiKey('');
      setIsEditing(false);
      // Auto-validate after saving
      setTimeout(() => validateKey('fal_ai'), 500);
    }
  };

  const handleDisconnect = async () => {
    const success = await deleteKey('fal_ai');
    if (success) {
      setIsEditing(true);
      setApiKey('');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-lumi-purple/20">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-lumi-purple/10 rounded-lg">
            <Video className="h-5 w-5 text-lumi-purple" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              Fal.ai (Geração de Vídeos)
              {isConnected && isValid && (
                <span className="flex items-center gap-1 text-sm font-normal text-green-600">
                  <Check className="h-4 w-4" />
                  Conectado
                </span>
              )}
              {isConnected && isValid === false && (
                <span className="flex items-center gap-1 text-sm font-normal text-destructive">
                  <X className="h-4 w-4" />
                  Inválida
                </span>
              )}
              {isConnected && isValid === null && (
                <span className="flex items-center gap-1 text-sm font-normal text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  Pendente validação
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Use sua própria conta Fal.ai para gerar vídeos ilimitados
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected || isEditing ? (
          <>
            <Alert>
              <AlertDescription className="text-sm space-y-2">
                <p className="font-medium">ℹ️ Como obter sua API Key:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Acesse <a href="https://fal.ai" target="_blank" rel="noopener noreferrer" className="text-lumi-purple hover:underline inline-flex items-center gap-1">
                    fal.ai <ExternalLink className="h-3 w-3" />
                  </a> e crie uma conta</li>
                  <li>Vá em Settings → API Keys</li>
                  <li>Crie uma nova key e copie</li>
                  <li>Cole abaixo e conecte</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="fal-api-key">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="fal-api-key"
                  type="password"
                  placeholder="fal_*****************************"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button 
                  onClick={handleSave}
                  disabled={!apiKey.trim() || validating}
                  className="bg-lumi-purple hover:bg-lumi-purple/90"
                >
                  {validating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Conectar'
                  )}
                </Button>
              </div>
            </div>

            <Alert className="bg-lumi-gold/10 border-lumi-gold/20">
              <AlertDescription className="text-sm">
                <p className="font-medium text-foreground">💡 Vantagens de usar sua própria key:</p>
                <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Vídeos ilimitados (limite só da fal.ai)</li>
                  <li>Seus créditos Lumi são preservados</li>
                  <li>Custos diretos na sua conta fal.ai</li>
                </ul>
              </AlertDescription>
            </Alert>
          </>
        ) : (
          <>
            <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Key:</span>
                <span className="text-sm font-mono">{maskApiKey(falKey.api_key_encrypted)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Vídeos gerados:</span>
                <span className="text-sm font-semibold">{falKey.credits_used_count}</span>
              </div>
              {falKey.last_validated_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Última validação:</span>
                  <span className="text-sm">
                    {new Date(falKey.last_validated_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => validateKey('fal_ai')}
                disabled={validating}
                className="flex-1"
              >
                {validating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validando...
                  </>
                ) : (
                  'Validar Key'
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
              >
                Desconectar
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}