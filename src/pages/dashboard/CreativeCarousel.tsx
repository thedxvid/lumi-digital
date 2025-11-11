import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CarouselGallery } from '@/components/creative/CarouselGallery';
import { CarouselConfigForm, type CarouselConfig } from '@/components/creative/CarouselConfigForm';
import { CarouselResultModal } from '@/components/creative/CarouselResultModal';
import { useCarousel } from '@/hooks/useCarousel';
export default function CreativeCarousel() {
  const {
    generateCarousel,
    loading
  } = useCarousel();
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [lastGeneratedCarousel, setLastGeneratedCarousel] = useState<any>(null);
  const handleGenerate = async (config: CarouselConfig) => {
    console.log('🎨 handleGenerate called', config);
    const result = await generateCarousel(config);
    if (result) {
      setLastGeneratedCarousel(result);
      setResultModalOpen(true);
    }
  };
  return <div className="w-full max-w-6xl mx-auto space-y-6 px-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          Carrosséis com IA
        </h1>
        <p className="text-muted-foreground">Gere carrosséis de imagens sequenciais para Instagram e redes sociais </p>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="create">Criar Carrossel</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6">
          <CarouselConfigForm onGenerate={handleGenerate} loading={loading} />
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          <CarouselGallery />
        </TabsContent>
      </Tabs>

      <CarouselResultModal open={resultModalOpen} onOpenChange={setResultModalOpen} carousel={lastGeneratedCarousel} onRegenerate={() => {
      setResultModalOpen(false);
      // Could implement regeneration logic here
    }} />
    </div>;
}