import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreativeTypeSelector } from "./CreativeTypeSelector";
import { FormatSelector } from "./FormatSelector";
import { StyleVisualSelector } from "./StyleVisualSelector";
import { ColorPaletteSelector } from "./ColorPaletteSelector";
import { Loader2, AlertCircle, Eye, Sparkles } from "lucide-react";

export interface CreativeConfig {
  creativeType: string;
  format: string;
  objective: string;
  market?: string;
  targetAudience?: string;
  visualStyle: string;
  colorPalette?: string;
  typography: string;
  mainText: string;
  secondaryText: string;
  callToAction: string;
  tone: string;
  customPrompt?: string;
}

interface CreativeConfigFormProps {
  onGenerate: (config: CreativeConfig) => void;
  loading: boolean;
  generationMode?: 'with-image' | 'prompt-only';
}

const objectives = [
  { value: 'sales', label: '💰 Vendas', description: 'Converter e gerar vendas diretas' },
  { value: 'engagement', label: '🎯 Engajamento', description: 'Curtidas, comentários, compartilhamentos' },
  { value: 'educational', label: '📚 Educacional', description: 'Ensinar, informar, agregar valor' },
  { value: 'awareness', label: '🔔 Awareness', description: 'Aumentar reconhecimento de marca' },
  { value: 'promotional', label: '🎁 Promocional', description: 'Promoção, desconto, oferta' },
  { value: 'informative', label: 'ℹ️ Informativo', description: 'Comunicar novidade, atualização' }
];

const typographies = [
  { value: 'sans-serif', label: 'Sans-serif Moderna', description: 'Limpa, legível' },
  { value: 'serif', label: 'Serif Clássica', description: 'Elegante, tradicional' },
  { value: 'display', label: 'Display/Impacto', description: 'Chamativa, títulos' },
  { value: 'handwritten', label: 'Handwritten', description: 'Pessoal, casual' }
];

const tones = [
  { value: 'professional', label: '💼 Profissional' },
  { value: 'casual', label: '😊 Casual/Amigável' },
  { value: 'motivational', label: '🔥 Motivacional' },
  { value: 'educational', label: '🎓 Educacional' },
  { value: 'persuasive', label: '💰 Persuasivo/Vendas' },
  { value: 'humorous', label: '😂 Bem-humorado' }
];

