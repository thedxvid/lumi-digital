import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useApiKeyIntegrations } from '@/hooks/useApiKeyIntegrations';
import { ExternalLink, Settings, CheckCircle2, XCircle, Video, Zap, Shield, DollarSign, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function VideoAddons() {
  const { limits, loading: limitsLoading } = useUsageLimits();
  const { keys, loading: keysLoading } = useApiKeyIntegrations();

  const falAiKey = keys.find(k => k.provider === 'fal_ai' && k.is_active);
  const isConnected = !!falAiKey;

  if (limitsLoading || keysLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const klingUsed = limits?.kling_image_videos_lifetime_used || 0;
  const klingTotal = limits?.kling_image_videos_lifetime_limit || 0;

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          🎥 Vídeos Ilimitados com sua Própria API
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Conecte sua conta Fal.ai e gere vídeos sem limites de quantidade!
        </p>
      </div>

      {/* Current Status */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Seus Créditos Atuais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Vídeos Kling (cortesia)</p>
                <p className="text-2xl font-bold text-foreground">
                  {klingTotal - klingUsed}/{klingTotal}
                </p>
              </div>
              <Video className="h-8 w-8 text-primary" />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">API Própria</p>
                <p className="text-lg font-bold flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-green-500">Conectada</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                      <span className="text-muted-foreground">Não conectada</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">📋 Como Conectar sua API Fal.ai</CardTitle>
          <CardDescription>
            Siga estes passos simples para configurar vídeos ilimitados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1 */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge variant="default" className="rounded-full w-8 h-8 flex items-center justify-center">1</Badge>
              <h3 className="text-lg font-semibold">Crie sua Conta na Fal.ai</h3>
            </div>
            <ul className="ml-11 space-y-1 text-muted-foreground">
              <li>• Acesse <a href="https://fal.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">fal.ai</a> e crie uma conta gratuita</li>
              <li>• Adicione créditos à sua conta (sugestão: $5 ≈ 8 vídeos)</li>
              <li>• Os preços são diretos da Fal.ai (~$0.60 por vídeo de 8s)</li>
            </ul>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge variant="default" className="rounded-full w-8 h-8 flex items-center justify-center">2</Badge>
              <h3 className="text-lg font-semibold">Gere sua API Key</h3>
            </div>
            <ul className="ml-11 space-y-1 text-muted-foreground">
              <li>• Na Fal.ai, vá em <strong>Settings → API Keys</strong></li>
              <li>• Clique em <strong>"Create new key"</strong></li>
              <li>• Copie a key gerada (ela começa com "fal_...")</li>
            </ul>
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge variant="default" className="rounded-full w-8 h-8 flex items-center justify-center">3</Badge>
              <h3 className="text-lg font-semibold">Conecte na Lumi</h3>
            </div>
            <ul className="ml-11 space-y-1 text-muted-foreground">
              <li>• Vá em <strong>Configurações → Integrações</strong></li>
              <li>• Cole sua API Key no campo da Fal.ai</li>
              <li>• Clique em <strong>"Conectar"</strong> e pronto!</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button asChild size="lg" className="flex-1">
              <a href="https://fal.ai" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Acessar Fal.ai
              </a>
            </Button>
            <Button asChild size="lg" variant="secondary" className="flex-1">
              <Link to="/app/settings">
                <Settings className="mr-2 h-4 w-4" />
                Ir para Configurações
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">💡 Vantagens de Usar sua Própria API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
              <Video className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Vídeos Ilimitados</p>
                <p className="text-sm text-muted-foreground">Sem limites mensais ou diários</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Acesso Exclusivo ao Veo 3</p>
                <p className="text-sm text-muted-foreground">Google Veo 3 Fast (text + image-to-video)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
              <DollarSign className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Você Controla seus Gastos</p>
                <p className="text-sm text-muted-foreground">Pague apenas pelo que usar</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
              <Zap className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Créditos Lumi Preservados</p>
                <p className="text-sm text-muted-foreground">Seus créditos de cortesia não são consumidos</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Mesma Qualidade</p>
                <p className="text-sm text-muted-foreground">Kling v2.5 Pro + Veo 3</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">❓ Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Quanto custa gerar vídeos com minha própria API?</AccordionTrigger>
              <AccordionContent>
                Os preços são cobrados diretamente pela Fal.ai. Em média, um vídeo de 8 segundos 
                custa aproximadamente $0.60 USD. Você paga apenas pelo que usar, sem mensalidades.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Qual modelo de IA será utilizado?</AccordionTrigger>
              <AccordionContent>
                Com sua API conectada, você terá acesso a: <strong>Kling v2.5 Pro</strong> (mesmo da plataforma) 
                e <strong>Google Veo 3 Fast</strong> (exclusivo para BYOK). O modelo é selecionado por você 
                no formulário de geração, com base no tipo de geração (text-to-video ou image-to-video).
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Minha API Key é segura?</AccordionTrigger>
              <AccordionContent>
                Sim! Sua API Key é armazenada de forma criptografada no banco de dados e nunca é 
                exposta no frontend. Apenas você tem acesso à sua key através das configurações.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>E se eu não quiser conectar minha API?</AccordionTrigger>
              <AccordionContent>
                Sem problemas! Você ainda pode usar seus créditos de cortesia (2 vídeos Kling) 
                inclusos no plano. A conexão da API própria é totalmente opcional.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger>Posso desconectar minha API a qualquer momento?</AccordionTrigger>
              <AccordionContent>
                Sim! Você pode desconectar sua API Key a qualquer momento através das Configurações → Integrações. 
                O sistema voltará automaticamente a usar os créditos da plataforma.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
