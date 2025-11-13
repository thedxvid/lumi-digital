import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VideoConfigForm } from '@/components/video/VideoConfigForm';
import { VideoHistoryGallery } from '@/components/video/VideoHistoryGallery';
import { VideoResultModal } from '@/components/video/VideoResultModal';
import { useVideoGenerator } from '@/hooks/useVideoGenerator';
import { Video, History, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { VideoConfig, VideoHistoryItem } from '@/types/video';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
const VideoGenerator = () => {
  const {
    loading,
    history,
    resultModalOpen,
    setResultModalOpen,
    generatedVideoUrl,
    currentConfig,
    generateVideo,
    deleteHistoryItem,
    toggleFavorite
  } = useVideoGenerator();
  const [fullscreenVideo, setFullscreenVideo] = useState<VideoHistoryItem | null>(null);
  const handleGenerate = async (config: VideoConfig) => {
    await generateVideo(config);
  };
  const handleRegenerate = () => {
    if (currentConfig) {
      setResultModalOpen(false);
      generateVideo(currentConfig);
    }
  };
  return <div className="container max-w-7xl mx-auto p-4 sm:p-6 space-y-6 min-h-screen">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words overflow-wrap-anywhere">Gerador de Vídeos</h1>
        <p className="text-muted-foreground">Crie vídeos profissionais com IA </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          A geração de vídeos pode levar de 30 a 60 segundos. Seja específico no prompt para melhores resultados.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Criar
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico ({history.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Criar Novo Vídeo</CardTitle>
              <CardDescription>
                Configure os parâmetros e descreva o vídeo que deseja gerar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VideoConfigForm onGenerate={handleGenerate} loading={loading} />
            </CardContent>
          </Card>

          {generatedVideoUrl && !resultModalOpen && <Card>
              <CardHeader>
                <CardTitle>Último Vídeo Gerado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <video src={generatedVideoUrl} controls className="w-full h-full object-contain" />
                </div>
              </CardContent>
            </Card>}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Vídeos</CardTitle>
              <CardDescription>
                Acesse, baixe e gerencie seus vídeos gerados anteriormente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VideoHistoryGallery history={history} onDelete={deleteHistoryItem} onToggleFavorite={toggleFavorite} onViewFullscreen={setFullscreenVideo} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <VideoResultModal open={resultModalOpen} onClose={() => setResultModalOpen(false)} videoUrl={generatedVideoUrl} config={currentConfig} onRegenerate={handleRegenerate} loading={loading} />

      <Dialog open={!!fullscreenVideo} onOpenChange={() => setFullscreenVideo(null)}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Visualizar Vídeo</DialogTitle>
          </DialogHeader>
          {fullscreenVideo && <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <video src={fullscreenVideo.video_url} controls autoPlay className="w-full h-full object-contain" />
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm">
                  <span className="font-medium">Prompt:</span> {fullscreenVideo.prompt}
                </p>
              </div>
            </div>}
        </DialogContent>
      </Dialog>
    </div>;
};
export default VideoGenerator;