export function CreativeConfigForm({ onGenerate, loading, generationMode = 'with-image' }: CreativeConfigFormProps) {
  const [config, setConfig] = useState<CreativeConfig>({
    creativeType: 'social-post',
    format: 'square',
    objective: 'engagement',
    visualStyle: 'modern',
    typography: 'sans-serif',
    mainText: '',
    secondaryText: '',
    callToAction: '',
    tone: 'professional',
    customPrompt: ''
  });

  const updateConfig = (field: keyof CreativeConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(config);
  };

  const hasSpecialChars = (text: string) => /[çãõáéíóúâêôàñ]/i.test(text);
  const hasAnySpecialChars = hasSpecialChars(config.mainText) || 
                             hasSpecialChars(config.secondaryText) || 
                             hasSpecialChars(config.callToAction);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {generationMode === 'prompt-only' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Descreva seu Criativo
            </CardTitle>
            <CardDescription>
              Descreva detalhadamente o criativo que você deseja gerar. Seja específico sobre cores, textos, estilo e formato.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={config.customPrompt || ''}
              onChange={(e) => updateConfig('customPrompt', e.target.value)}
              placeholder="Ex: Crie um post para Instagram quadrado com fundo azul gradiente, texto principal 'Promoção Imperdível' em fonte grande e branca, subtexto 'Apenas hoje!' em amarelo, e botão 'Compre Agora' em vermelho com cantos arredondados..."
              className="min-h-[300px] resize-y"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {config.customPrompt?.length || 0} caracteres
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>1. Tipo e Formato</CardTitle>
              <CardDescription>Escolha o tipo de criativo e suas dimensões</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CreativeTypeSelector 
                value={config.creativeType} 
                onChange={(value) => updateConfig('creativeType', value)} 
              />
              <Separator />
              <FormatSelector 
                creativeType={config.creativeType}
                value={config.format}
                onChange={(value) => updateConfig('format', value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Objetivo do Criativo</CardTitle>
              <CardDescription>Defina o propósito do seu criativo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Objetivo</Label>
                <Select value={config.objective} onValueChange={(value) => updateConfig('objective', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {objectives.map((obj) => (
                      <SelectItem key={obj.value} value={obj.value}>
                        <div>
                          <div className="font-medium">{obj.label}</div>
                          <div className="text-xs text-muted-foreground">{obj.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Estilo e Identidade Visual</CardTitle>
              <CardDescription>Personalize a aparência do seu criativo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <StyleVisualSelector 
                value={config.visualStyle}
                onChange={(value) => updateConfig('visualStyle', value)}
              />
              <Separator />
              <div className="space-y-2">
                <Label>Tipografia</Label>
                <Select value={config.typography} onValueChange={(value) => updateConfig('typography', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typographies.map((typo) => (
                      <SelectItem key={typo.value} value={typo.value}>
                        <div>
                          <div className="font-medium">{typo.label}</div>
                          <div className="text-xs text-muted-foreground">{typo.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Conteúdo e Mensagem</CardTitle>
              <CardDescription>Adicione os textos do seu criativo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasAnySpecialChars && (
                <Alert className="border-orange-500/50 bg-orange-500/10">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <AlertDescription className="text-sm">
                    <strong>Atenção:</strong> Caracteres especiais podem não ser renderizados corretamente.
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="mainText">Texto Principal</Label>
                <Input
                  id="mainText"
                  value={config.mainText}
                  onChange={(e) => updateConfig('mainText', e.target.value)}
                  placeholder="Ex: Grande Promoção!"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {config.mainText.length}/100 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryText">Texto Secundário (Opcional)</Label>
                <Input
                  id="secondaryText"
                  value={config.secondaryText}
                  onChange={(e) => updateConfig('secondaryText', e.target.value)}
                  placeholder="Ex: Até 50% de desconto"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {config.secondaryText.length}/100 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="callToAction">Call to Action</Label>
                <Input
                  id="callToAction"
                  value={config.callToAction}
                  onChange={(e) => updateConfig('callToAction', e.target.value)}
                  placeholder="Ex: Compre Agora!"
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  {config.callToAction.length}/50 caracteres
                </p>
              </div>

              {(config.mainText || config.secondaryText || config.callToAction) && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm font-medium">Preview</span>
                  </div>
                  <div className="space-y-2">
                    {config.mainText && <p className="text-lg font-bold">{config.mainText}</p>}
                    {config.secondaryText && <p className="text-sm text-muted-foreground">{config.secondaryText}</p>}
                    {config.callToAction && <p className="text-sm font-semibold text-primary">{config.callToAction}</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Tom de Voz</CardTitle>
              <CardDescription>Escolha o tom para os textos</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={config.tone} onValueChange={(value) => updateConfig('tone', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tones.map((tone) => (
                    <SelectItem key={tone.value} value={tone.value}>
                      {tone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                6. Prompt Personalizado (Opcional)
              </CardTitle>
              <CardDescription>
                Descreva exatamente o que você quer no criativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="customPrompt">Seu Prompt</Label>
                <Textarea
                  id="customPrompt"
                  value={config.customPrompt || ''}
                  onChange={(e) => updateConfig('customPrompt', e.target.value)}
                  placeholder="Ex: Crie um post para Instagram quadrado com fundo azul..."
                  className="min-h-[120px] resize-y"
                />
                <p className="text-xs text-muted-foreground">
                  {config.customPrompt?.length || 0} caracteres
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Gerando Criativo...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar Criativo
          </>
        )}
      </Button>
    </form>
  );
}
