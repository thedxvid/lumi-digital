import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useApiKeyIntegrations } from '@/hooks/useApiKeyIntegrations';
import { Video, Check, X, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function FalAiKeyManager() {
  const { keys, loading, saving, validating, saveKey, validateKey, deleteKey, maskApiKey } = useApiKeyIntegrations();
  const [apiKey, setApiKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

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
      setJustSaved(true);
      setApiKey('');
      setIsEditing(false);
      // Auto-validate after saving
      setTimeout(() => validateKey('fal_ai'), 500);
      // Reset success state after 3 seconds
      setTimeout(() => setJustSaved(false), 3000);
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
    <motion.div
      animate={justSaved ? { 
        boxShadow: [
          '0 0 0 0 rgba(34, 197, 94, 0)',
          '0 0 20px 4px rgba(34, 197, 94, 0.3)',
          '0 0 0 0 rgba(34, 197, 94, 0)'
        ]
      } : {}}
      transition={{ duration: 1.5 }}
    >
      <Card className={`border-lumi-purple/20 transition-colors duration-500 ${justSaved ? 'border-green-500/50' : ''}`}>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-lumi-purple/10 rounded-lg">
              <Video className="h-5 w-5 text-lumi-purple" />
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 flex-wrap">
                Fal.ai (Geração de Vídeos)
                <AnimatePresence mode="wait">
                  {isConnected && isValid && (
                    <motion.span 
                      key="valid"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="flex items-center gap-1 text-sm font-normal text-green-600"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <Check className="h-4 w-4" />
                      </motion.div>
                      Conectado
                    </motion.span>
                  )}
                  {isConnected && isValid === false && (
                    <motion.span 
                      key="invalid"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="flex items-center gap-1 text-sm font-normal text-destructive"
                    >
                      <X className="h-4 w-4" />
                      Inválida
                    </motion.span>
                  )}
                  {isConnected && isValid === null && !validating && (
                    <motion.span 
                      key="pending"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="flex items-center gap-1 text-sm font-normal text-yellow-600"
                    >
                      <AlertCircle className="h-4 w-4" />
                      Pendente validação
                    </motion.span>
                  )}
                  {validating && (
                    <motion.span 
                      key="validating"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="flex items-center gap-1 text-sm font-normal text-blue-600"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Validando...
                    </motion.span>
                  )}
                </AnimatePresence>
              </CardTitle>
              <CardDescription>
                Use sua própria conta Fal.ai para gerar vídeos ilimitados
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Success Banner */}
          <AnimatePresence>
            {justSaved && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
                    className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center"
                  >
                    <Check className="h-5 w-5 text-green-600" />
                  </motion.div>
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">
                      Chave conectada com sucesso!
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      Validando sua chave automaticamente...
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Validation in progress indicator */}
          <AnimatePresence>
            {validating && !justSaved && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Validando sua API Key com a Fal.ai...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                    disabled={!apiKey.trim() || saving || validating}
                    className="bg-lumi-purple hover:bg-lumi-purple/90 min-w-[100px]"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Conectar'
                    )}
                  </Button>
                </div>
              </div>

              <Alert className="bg-lumi-gold/10 border-lumi-gold/20">
                <AlertDescription className="text-sm">
                  <p className="font-medium text-foreground">💡 O que muda ao conectar sua chave:</p>
                  <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
                    <li><strong>Veo 3.1:</strong> Desbloqueado apenas com sua chave</li>
                    <li><strong>Nano Banana PRO:</strong> Criativos com texto nativo</li>
                    <li><strong>Kling:</strong> Continua usando seus créditos Lumi</li>
                    <li><strong>Créditos Lumi:</strong> Preservados para Kling e outros recursos</li>
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground/80">
                    Você pode desconectar a qualquer momento e voltar a usar apenas os créditos do plano.
                  </p>
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 bg-muted/50 p-4 rounded-lg"
              >
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
              </motion.div>

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
    </motion.div>
  );
}
