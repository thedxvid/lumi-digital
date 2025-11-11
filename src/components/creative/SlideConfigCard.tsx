import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { SlideConfig } from './CarouselConfigForm';

interface SlideConfigCardProps {
  slideNumber: number;
  slide: SlideConfig;
  onChange: (slide: SlideConfig) => void;
  disabled: boolean;
}

const visualElementOptions = [
  { id: 'icons', label: 'Ícones' },
  { id: 'charts', label: 'Gráficos' },
  { id: 'photos', label: 'Fotos' },
  { id: 'illustrations', label: 'Ilustrações' },
];

export function SlideConfigCard({ slideNumber, slide, onChange, disabled }: SlideConfigCardProps) {
  const [isOpen, setIsOpen] = useState(slideNumber === 1);

  const handleVisualElementToggle = (elementId: string, checked: boolean) => {
    const newElements = checked
      ? [...slide.visualElements, elementId]
      : slide.visualElements.filter(e => e !== elementId);
    
    onChange({ ...slide, visualElements: newElements });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border border-border bg-card">
        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              {slideNumber}
            </div>
            <span className="font-medium">
              {slide.title || `Slide ${slideNumber}`}
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="space-y-4 p-4 pt-0">
            <div className="space-y-2">
              <Label htmlFor={`slide-${slideNumber}-title`}>Título do Slide *</Label>
              <Input
                id={`slide-${slideNumber}-title`}
                placeholder={`Ex: Passo ${slideNumber}`}
                value={slide.title}
                onChange={(e) => onChange({ ...slide, title: e.target.value })}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`slide-${slideNumber}-content`}>Descrição/Conteúdo *</Label>
              <Textarea
                id={`slide-${slideNumber}-content`}
                placeholder="Descreva o que deve aparecer neste slide..."
                value={slide.content}
                onChange={(e) => onChange({ ...slide, content: e.target.value })}
                disabled={disabled}
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Elementos Visuais</Label>
              <div className="grid grid-cols-2 gap-3">
                {visualElementOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`slide-${slideNumber}-${option.id}`}
                      checked={slide.visualElements.includes(option.id)}
                      onCheckedChange={(checked) => 
                        handleVisualElementToggle(option.id, checked as boolean)
                      }
                      disabled={disabled}
                    />
                    <Label
                      htmlFor={`slide-${slideNumber}-${option.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`slide-${slideNumber}-highlight`}>
                Destaque Especial (Opcional)
              </Label>
              <Input
                id={`slide-${slideNumber}-highlight`}
                placeholder="Texto ou elemento para destacar"
                value={slide.highlight || ''}
                onChange={(e) => onChange({ ...slide, highlight: e.target.value })}
                disabled={disabled}
              />
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
