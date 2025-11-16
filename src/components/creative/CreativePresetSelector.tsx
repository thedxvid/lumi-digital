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
      customPrompt: 'Fundo vibrante com gradiente de laranja para vermelho, elementos energéticos, composição dinâmica com espaço destacado para texto motivacional, estilo moderno e impactante'
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
      customPrompt: 'Fundo clean e elegante em tons pastéis, composição sofisticada com espaço central amplo para produto, bordas sutis, estilo minimalista e profissional'
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
      customPrompt: 'Fundo tecnológico com gradiente azul escuro, elementos geométricos modernos, grid sutil, composição limpa com espaço para destaque de texto, estilo corporativo e inovador'
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
      customPrompt: 'Fundo quente e apetitoso com cores vibrantes (amarelo, laranja, vermelho), textura sutil de madeira ou concreto, composição aconchegante com espaço central destacado, estilo casual e convidativo'
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
      customPrompt: 'Fundo neutro e profissional (branco/cinza claro), elementos organizados verticalmente, ícones minimalistas, grade estruturada com seções bem definidas, estilo clean e didático'
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
      customPrompt: 'Fundo elegante e sofisticado com tons pastéis (rosa, nude, dourado), textura suave, elementos florais sutis, composição delicada com espaço central amplo, estilo feminino e luxuoso'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {presets.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              className="h-auto flex-col items-start p-4 space-y-2"
              onClick={() => onSelectPreset(preset.config)}
            >
              <div className="text-2xl">{preset.icon}</div>
              <div className="text-left">
                <div className="font-semibold">{preset.name}</div>
                <div className="text-xs text-muted-foreground">{preset.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
