import { useState } from 'react';
import { ImageUploader } from '@/components/creative/ImageUploader';
import { CreativeHistoryGallery } from '@/components/creative/CreativeHistoryGallery';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useCreativeEngine } from '@/hooks/useCreativeEngine';
import { Loader2, Sparkles } from 'lucide-react';

export default function CreativeEngine() {
  const [images, setImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { loading, generateCreative } = useCreativeEngine();

  const handleGenerate = async () => {
    const result = await generateCreative(images, prompt);
    if (result) {
      setGeneratedImage(result);
      setImages([]);
      setPrompt('');
    }
  };

  const canGenerate = images.length > 0 && prompt.trim().length > 0 && !loading;

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          Máquina de Criativos
        </h1>
        <p className="text-muted-foreground">
          Combine suas imagens e use IA para criar criativos incríveis
        </p>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="create">Criar Criativo</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Upload de Imagens</h2>
            <ImageUploader 
              images={images} 
              onImagesChange={setImages}
              maxImages={10}
            />
          </Card>

          {images.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Instruções para a IA
              </h2>
              <Textarea
                placeholder="Descreva o que você quer fazer com essas imagens. Ex: 'Combine todas em um layout de carrossel' ou 'Melhore a qualidade e adicione um filtro profissional'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] mb-4"
              />
              <Button 
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando Criativo...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Criativo
                  </>
                )}
              </Button>
            </Card>
          )}

          {generatedImage && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Criativo Gerado ✨
              </h2>
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <img
                  src={generatedImage}
                  alt="Criativo gerado"
                  className="w-full h-full object-contain bg-muted"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = generatedImage;
                    link.download = `criativo-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex-1"
                >
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setGeneratedImage(null)}
                >
                  Criar Novo
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">
              Seus Criativos
            </h2>
            <CreativeHistoryGallery />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}