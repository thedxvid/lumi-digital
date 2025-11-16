import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Type } from "lucide-react";

export interface TextOverlayConfig {
  headline: string;
  secondary: string;
  cta: string;
  textPosition: 'top' | 'center' | 'bottom';
  textColor: string;
  fontSize: 'small' | 'medium' | 'large';
  shadowIntensity: number;
}

interface TextOverlayFormProps {
  suggestedCopy?: {
    headline: string;
    secondary: string;
    cta: string;
  };
  onApply: (config: TextOverlayConfig) => void;
  loading?: boolean;
}

export function TextOverlayForm({ suggestedCopy, onApply, loading }: TextOverlayFormProps) {
  const [config, setConfig] = useState<TextOverlayConfig>({
    headline: suggestedCopy?.headline || '',
    secondary: suggestedCopy?.secondary || '',
    cta: suggestedCopy?.cta || '',
    textPosition: 'center',
    textColor: '#FFFFFF',
    fontSize: 'medium',
    shadowIntensity: 10
  });

  const handleSubmit = () => {
    if (!config.headline.trim()) {
      return;
    }
    onApply(config);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="w-5 h-5" />
          Adicionar Texto ao Criativo
        </CardTitle>
        <CardDescription>
          Configure o texto que será sobreposto à imagem
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Headline */}
        <div className="space-y-2">
          <Label htmlFor="headline">Título Principal *</Label>
          <Input
            id="headline"
            placeholder="Título chamativo (máx. 60 caracteres)"
            maxLength={60}
            value={config.headline}
            onChange={(e) => setConfig({ ...config, headline: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            {config.headline.length}/60 caracteres
          </p>
        </div>

        {/* Secondary */}
        <div className="space-y-2">
          <Label htmlFor="secondary">Texto Secundário</Label>
          <Textarea
            id="secondary"
            placeholder="Descrição adicional (máx. 120 caracteres)"
            maxLength={120}
            rows={2}
            value={config.secondary}
            onChange={(e) => setConfig({ ...config, secondary: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            {config.secondary.length}/120 caracteres
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-2">
          <Label htmlFor="cta">Call to Action</Label>
          <Input
            id="cta"
            placeholder="Ex: Saiba Mais, Compre Agora (máx. 30 chars)"
            maxLength={30}
            value={config.cta}
            onChange={(e) => setConfig({ ...config, cta: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            {config.cta.length}/30 caracteres
          </p>
        </div>

        {/* Text Position */}
        <div className="space-y-2">
          <Label>Posição do Texto</Label>
          <Select 
            value={config.textPosition} 
            onValueChange={(value: any) => setConfig({ ...config, textPosition: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Topo</SelectItem>
              <SelectItem value="center">Centro</SelectItem>
              <SelectItem value="bottom">Rodapé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Text Color */}
        <div className="space-y-2">
          <Label htmlFor="textColor">Cor do Texto</Label>
          <div className="flex gap-2">
            <Input
              id="textColor"
              type="color"
              value={config.textColor}
              onChange={(e) => setConfig({ ...config, textColor: e.target.value })}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={config.textColor}
              onChange={(e) => setConfig({ ...config, textColor: e.target.value })}
              placeholder="#FFFFFF"
              className="flex-1"
            />
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <Label>Tamanho da Fonte</Label>
          <Select 
            value={config.fontSize} 
            onValueChange={(value: any) => setConfig({ ...config, fontSize: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Pequeno</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="large">Grande</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Shadow Intensity */}
        <div className="space-y-2">
          <Label>Intensidade da Sombra</Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[config.shadowIntensity]}
              onValueChange={([value]) => setConfig({ ...config, shadowIntensity: value })}
              min={0}
              max={20}
              step={1}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground w-8">
              {config.shadowIntensity}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit} 
          disabled={!config.headline.trim() || loading}
          className="w-full"
        >
          {loading ? 'Aplicando texto...' : 'Aplicar Texto ao Criativo'}
        </Button>
      </CardContent>
    </Card>
  );
}
