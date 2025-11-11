import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";

export interface VisualStyle {
  value: string;
  label: string;
  icon: string;
  description: string;
}

const visualStyles: VisualStyle[] = [
  {
    value: 'minimalist',
    label: 'Minimalista',
    icon: '🎨',
    description: 'Limpo, simples, espaço em branco'
  },
  {
    value: 'modern',
    label: 'Moderno/Tech',
    icon: '⚡',
    description: 'Gradientes, neon, futurista'
  },
  {
    value: 'vibrant',
    label: 'Vibrante/Colorido',
    icon: '🌈',
    description: 'Cores vivas, energético'
  },
  {
    value: 'elegant',
    label: 'Elegante/Premium',
    icon: '🏛️',
    description: 'Sofisticado, luxo, refinado'
  },
  {
    value: 'creative',
    label: 'Divertido/Criativo',
    icon: '🎪',
    description: 'Lúdico, ilustrações'
  },
  {
    value: 'professional',
    label: 'Profissional',
    icon: '📐',
    description: 'Sério, confiável, formal'
  },
  {
    value: 'natural',
    label: 'Natural/Orgânico',
    icon: '🌿',
    description: 'Texturas naturais, tons terrosos'
  },
  {
    value: 'bold',
    label: 'Bold/Impactante',
    icon: '🎯',
    description: 'Alto contraste, chamativo'
  }
];

interface StyleVisualSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function StyleVisualSelector({ value, onChange }: StyleVisualSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">Estilo Visual</Label>
      <RadioGroup value={value} onValueChange={onChange} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {visualStyles.map((style) => (
          <Card
            key={style.value}
            className={`relative cursor-pointer transition-all hover:border-primary ${
              value === style.value ? 'border-primary bg-primary/5' : ''
            }`}
          >
            <label htmlFor={style.value} className="cursor-pointer block p-3">
              <div className="flex items-start gap-3">
                <RadioGroupItem value={style.value} id={style.value} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xl">{style.icon}</span>
                    <span className="font-medium text-sm">{style.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{style.description}</p>
                </div>
              </div>
            </label>
          </Card>
        ))}
      </RadioGroup>
    </div>
  );
}

export { visualStyles };
