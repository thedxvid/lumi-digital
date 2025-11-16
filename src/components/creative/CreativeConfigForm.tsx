import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreativeTypeSelector } from "./CreativeTypeSelector";
import { FormatSelector } from "./FormatSelector";
import { Loader2, Sparkles } from "lucide-react";

export interface CreativeConfig {
  creativeType: string;
  format: string;
  customPrompt?: string;
}

interface CreativeConfigFormProps {
  onGenerate: (config: CreativeConfig) => void;
  loading: boolean;
  generationMode?: 'with-image' | 'prompt-only';
}

export function CreativeConfigForm({ onGenerate, loading, generationMode = 'with-image' }: CreativeConfigFormProps) {
  const [config, setConfig] = useState<CreativeConfig>({
    creativeType: 'social-post',
    format: 'square',
    customPrompt: ''
  });

  const updateConfig = (field: keyof CreativeConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(config);
  };

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
              Descreva detalhadamente o criativo que você deseja gerar. Seja específico sobre cores, estilo, composição e formato.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={config.customPrompt || ''}
              onChange={(e) => updateConfig('customPrompt', e.target.value)}
              placeholder="Ex: Crie um post para Instagram quadrado com fundo azul gradiente, estilo moderno e minimalista, composição centralizada com espaço para texto..."
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
              <CardTitle>Tipo e Formato</CardTitle>
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
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Prompt Personalizado (Opcional)
              </CardTitle>
              <CardDescription>
                Descreva exatamente como você quer o criativo visual. O texto será adicionado depois.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="customPrompt">Descreva o visual que você quer</Label>
                <Textarea
                  id="customPrompt"
                  value={config.customPrompt || ''}
                  onChange={(e) => updateConfig('customPrompt', e.target.value)}
                  placeholder="Ex: Fundo com gradiente azul para roxo, estilo moderno e clean, com elementos geométricos sutis nas bordas, deixe espaço central para texto..."
                  className="min-h-[150px] resize-y"
                />
                <p className="text-xs text-muted-foreground">
                  {config.customPrompt?.length || 0} caracteres
                </p>
                <p className="text-xs text-muted-foreground">
                  💡 Dica: Foque na descrição visual. Você adicionará o texto na próxima etapa.
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
            Gerar Criativo Base
          </>
        )}
      </Button>
    </form>
  );
}
