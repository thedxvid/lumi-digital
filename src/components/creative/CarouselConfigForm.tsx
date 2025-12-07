import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2 } from 'lucide-react';
import { SlideConfigCard } from './SlideConfigCard';
import { CarouselImageUploader } from './CarouselImageUploader';

export interface SlideConfig {
  imageMode: 'upload' | 'generate' | 'generate-with-reference';
  uploadedImageIndex: number | null;
  visualInstruction: string;
  headline?: string;
  secondaryText?: string;
  ctaText?: string;
  textColor?: string;
  format?: string; // 'square', 'vertical', 'story-vertical', 'horizontal', 'original'
}

export interface CarouselConfig {
  title: string;
  imageCount: number;
  theme: string;
  colorPalette: string;
  tone: string;
  callToAction?: string;
  slides: SlideConfig[];
  generationMode?: 'config' | 'prompt-only';
  customPrompt?: string;
  uploadedImages?: string[];
}

interface CarouselConfigFormProps {
  loading: boolean;
  onGenerate: (config: CarouselConfig) => void;
}

export function CarouselConfigForm({ loading, onGenerate }: CarouselConfigFormProps) {
  const generationMode = 'config'; // Sempre modo detalhado
  const [title, setTitle] = useState('');
  const [imageCount, setImageCount] = useState(3);
  const [theme, setTheme] = useState('minimalist');
  const [colorPalette, setColorPalette] = useState('vibrant');
  const [tone, setTone] = useState('professional');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [slides, setSlides] = useState<SlideConfig[]>([
    { imageMode: 'generate', uploadedImageIndex: null, visualInstruction: '' },
    { imageMode: 'generate', uploadedImageIndex: null, visualInstruction: '' },
    { imageMode: 'generate', uploadedImageIndex: null, visualInstruction: '' },
  ]);

  // Ajustar número de slides quando imageCount mudar
  useEffect(() => {
    if (slides.length < imageCount) {
      // Adicionar mais slides
      const newSlides = [...slides];
      while (newSlides.length < imageCount) {
        newSlides.push({ 
          imageMode: 'generate', 
          uploadedImageIndex: null, 
          visualInstruction: '' 
        });
      }
      setSlides(newSlides);
    } else if (slides.length > imageCount) {
      // Remover slides excedentes
      setSlides(slides.slice(0, imageCount));
    }
  }, [imageCount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({ title, imageCount, theme, colorPalette, tone, slides, generationMode, uploadedImages });
  };

  const canGenerate = title.trim() !== '' && slides.slice(0, imageCount).every(s => {
    if (s.imageMode === 'upload') {
      return s.uploadedImageIndex !== null && uploadedImages[s.uploadedImageIndex];
    }
    if (s.imageMode === 'generate' || s.imageMode === 'generate-with-reference') {
      return s.visualInstruction.trim() !== '';
    }
    return true;
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div><Label>Título *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label>Slides: {imageCount}</Label><Slider value={[imageCount]} onValueChange={([v]) => setImageCount(v)} min={2} max={10} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Tema</Label><Select value={theme} onValueChange={setTheme}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minimalist">Minimalista</SelectItem><SelectItem value="vibrant">Vibrante</SelectItem></SelectContent></Select></div>
            <div><Label>Paleta</Label><Select value={colorPalette} onValueChange={setColorPalette}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="vibrant">Vibrante</SelectItem><SelectItem value="pastel">Pastel</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent>
      </Card>
      <CarouselImageUploader images={uploadedImages} onImagesChange={setUploadedImages} maxImages={10} />
      {slides.slice(0, imageCount).map((slide, i) => (
        <SlideConfigCard 
          key={i} 
          slideNumber={i + 1} 
          slide={slide} 
          onChange={(s) => {
            const newSlides = [...slides];
            newSlides[i] = s;
            setSlides(newSlides);
          }} 
          disabled={loading}
          uploadedImagesCount={uploadedImages.length}
          showTextFields={true}
        />
      ))}
      {!canGenerate && !loading && (
        <p className="text-xs text-muted-foreground text-center">
          {!title.trim() 
            ? 'Preencha o título do carrossel'
            : 'Configure todas as instruções visuais ou selecione as fotos para cada slide'}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading || !canGenerate}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Gerando...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Gerar
          </>
        )}
      </Button>
    </form>
  );
}
