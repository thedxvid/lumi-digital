import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CarouselGallery } from '@/components/creative/CarouselGallery';
import { CarouselConfigForm, type CarouselConfig } from '@/components/creative/CarouselConfigForm';
import { CarouselResultModal } from '@/components/creative/CarouselResultModal';
import { ApiTierBadge } from '@/components/dashboard/ApiTierBadge';
import { BYOKCostIndicator } from '@/components/byok/BYOKCostIndicator';
import { useCarousel } from '@/hooks/useCarousel';
import { useBYOKCosts } from '@/hooks/useBYOKCosts';
export default function CreativeCarousel() {
  const {
    generateCarousel,
    loading
  } = useCarousel();
  const { hasBYOK, registerCost, estimateCarouselCost: estimateCost } = useBYOKCosts();
  const [slideCount, setSlideCount] = useState(3);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [lastGeneratedCarousel, setLastGeneratedCarousel] = useState<any>(null);
  const handleGenerate = async (config: CarouselConfig) => {
    console.log('🎨 handleGenerate called', config);
    const numSlides = config.imageCount || 3;
    setSlideCount(numSlides);
    const result = await generateCarousel(config);
    if (result) {
      setLastGeneratedCarousel(result);
      setResultModalOpen(true);
      // Registrar custo BYOK se aplicável
      if (hasBYOK) {
        const cost = estimateCost(numSlides, 'nano-banana-pro');
        await registerCost('carousel', 'nano-banana-pro', cost, { imageCount: numSlides });
      }
    }
  };
  return <div className="w-full max-w-6xl mx-auto space-y-6 px-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            Carrosséis com IA
          </h1>
          <ApiTierBadge size="md" />
        </div>
        <p className="text-muted-foreground">Gere carrosséis de imagens sequenciais para Instagram e redes sociais </p>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="create">Criar Carrossel</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6 space-y-4">
          {hasBYOK && (
            <BYOKCostIndicator 
              estimatedCost={estimateCost(slideCount, 'nano-banana-pro')} 
              featureType="carousel" 
              model="Nano Banana PRO"
              slideCount={slideCount}
            />
          )}
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