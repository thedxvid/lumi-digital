import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface Format {
  value: string;
  label: string;
  dimensions: string;
}

const formatsByType: Record<string, Format[]> = {
  'social-post': [
    { value: 'square', label: '1:1 Quadrado', dimensions: '1080x1080' },
    { value: 'vertical', label: '4:5 Vertical', dimensions: '1080x1350' },
    { value: 'horizontal', label: '16:9 Horizontal', dimensions: '1200x675' }
  ],
  'story': [
    { value: 'story-vertical', label: '9:16 Vertical', dimensions: '1080x1920' }
  ],
  'ad': [
    { value: 'ad-square', label: '1:1 Quadrado', dimensions: '1200x1200' },
    { value: 'ad-horizontal', label: '1.91:1 Horizontal', dimensions: '1200x628' },
    { value: 'ad-vertical', label: '4:5 Vertical', dimensions: '1080x1350' }
  ],
  'banner': [
    { value: 'banner-wide', label: '16:9 Widescreen', dimensions: '1920x1080' },
    { value: 'banner-ultra', label: '21:9 Ultra-wide', dimensions: '2560x1080' },
    { value: 'banner-custom', label: 'Custom', dimensions: 'Personalizado' }
  ],
  'email': [
    { value: 'email-standard', label: 'Email Padrão', dimensions: '600x800' }
  ],
  'product': [
    { value: 'product-square', label: '1:1 Quadrado', dimensions: '1000x1000' },
    { value: 'product-vertical', label: '3:4 Vertical', dimensions: '1000x1333' }
  ],
  'infographic': [
    { value: 'infographic-vertical', label: 'Vertical', dimensions: '800x2000' },
    { value: 'infographic-horizontal', label: 'Horizontal', dimensions: '2000x800' }
  ],
  'free': [
    { value: 'free-square', label: 'Quadrado', dimensions: '1080x1080' },
    { value: 'free-custom', label: 'Personalizado', dimensions: 'Livre' }
  ]
};

interface FormatSelectorProps {
  creativeType: string;
  value: string;
  onChange: (value: string) => void;
}

export function FormatSelector({ creativeType, value, onChange }: FormatSelectorProps) {
  const formats = formatsByType[creativeType] || formatsByType['free'];

  // Auto-select first format when creative type changes
  if (!formats.find(f => f.value === value)) {
    onChange(formats[0].value);
  }

  return (
    <div className="space-y-2">
      <Label>Formato e Dimensões</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {formats.map((format) => (
            <SelectItem key={format.value} value={format.value}>
              <div className="flex items-center justify-between gap-4">
                <span>{format.label}</span>
                <span className="text-xs text-muted-foreground">{format.dimensions}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { formatsByType };
