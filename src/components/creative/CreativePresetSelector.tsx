import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CreativeConfig } from "./CreativeConfigForm";

interface Preset {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: Partial<CreativeConfig>;
}

const presets: Preset[] = [
  {
    id: 'fitness-promo',
    name: 'Promoção Fitness',
    description: 'Story promocional para academia ou personal trainer',
    icon: '🏋️',
    config: {
      creativeType: 'story',
      format: 'story-vertical',
      objective: 'promotional',
      market: '🏋️ Fitness e Saúde',
      targetAudience: 'adult',
      visualStyle: 'vibrant',
      colorPalette: 'warm',
      typography: 'display',
      tone: 'motivational',
      callToAction: 'Garanta Agora'
    }
  },
  {
    id: 'product-ecommerce',
    name: 'Produto E-commerce',
    description: 'Post de produto para loja virtual',
    icon: '🛍️',
    config: {
      creativeType: 'product',
      format: 'product-square',
      objective: 'sales',
      market: '👗 Moda e Vestuário',
      targetAudience: 'young',
      visualStyle: 'elegant',
      colorPalette: 'pastel',
      typography: 'serif',
      tone: 'professional',
      callToAction: 'Compre Agora'
    }
  },
  {
    id: 'tech-ad',
    name: 'Anúncio Tech',
    description: 'Anúncio pago para software ou tecnologia',
    icon: '💻',
    config: {
      creativeType: 'ad',
      format: 'ad-horizontal',
      objective: 'awareness',
      market: '💻 Tecnologia e Software',
      targetAudience: 'professional',
      visualStyle: 'modern',
      colorPalette: 'cool',
      typography: 'sans-serif',
      tone: 'professional',
      callToAction: 'Saiba Mais'
    }
  },
  {
    id: 'food-social',
    name: 'Post Gastronomia',
    description: 'Post para restaurante ou food delivery',
    icon: '🍔',
    config: {
      creativeType: 'social-post',
      format: 'square',
      objective: 'engagement',
      market: '🍔 Alimentação e Gastronomia',
      targetAudience: 'adult',
      visualStyle: 'bold',
      colorPalette: 'vibrant',
      typography: 'display',
      tone: 'casual',
      callToAction: 'Peça Já'
    }
  },
  {
    id: 'education-infographic',
    name: 'Infográfico Educacional',
    description: 'Conteúdo educativo para curso ou treinamento',
    icon: '🎓',
    config: {
      creativeType: 'infographic',
      format: 'infographic-vertical',
      objective: 'educational',
      market: '🎓 Educação e Cursos',
      targetAudience: 'professional',
      visualStyle: 'professional',
      colorPalette: 'neutral',
      typography: 'sans-serif',
      tone: 'educational',
      callToAction: 'Aprenda Mais'
    }
  },
  {
    id: 'beauty-story',
    name: 'Story Beleza',
    description: 'Story para salão, clínica ou produtos de beleza',
    icon: '💄',
    config: {
      creativeType: 'story',
      format: 'story-vertical',
      objective: 'sales',
      market: '💄 Beleza e Estética',
      targetAudience: 'adult',
      visualStyle: 'elegant',
      colorPalette: 'pastel',
      typography: 'serif',
      tone: 'persuasive',
      callToAction: 'Agende Agora'
    }
  }
];

interface CreativePresetSelectorProps {
  onSelectPreset: (config: Partial<CreativeConfig>) => void;
}

export function CreativePresetSelector({ onSelectPreset }: CreativePresetSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Templates Prontos</CardTitle>
        <CardDescription>Comece rápido com configurações pré-definidas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {presets.map((preset) => (
            <Card key={preset.id} className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{preset.icon}</span>
                  <div>
                    <CardTitle className="text-sm">{preset.name}</CardTitle>
                    <CardDescription className="text-xs">{preset.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => onSelectPreset(preset.config)}
                >
                  Usar Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
