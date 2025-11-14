import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreativeEngine } from "@/hooks/useCreativeEngine";
import { ImageUploader } from "@/components/creative/ImageUploader";
import { CreativeHistoryGallery } from "@/components/creative/CreativeHistoryGallery";
import { CreativeConfigForm, type CreativeConfig } from "@/components/creative/CreativeConfigForm";
import { CreativeResultModal } from "@/components/creative/CreativeResultModal";
import { toast } from "sonner";

export default function CreativeEngine() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [config, setConfig] = useState<CreativeConfig | null>(null);
  const [generationMode, setGenerationMode] = useState<'with-image' | 'prompt-only'>('with-image');
  
  const { generateCreative, loading, history, loadHistory, deleteHistoryItem, toggleFavorite, resultModalOpen, setResultModalOpen, generatedImageUrl } = useCreativeEngine();

  useEffect(() => { loadHistory(); }, []);

  const handleGenerate = async (formConfig: CreativeConfig) => {
    if (generationMode === 'with-image' && uploadedImages.length === 0) {
      toast.error('Por favor, adicione pelo menos uma imagem');
      return;
    }
    if (generationMode === 'prompt-only' && (!formConfig.customPrompt || !formConfig.customPrompt.trim())) {
      toast.error('Por favor, insira um prompt personalizado');
      return;
    }

    const imagesToUse = generationMode === 'prompt-only' ? [] : uploadedImages;
    
    if (formConfig.customPrompt && formConfig.customPrompt.trim()) {
      setConfig(formConfig);
      await generateCreative(imagesToUse, formConfig.customPrompt.trim(), formConfig);
      return;
    }

    const fullPrompt = `Create a ${formConfig.creativeType} creative...`;
    setConfig(formConfig);
    await generateCreative(imagesToUse, fullPrompt, formConfig);
  };

  return (
    <>
      <div className="w-full max-w-7xl mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-2">Máquina de Criativos</h1>
        <Tabs defaultValue="create">
          <TabsList><TabsTrigger value="create">Criar</TabsTrigger><TabsTrigger value="results">Resultados</TabsTrigger></TabsList>
          <TabsContent value="create" className="space-y-6 mt-6">
            <Card>
              <CardHeader><CardTitle>Modo de Geração</CardTitle></CardHeader>
              <CardContent>
                <Tabs value={generationMode} onValueChange={(v) => setGenerationMode(v as any)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="with-image">Com Imagem Base</TabsTrigger>
                    <TabsTrigger value="prompt-only">Apenas Prompt</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>
            {generationMode === 'with-image' && <ImageUploader images={uploadedImages} onImagesChange={setUploadedImages} maxImages={10} />}
            <CreativeConfigForm loading={loading} onGenerate={handleGenerate} />
          </TabsContent>
          <TabsContent value="results"><CreativeHistoryGallery history={history} onDelete={deleteHistoryItem} onToggleFavorite={toggleFavorite} /></TabsContent>
        </Tabs>
      </div>
      <CreativeResultModal open={resultModalOpen} onClose={() => setResultModalOpen(false)} imageUrl={generatedImageUrl} onRegenerate={() => config && handleGenerate(config)} isLoading={loading} />
    </>
  );
}
