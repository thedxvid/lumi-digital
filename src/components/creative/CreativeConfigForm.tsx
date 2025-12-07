import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreativeTypeSelector } from "./CreativeTypeSelector";
import { FormatSelector } from "./FormatSelector";
import { Loader2, Sparkles, Type, RatioIcon, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [promptWithImage, setPromptWithImage] = useState('');
  const [promptOnly, setPromptOnly] = useState('');
  const [enhancing, setEnhancing] = useState(false);
  
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

  const enhancePrompt = async (isPromptOnly: boolean) => {
    const currentPrompt = isPromptOnly ? promptOnly : promptWithImage;
    
    if (!currentPrompt.trim()) {
      toast.error('Digite um prompt primeiro');
      return;
    }

    setEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-prompt', {
        body: { 
          prompt: currentPrompt,
          context: config.creativeType
        }
      });

      if (error) throw error;

      if (data?.enhancedPrompt) {
        if (isPromptOnly) {
          setPromptOnly(data.enhancedPrompt);
        } else {
          setPromptWithImage(data.enhancedPrompt);
        }
        toast.success('Prompt melhorado com sucesso!');
      }
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      toast.error('Erro ao melhorar o prompt');
    } finally {
      setEnhancing(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Map aspectRatio to format for prompt-only mode
    const aspectRatioToFormat: Record<string, string> = {
      '1:1': 'square',
      '9:16': 'story-vertical',
      '16:9': 'horizontal',
      '4:5': 'vertical'
    };
    
    const finalConfig = {
      ...config,
      format: generationMode === 'prompt-only' 
        ? aspectRatioToFormat[config.aspectRatio || '1:1'] || 'square'
        : config.format,
      customPrompt: generationMode === 'prompt-only' ? promptOnly : promptWithImage
    };
    onGenerate(finalConfig);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {generationMode === 'prompt-only' ? (
        <>
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
            <CardContent className="space-y-3">
              <Textarea 
                value={promptOnly} 
                onChange={e => setPromptOnly(e.target.value)} 
                placeholder="Ex: Crie um post para Instagram quadrado com fundo azul gradiente, estilo moderno e minimalista, composição centralizada com espaço para texto..." 
                className="min-h-[300px] resize-y" 
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {promptOnly.length} caracteres
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => enhancePrompt(true)}
                  disabled={enhancing || !promptOnly.trim()}
                  className="gap-2"
                >
                  {enhancing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  Melhorar Prompt
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
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
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="customPrompt">Descreva o visual que você quer</Label>
                <Textarea 
                  id="customPrompt" 
                  value={promptWithImage} 
                  onChange={e => setPromptWithImage(e.target.value)} 
                  placeholder="Ex: Fundo com gradiente azul para roxo, estilo moderno e clean, com elementos geométricos sutis..." 
                  className="min-h-[120px] resize-y" 
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {promptWithImage.length} caracteres
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => enhancePrompt(false)}
                  disabled={enhancing || !promptWithImage.trim()}
                  className="gap-2"
                >
                  {enhancing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  Melhorar Prompt
                </Button>
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
            Gerar Criativo Base
          </>
        )}
      </Button>
    </form>
  );
}