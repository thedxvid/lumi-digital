import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCarousel } from '@/hooks/useCarousel';
import { Loader2, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CarouselGallery } from '@/components/creative/CarouselGallery';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export default function CreativeCarousel() {
  const [prompt, setPrompt] = useState('');
  const [imageCount, setImageCount] = useState(3);
  const { generateCarousel, loading } = useCarousel();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    await generateCarousel(prompt, imageCount);
    setPrompt('');
  };

  const canGenerate = prompt.trim().length > 0 && !loading;

  return (
    <div className="container max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          Carrosséis com IA
        </h1>
        <p className="text-muted-foreground">
          Gere carrosséis de imagens sequenciais para Instagram e redes sociais usando Nano Banana
        </p>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="create">Criar Carrossel</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">
                Descreva seu carrossel
              </Label>
              <Textarea
                id="prompt"
                placeholder="Ex: Carrossel sobre os benefícios do exercício físico, com estilo moderno e cores vibrantes..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] resize-none"
                disabled={loading}
              />
            </div>

            <div className="space-y-3">
              <Label>
                Número de imagens: {imageCount}
              </Label>
              <Slider
                value={[imageCount]}
                onValueChange={([value]) => setImageCount(value)}
                min={2}
                max={10}
                step={1}
                disabled={loading}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Escolha entre 2 e 10 imagens para seu carrossel
              </p>
            </div>

            <Button 
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando {imageCount} imagens...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Carrossel
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <CarouselGallery />
        </TabsContent>
      </Tabs>
    </div>
  );
}
