import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreativeTypeSelector } from "./CreativeTypeSelector";
import { FormatSelector } from "./FormatSelector";
import { Loader2, Sparkles, Type, RatioIcon } from "lucide-react";

const ASPECT_RATIOS = [
  { value: '1:1', label: 'Quadrado', description: '1:1' },
  { value: '9:16', label: 'Stories/Reels', description: '9:16' },
  { value: '16:9', label: 'Landscape', description: '16:9' },
  { value: '4:5', label: 'Feed', description: '4:5' },
];

export interface CreativeConfig {
  creativeType: string;
  format: string;
  aspectRatio?: string;
  customPrompt?: string;
  mainText?: string;
  secondaryText?: string;
  callToAction?: string;
}
interface CreativeConfigFormProps {
  onGenerate: (config: CreativeConfig) => void;
  loading: boolean;
  generationMode?: 'with-image' | 'prompt-only';
}
export function CreativeConfigForm({
  onGenerate,
  loading,
  generationMode = 'with-image'
}: CreativeConfigFormProps) {
  const [config, setConfig] = useState<CreativeConfig>({
    creativeType: 'social-post',
    format: 'square',
    aspectRatio: '1:1',
    customPrompt: '',
    mainText: '',
    secondaryText: '',
    callToAction: ''
  });
  const updateConfig = (field: keyof CreativeConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(config);
  };
  return <form onSubmit={handleSubmit} className="space-y-6">
      {generationMode === 'prompt-only' ? <>
          {/* Aspect Ratio Selector for prompt-only mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RatioIcon className="w-5 h-5" />
                Proporção da Imagem
              </CardTitle>
              <CardDescription>
                Escolha o formato do criativo que será gerado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <Button
                    key={ratio.value}
                    type="button"
                    variant={config.aspectRatio === ratio.value ? 'default' : 'outline'}
                    onClick={() => updateConfig('aspectRatio', ratio.value)}
                    className="flex flex-col h-auto py-3"
                  >
                    <span className="font-medium">{ratio.label}</span>
                    <span className="text-xs opacity-70">{ratio.description}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Descreva seu Criativo
              </CardTitle>
              <CardDescription>
                Descreva detalhadamente o criativo que você deseja gerar. Seja específico sobre cores, estilo, composição e formato.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea value={config.customPrompt || ''} onChange={e => updateConfig('customPrompt', e.target.value)} placeholder="Ex: Crie um post para Instagram quadrado com fundo azul gradiente, estilo moderno e minimalista, composição centralizada com espaço para texto..." className="min-h-[300px] resize-y" />
              <p className="text-xs text-muted-foreground mt-2">
                {config.customPrompt?.length || 0} caracteres
              </p>
            </CardContent>
          </Card>
        </> : <>
          <Card>
            <CardHeader>
              <CardTitle>Tipo e Formato</CardTitle>
              <CardDescription>Escolha o tipo de criativo e suas dimensões</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CreativeTypeSelector value={config.creativeType} onChange={value => updateConfig('creativeType', value)} />
              <Separator />
              <FormatSelector creativeType={config.creativeType} value={config.format} onChange={value => updateConfig('format', value)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                Texto do Criativo (PRO)
              </CardTitle>
              <CardDescription>
                O texto será gerado diretamente na imagem usando IA avançada. Deixe em branco para adicionar depois.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mainText">Texto Principal / Headline</Label>
                <Input 
                  id="mainText" 
                  value={config.mainText || ''} 
                  onChange={e => updateConfig('mainText', e.target.value)} 
                  placeholder="Ex: Oferta Imperdível!" 
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">
                  {config.mainText?.length || 0}/60 caracteres
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryText">Texto Secundário</Label>
                <Input 
                  id="secondaryText" 
                  value={config.secondaryText || ''} 
                  onChange={e => updateConfig('secondaryText', e.target.value)} 
                  placeholder="Ex: Aproveite 50% de desconto em todos os produtos" 
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {config.secondaryText?.length || 0}/100 caracteres
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="callToAction">Call to Action (Botão)</Label>
                <Input 
                  id="callToAction" 
                  value={config.callToAction || ''} 
                  onChange={e => updateConfig('callToAction', e.target.value)} 
                  placeholder="Ex: Compre Agora" 
                  maxLength={30}
                />
                <p className="text-xs text-muted-foreground">
                  {config.callToAction?.length || 0}/30 caracteres
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Prompt Visual
            </CardTitle>
              <CardDescription>
                Descreva o estilo visual, cores e composição do criativo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="customPrompt">Descreva o visual que você quer</Label>
                <Textarea id="customPrompt" value={config.customPrompt || ''} onChange={e => updateConfig('customPrompt', e.target.value)} placeholder="Ex: Fundo com gradiente azul para roxo, estilo moderno e clean, com elementos geométricos sutis..." className="min-h-[120px] resize-y" />
                <p className="text-xs text-muted-foreground">
                  {config.customPrompt?.length || 0} caracteres
                </p>
              </div>
            </CardContent>
          </Card>
        </>}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Gerando Criativo...
          </> : <>
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar Criativo Base
          </>}
      </Button>
    </form>;
}