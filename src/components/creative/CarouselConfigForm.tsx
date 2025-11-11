import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Loader2, Sparkles } from 'lucide-react';
import { SlideConfigCard } from './SlideConfigCard';

export interface SlideConfig {
  title: string;
  content: string;
  visualElements: string[];
  highlight?: string;
}

export interface CarouselConfig {
  title: string;
  imageCount: number;
  theme: string;
  colorPalette: string;
  tone: string;
  callToAction?: string;
  slides: SlideConfig[];
}

interface CarouselConfigFormProps {
  onGenerate: (config: CarouselConfig) => void;
  loading: boolean;
}

export function CarouselConfigForm({ onGenerate, loading }: CarouselConfigFormProps) {
  const [title, setTitle] = useState('');
  const [imageCount, setImageCount] = useState(3);
  const [theme, setTheme] = useState('modern');
  const [colorPalette, setColorPalette] = useState('vibrant');
  const [tone, setTone] = useState('professional');
  const [callToAction, setCallToAction] = useState('');
  const [slides, setSlides] = useState<SlideConfig[]>([
    { title: '', content: '', visualElements: [], highlight: '' },
    { title: '', content: '', visualElements: [], highlight: '' },
    { title: '', content: '', visualElements: [], highlight: '' },
  ]);

  const handleImageCountChange = (value: number) => {
    setImageCount(value);
    const newSlides = [...slides];
    
    if (value > slides.length) {
      for (let i = slides.length; i < value; i++) {
        newSlides.push({ title: '', content: '', visualElements: [], highlight: '' });
      }
    } else if (value < slides.length) {
      newSlides.splice(value);
    }
    
    setSlides(newSlides);
  };

  const updateSlide = (index: number, updatedSlide: SlideConfig) => {
    const newSlides = [...slides];
    newSlides[index] = updatedSlide;
    setSlides(newSlides);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      title,
      imageCount,
      theme,
      colorPalette,
      tone,
      callToAction: callToAction.trim() || undefined,
      slides,
    });
  };

  const canGenerate = title.trim().length > 0 && slides.some(s => s.content.trim().length > 0) && !loading;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* General Settings */}
      <div className="space-y-6 rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold">Configurações Gerais</h3>
        
        <div className="space-y-2">
          <Label htmlFor="title">Título do Carrossel *</Label>
          <Input
            id="title"
            placeholder="Ex: Benefícios do Exercício Físico"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="space-y-3">
          <Label>Número de Slides: {imageCount}</Label>
          <Slider
            value={[imageCount]}
            onValueChange={([value]) => handleImageCountChange(value)}
            min={2}
            max={10}
            step={1}
            disabled={loading}
          />
          <p className="text-sm text-muted-foreground">
            Escolha entre 2 e 10 slides para seu carrossel
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="theme">Tema/Estilo Visual</Label>
            <Select value={theme} onValueChange={setTheme} disabled={loading}>
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minimalist">Minimalista</SelectItem>
                <SelectItem value="vibrant">Vibrante</SelectItem>
                <SelectItem value="professional">Profissional</SelectItem>
                <SelectItem value="modern">Moderno</SelectItem>
                <SelectItem value="creative">Criativo</SelectItem>
                <SelectItem value="elegant">Elegante</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="colorPalette">Paleta de Cores</Label>
            <Select value={colorPalette} onValueChange={setColorPalette} disabled={loading}>
              <SelectTrigger id="colorPalette">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warm">Cores Quentes</SelectItem>
                <SelectItem value="cool">Cores Frias</SelectItem>
                <SelectItem value="pastel">Tons Pastéis</SelectItem>
                <SelectItem value="high-contrast">Alto Contraste</SelectItem>
                <SelectItem value="monochrome">Monocromático</SelectItem>
                <SelectItem value="vibrant">Gradiente Vibrante</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">Tom de Voz</Label>
            <Select value={tone} onValueChange={setTone} disabled={loading}>
              <SelectTrigger id="tone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Profissional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="motivational">Motivacional</SelectItem>
                <SelectItem value="educational">Educacional</SelectItem>
                <SelectItem value="sales">Vendas</SelectItem>
                <SelectItem value="inspirational">Inspirador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cta">Call-to-Action (Opcional)</Label>
            <Input
              id="cta"
              placeholder="Ex: Saiba Mais, Compre Agora"
              value={callToAction}
              onChange={(e) => setCallToAction(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Slide Configurations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Conteúdo dos Slides</h3>
        <div className="space-y-3">
          {slides.map((slide, index) => (
            <SlideConfigCard
              key={index}
              slideNumber={index + 1}
              slide={slide}
              onChange={(updatedSlide) => updateSlide(index, updatedSlide)}
              disabled={loading}
            />
          ))}
        </div>
      </div>

      <Button 
        type="submit"
        disabled={!canGenerate}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Gerando {imageCount} slides...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar Carrossel
          </>
        )}
      </Button>
    </form>
  );
}
