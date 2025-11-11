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
  // Tipo e Formato
  creativeType: string;
  format: string;
  
  // Objetivo e Contexto
  objective: string;
  market: string;
  targetAudience: string;
  
  // Estilo Visual
  visualStyle: string;
  colorPalette: string;
  typography: string;
  
  // Conteúdo
  mainText: string;
  secondaryText: string;
  callToAction: string;
  
  // Avançado
  tone: string;
}

interface CreativeConfigFormProps {
  onGenerate: (config: CreativeConfig) => void;
  loading: boolean;
}

const objectives = [
  { value: 'sales', label: '💰 Vendas', description: 'Converter e gerar vendas diretas' },
  { value: 'engagement', label: '🎯 Engajamento', description: 'Curtidas, comentários, compartilhamentos' },
  { value: 'educational', label: '📚 Educacional', description: 'Ensinar, informar, agregar valor' },
  { value: 'awareness', label: '🔔 Awareness', description: 'Aumentar reconhecimento de marca' },
  { value: 'promotional', label: '🎁 Promocional', description: 'Promoção, desconto, oferta' },
  { value: 'informative', label: 'ℹ️ Informativo', description: 'Comunicar novidade, atualização' }
];

const markets = [
  '🏋️ Fitness e Saúde',
  '🍔 Alimentação e Gastronomia',
  '💼 Negócios e Empreendedorismo',
  '🎓 Educação e Cursos',
  '💄 Beleza e Estética',
  '🏠 Imóveis e Arquitetura',
  '👗 Moda e Vestuário',
  '💻 Tecnologia e Software',
  '🎮 Entretenimento e Jogos',
  '🚗 Automotivo',
  '🌱 Sustentabilidade',
  '✨ Outro'
];

const audiences = [
  { value: 'professional', label: '👨‍💼 Profissional/Corporativo', description: '25-45 anos' },
  { value: 'young', label: '👦 Jovem/Adolescente', description: '13-24 anos' },
  { value: 'adult', label: '👨 Adulto', description: '25-44 anos' },
  { value: 'mature', label: '👴 Maturidade', description: '45+ anos' },
  { value: 'family', label: '👨‍👩‍👧‍👦 Famílias', description: 'Grupos familiares' }
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

export function CreativeConfigForm({ onGenerate, loading }: CreativeConfigFormProps) {
  const [config, setConfig] = useState<CreativeConfig>({
    creativeType: 'social-post',
    format: 'square',
    objective: 'engagement',
    market: '',
    targetAudience: 'adult',
    visualStyle: 'modern',
    colorPalette: 'vibrant',
    typography: 'sans-serif',
    mainText: '',
    secondaryText: '',
    callToAction: '',
    tone: 'professional'
  });

  const updateConfig = (field: keyof CreativeConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(config);
  };

  const canGenerate = config.market && config.mainText;

  const hasSpecialChars = (text: string) => /[çãõáéíóúâêôàñ]/i.test(text);
  const hasAnySpecialChars = hasSpecialChars(config.mainText) || 
                             hasSpecialChars(config.secondaryText) || 
                             hasSpecialChars(config.callToAction);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seção 1: Tipo e Formato */}
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

      {/* Seção 2: Objetivo e Contexto */}
      <Card>
        <CardHeader>
          <CardTitle>2. Objetivo e Contexto</CardTitle>
          <CardDescription>Defina o propósito e público do criativo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Objetivo do Criativo</Label>
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

          <div className="space-y-2">
            <Label>Mercado/Nicho *</Label>
            <Select value={config.market} onValueChange={(value) => updateConfig('market', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o mercado" />
              </SelectTrigger>
              <SelectContent>
                {markets.map((market) => (
                  <SelectItem key={market} value={market}>
                    {market}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Público-Alvo</Label>
            <Select value={config.targetAudience} onValueChange={(value) => updateConfig('targetAudience', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {audiences.map((audience) => (
                  <SelectItem key={audience.value} value={audience.value}>
                    <div>
                      <div className="font-medium">{audience.label}</div>
                      <div className="text-xs text-muted-foreground">{audience.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Seção 3: Estilo e Identidade Visual */}
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
          <ColorPaletteSelector 
            value={config.colorPalette}
            onChange={(value) => updateConfig('colorPalette', value)}
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

      {/* Seção 4: Conteúdo e Mensagem */}
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
                <strong>⚠️ Caracteres especiais detectados</strong> (ç, ã, etc.)
                <br />
                O modelo de IA pode ter dificuldade em renderizá-los perfeitamente. 
                Revise cuidadosamente o resultado após a geração e regenere se necessário.
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label>Texto Principal *</Label>
            <Input
              placeholder="Ex: Transforme seu corpo em 90 dias"
              value={config.mainText}
              onChange={(e) => updateConfig('mainText', e.target.value)}
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground">{config.mainText.length}/60 caracteres</p>
          </div>

          <div className="space-y-2">
            <Label>Texto Secundário</Label>
            <Textarea
              placeholder="Ex: Método aprovado por mais de 10.000 alunos"
              value={config.secondaryText}
              onChange={(e) => updateConfig('secondaryText', e.target.value)}
              maxLength={150}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{config.secondaryText.length}/150 caracteres</p>
          </div>

          <div className="space-y-2">
            <Label>Call-to-Action</Label>
            <Input
              placeholder={
                config.objective === 'sales' ? 'Ex: Compre Agora' :
                config.objective === 'engagement' ? 'Ex: Comente Aqui' :
                'Ex: Saiba Mais'
              }
              value={config.callToAction}
              onChange={(e) => updateConfig('callToAction', e.target.value)}
              maxLength={30}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview dos Textos */}
      {config.mainText && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Eye className="w-4 h-4" />
              Prévia dos Textos que Serão Renderizados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Texto Principal:</div>
              <div className="text-sm font-medium bg-background/50 p-2 rounded border">
                "{config.mainText}"
              </div>
            </div>
            {config.secondaryText && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Texto Secundário:</div>
                <div className="text-sm bg-background/50 p-2 rounded border">
                  "{config.secondaryText}"
                </div>
              </div>
            )}
            {config.callToAction && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Call-to-Action:</div>
                <div className="text-sm font-medium bg-background/50 p-2 rounded border">
                  "{config.callToAction}"
                </div>
              </div>
            )}
            <div className="flex items-start gap-2 text-xs text-muted-foreground pt-2 border-t">
              <Sparkles className="w-3 h-3 mt-0.5 shrink-0" />
              <p>Estes textos serão renderizados exatamente como aparecem acima. Revise antes de gerar.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção 5: Configurações Avançadas */}
      <Card>
        <CardHeader>
          <CardTitle>5. Tom de Voz</CardTitle>
          <CardDescription>Como você quer se comunicar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Tom de Voz</Label>
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
          </div>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="w-full" disabled={loading || !canGenerate}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Gerando Criativo...
          </>
        ) : (
          'Gerar Criativo'
        )}
      </Button>
    </form>
  );
}
