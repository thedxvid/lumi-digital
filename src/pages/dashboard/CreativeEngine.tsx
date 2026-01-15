import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCreativeEngine } from "@/hooks/useCreativeEngine";
import { ImageUploader } from "@/components/creative/ImageUploader";
import { CreativeHistoryGallery } from "@/components/creative/CreativeHistoryGallery";
import { CreativeConfigForm, type CreativeConfig } from "@/components/creative/CreativeConfigForm";
import { CreativeResultModal } from "@/components/creative/CreativeResultModal";
import { CreativeGenerationProgress } from "@/components/creative/CreativeGenerationProgress";
import { ApiTierBadge } from "@/components/dashboard/ApiTierBadge";
import { BYOKCostIndicator } from "@/components/byok/BYOKCostIndicator";
import { useBYOKCosts } from "@/hooks/useBYOKCosts";
import { useUsageLimits } from "@/hooks/useUsageLimits";
import { GenerationErrorCard } from "@/components/shared/GenerationErrorCard";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CreativeEngine() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [config, setConfig] = useState<CreativeConfig | null>(null);
  const [generationMode, setGenerationMode] = useState<'with-image' | 'prompt-only'>('with-image');
  
  const { hasBYOK, registerCost, estimateImageCost } = useBYOKCosts();
  const { hasByok } = useUsageLimits();
  const imageCost = estimateImageCost('nano-banana-pro');
  
  const { 
    generateCreative, 
    applyTextToCreative,
    loading, 
    history, 
    loadHistory, 
    deleteHistoryItem, 
    toggleFavorite, 
    resultModalOpen, 
    setResultModalOpen, 
    generatedImageUrl,
    suggestedCopy,
    errorType,
    errorMessage,
    clearError
  } = useCreativeEngine();

  useEffect(() => { loadHistory(); }, []);

  const handleGenerate = async (formConfig: CreativeConfig) => {
    // Validações
    if (generationMode === 'with-image' && uploadedImages.length === 0) {
      toast.error('Por favor, adicione pelo menos uma imagem');
      return;
    }
    if (generationMode === 'prompt-only' && (!formConfig.customPrompt || !formConfig.customPrompt.trim())) {
      toast.error('Por favor, insira um prompt personalizado');
      return;
    }

    const imagesToUse = generationMode === 'prompt-only' ? [] : uploadedImages;
    
    // No modo prompt-only, usa apenas o customPrompt
    if (generationMode === 'prompt-only') {
      setConfig(formConfig);
      const result = await generateCreative(imagesToUse, formConfig.customPrompt!.trim(), formConfig);
      if (result && hasBYOK) {
        await registerCost('creative_image', 'nano-banana-pro', imageCost);
      }
      return;
    }
    
    // No modo with-image, pode usar customPrompt ou gerar um prompt baseado na config
    if (formConfig.customPrompt && formConfig.customPrompt.trim()) {
      setConfig(formConfig);
      const result = await generateCreative(imagesToUse, formConfig.customPrompt.trim(), formConfig);
      if (result && hasBYOK) {
        await registerCost('creative_image', 'nano-banana-pro', imageCost);
      }
      return;
    }

    const fullPrompt = `Create a ${formConfig.creativeType} creative...`;
    setConfig(formConfig);
    const result = await generateCreative(imagesToUse, fullPrompt, formConfig);
    if (result && hasBYOK) {
      await registerCost('creative_image', 'nano-banana-pro', imageCost);
    }
  };

  return (
    <>
      <div className="w-full max-w-7xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Máquina de Criativos</h1>
          <ApiTierBadge size="md" />
        </div>
        <Tabs defaultValue="create">
          <TabsList><TabsTrigger value="create">Criar</TabsTrigger><TabsTrigger value="results">Resultados</TabsTrigger></TabsList>
          <TabsContent value="create" className="space-y-6 mt-6">
            {/* Error Alert */}
            {errorType && (
              <GenerationErrorCard
                errorType={errorType}
                errorMessage={errorMessage || undefined}
                featureType="creative"
                hasByok={hasByok}
                onRetry={() => {
                  clearError();
                  if (config) handleGenerate(config);
                }}
                onClose={clearError}
              />
            )}
            
            {/* BYOK Unlimited Mode Indicator */}
            {hasByok && (
              <Alert className="bg-green-500/10 border-green-500/30">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <span className="font-semibold text-green-700 dark:text-green-400">✨ Modo Ilimitado Ativo</span>
                  <span className="text-xs ml-2 text-green-600">Gere criativos sem limite com sua chave Fal.ai!</span>
                </AlertDescription>
              </Alert>
            )}
            
            {hasBYOK && !hasByok && (
              <BYOKCostIndicator 
                estimatedCost={imageCost} 
                featureType="image" 
                model="Nano Banana PRO"
              />
            )}
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
            <CreativeConfigForm loading={loading} onGenerate={handleGenerate} generationMode={generationMode} />
          </TabsContent>
          <TabsContent value="results"><CreativeHistoryGallery history={history} onDelete={deleteHistoryItem} onToggleFavorite={toggleFavorite} /></TabsContent>
        </Tabs>
      </div>
      <CreativeGenerationProgress isGenerating={loading} mode={generationMode} />
      <CreativeResultModal 
        open={resultModalOpen} 
        onOpenChange={setResultModalOpen} 
        imageUrl={generatedImageUrl} 
        onRegenerate={() => config && handleGenerate(config)}
        suggestedCopy={suggestedCopy}
        onApplyText={async (textConfig) => {
          if (generatedImageUrl) {
            await applyTextToCreative(generatedImageUrl, textConfig);
          }
        }}
        applyingText={loading}
      />
    </>
  );
}
