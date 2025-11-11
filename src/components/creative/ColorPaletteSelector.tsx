import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ColorPalette {
  value: string;
  label: string;
  icon: string;
  description: string;
}

const colorPalettes: ColorPalette[] = [
  { value: 'warm', label: 'Quentes', icon: '🔴', description: 'Vermelho, laranja, amarelo' },
  { value: 'cool', label: 'Frias', icon: '🔵', description: 'Azul, verde, roxo' },
  { value: 'complementary', label: 'Complementares', icon: '🎨', description: 'Contraste alto' },
  { value: 'pastel', label: 'Pastéis', icon: '🌸', description: 'Tons suaves' },
  { value: 'monochromatic', label: 'Monocromática', icon: '⚫', description: 'Variações de uma cor' },
  { value: 'vibrant', label: 'Vibrante', icon: '🌈', description: 'Saturação alta' },
  { value: 'neutral', label: 'Neutra', icon: '🤍', description: 'Branco, preto, cinza' }
];

interface ColorPaletteSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ColorPaletteSelector({ value, onChange }: ColorPaletteSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Paleta de Cores</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {colorPalettes.map((palette) => (
            <SelectItem key={palette.value} value={palette.value}>
              <div className="flex items-center gap-2">
                <span>{palette.icon}</span>
                <div>
                  <div className="font-medium">{palette.label}</div>
                  <div className="text-xs text-muted-foreground">{palette.description}</div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { colorPalettes };
