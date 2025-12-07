import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [generationMode, setGenerationMode] = useState<'config' | 'prompt-only'>('config');
  const [title, setTitle] = useState('');
  const [imageCount, setImageCount] = useState(3);
  const [theme, setTheme] = useState('minimalist');
  const [colorPalette, setColorPalette] = useState('vibrant');
  const [tone, setTone] = useState('professional');
  const [callToAction, setCallToAction] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
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
    onGenerate({ title, imageCount, theme, colorPalette, tone, callToAction, slides, generationMode, customPrompt, uploadedImages });
  };

  const canGenerate = title.trim() !== '' && (
    (generationMode === 'config' && slides.slice(0, imageCount).every(s => {
      // Validar baseado no imageMode
      if (s.imageMode === 'upload') {
        return s.uploadedImageIndex !== null && uploadedImages[s.uploadedImageIndex];
      }
      if (s.imageMode === 'generate' || s.imageMode === 'generate-with-reference') {
        return s.visualInstruction.trim() !== '';
      }
      return true;
    })) || 
    (generationMode === 'prompt-only' && customPrompt.trim())
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Modo</CardTitle></CardHeader>
        <CardContent>
          <Tabs value={generationMode} onValueChange={(v) => setGenerationMode(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="config">Detalhado</TabsTrigger>
              <TabsTrigger value="prompt-only">Prompt Direto</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>
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
      {generationMode === 'config' ? (
        <>
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
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Prompt Personalizado</CardTitle>
            <CardDescription>Descreva cada slide e como deve ser a imagem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CarouselImageUploader images={uploadedImages} onImagesChange={setUploadedImages} maxImages={10} />
            <Textarea 
              value={customPrompt} 
              onChange={(e) => setCustomPrompt(e.target.value)} 
              placeholder="Ex: Quero 3 slides.&#10;Slide 1: Use minha foto. Frase motivacional sobre começar.&#10;Slide 2: Me coloque em Paris. Frase sobre sonhos.&#10;Slide 3: Fundo branco minimalista. Frase sobre conquistas."
              className="min-h-[200px]" 
              disabled={loading} 
            />
          </CardContent>
        </Card>
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
