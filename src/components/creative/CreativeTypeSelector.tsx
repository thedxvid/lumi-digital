import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";

export interface CreativeType {
  value: string;
  label: string;
  icon: string;
  description: string;
}

const creativeTypes: CreativeType[] = [
  {
    value: 'social-post',
    label: 'Post para Redes Sociais',
    icon: '📱',
    description: 'Instagram, Facebook, LinkedIn'
  },
  {
    value: 'story',
    label: 'Story/Reels',
    icon: '📖',
    description: 'Instagram Stories, TikTok'
  },
  {
    value: 'ad',
    label: 'Anúncio Pago',
    icon: '🎯',
    description: 'Facebook Ads, Google Display'
  },
  {
    value: 'banner',
    label: 'Banner/Header',
    icon: '🖼️',
    description: 'Site, blog, e-commerce'
  },
  {
    value: 'email',
    label: 'E-mail Marketing',
    icon: '📧',
    description: 'Newsletter, campanha'
  },
  {
    value: 'product',
    label: 'Produto/E-commerce',
    icon: '🛍️',
    description: 'Vitrine, catálogo'
  },
  {
    value: 'infographic',
    label: 'Infográfico',
    icon: '📰',
    description: 'Educacional, informativo'
  },
  {
    value: 'free',
    label: 'Criativo Livre',
    icon: '🎨',
    description: 'Sem restrições'
  }
];

interface CreativeTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CreativeTypeSelector({ value, onChange }: CreativeTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">Tipo de Criativo</Label>
      <RadioGroup value={value} onValueChange={onChange} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {creativeTypes.map((type) => (
          <Card
            key={type.value}
            className={`relative cursor-pointer transition-all hover:border-primary ${
              value === type.value ? 'border-primary bg-primary/5' : ''
            }`}
          >
            <label htmlFor={type.value} className="cursor-pointer block p-4">
              <div className="flex items-start gap-3">
                <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{type.icon}</span>
                    <span className="font-medium">{type.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
              </div>
            </label>
          </Card>
        ))}
      </RadioGroup>
    </div>
  );
}

export { creativeTypes };
