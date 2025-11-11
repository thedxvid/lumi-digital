import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreativeEngine } from "@/hooks/useCreativeEngine";
import { ImageUploader } from "@/components/creative/ImageUploader";
import { CreativeHistoryGallery } from "@/components/creative/CreativeHistoryGallery";
import { CreativeConfigForm, type CreativeConfig } from "@/components/creative/CreativeConfigForm";
import { CreativeResultModal } from "@/components/creative/CreativeResultModal";

export default function CreativeEngine() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [config, setConfig] = useState<CreativeConfig | null>(null);
  
  const { 
    generateCreative, 
    loading, 
    history, 
    loadHistory, 
    deleteHistoryItem,
    toggleFavorite,
    resultModalOpen,
    setResultModalOpen,
    generatedImageUrl
  } = useCreativeEngine();

  useEffect(() => {
    loadHistory();
  }, []);

  const handleGenerate = async (formConfig: CreativeConfig) => {
    if (uploadedImages.length === 0) {
      return;
    }

    // Build a comprehensive prompt from the config
    const fullPrompt = `Create a ${formConfig.creativeType} creative for ${formConfig.market} with the following specifications:
    
Main Text: "${formConfig.mainText}"
${formConfig.secondaryText ? `Secondary Text: "${formConfig.secondaryText}"` : ''}
${formConfig.callToAction ? `Call-to-Action: "${formConfig.callToAction}"` : ''}

Visual Style: ${formConfig.visualStyle}
Color Palette: ${formConfig.colorPalette}
Typography: ${formConfig.typography}
Tone: ${formConfig.tone}
Objective: ${formConfig.objective}
Target Audience: ${formConfig.targetAudience}
Format: ${formConfig.format}`;

    setConfig(formConfig);
    await generateCreative(uploadedImages, fullPrompt, formConfig);
  };

  const handleRegenerate = () => {
    if (config) {
      handleGenerate(config);
    }
  };

  return (
    <>
      <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:py-8 min-h-screen overflow-y-auto">
        <div className="space-y-6">
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 break-words">Máquina de Criativos</h1>
            <p className="text-muted-foreground">
              Crie criativos profissionais e personalizados para qualquer objetivo
            </p>
          </div>

          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="create">Criar</TabsTrigger>
              <TabsTrigger value="results">Resultados</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-6 mt-6">
              {/* Upload de Imagens */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload de Imagens</CardTitle>
                  <CardDescription>
                    Adicione até 10 imagens para criar seu criativo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUploader
                    images={uploadedImages}
                    onImagesChange={setUploadedImages}
                    maxImages={10}
                  />
                </CardContent>
              </Card>

              {/* Formulário de Configuração */}
              {uploadedImages.length > 0 && (
                <CreativeConfigForm 
                  onGenerate={handleGenerate}
                  loading={loading}
                />
              )}
            </TabsContent>

            <TabsContent value="results" className="mt-6">
              <CreativeHistoryGallery 
                history={history}
                onDelete={deleteHistoryItem}
                onToggleFavorite={toggleFavorite}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal de Resultado */}
      {generatedImageUrl && (
        <CreativeResultModal
          open={resultModalOpen}
          onOpenChange={setResultModalOpen}
          imageUrl={generatedImageUrl}
          onRegenerate={handleRegenerate}
        />
      )}
    </>
  );
}
