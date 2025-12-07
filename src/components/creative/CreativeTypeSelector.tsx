import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface CreativeType {
  value: string;
  label: string;
  icon: string;
  description: string;
}

const creativeTypes: CreativeType[] = [
  {
    value: 'social-post',
    label: 'Post Redes Sociais',
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
    <div className="space-y-2">
      <Label className="text-sm font-medium">Tipo de Criativo</Label>
      <TooltipProvider delayDuration={300}>
        <div className="flex flex-wrap gap-2">
          {creativeTypes.map((type) => (
            <Tooltip key={type.value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onChange(type.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all
                    ${value === type.value 
                      ? 'border-primary bg-primary/10 text-primary font-medium' 
                      : 'border-border hover:border-primary/50 hover:bg-muted'
                    }`}
                >
                  <span className="text-base">{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {type.description}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}

export { creativeTypes };
