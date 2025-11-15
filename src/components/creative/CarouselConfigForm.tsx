import { useState } from 'react';
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
    { title: '', content: '', visualElements: [] },
    { title: '', content: '', visualElements: [] },
    { title: '', content: '', visualElements: [] },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({ title, imageCount, theme, colorPalette, tone, callToAction, slides, generationMode, customPrompt, uploadedImages });
  };

  const canGenerate = title.trim() !== '' && ((generationMode === 'config' && slides.every(s => s.title && s.content)) || (generationMode === 'prompt-only' && customPrompt.trim()));

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
      {generationMode === 'prompt-only' && <Card><CardContent className="pt-6"><Textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="Descreva o carrossel..." className="min-h-[200px]" /></CardContent></Card>}
      {generationMode === 'config' && <>{slides.map((s, i) => <SlideConfigCard key={i} slideNumber={i+1} slide={s} onChange={(u) => { const n = [...slides]; n[i] = u; setSlides(n); }} disabled={false} />)}<CarouselImageUploader images={uploadedImages} onImagesChange={setUploadedImages} maxImages={imageCount} /></>}
      <Button type="submit" className="w-full" disabled={loading || !canGenerate}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando...</> : <><Sparkles className="mr-2 h-4 w-4" />Gerar</>}</Button>
    </form>
  );
}
