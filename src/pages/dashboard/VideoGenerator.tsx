import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VideoConfigForm } from '@/components/video/VideoConfigForm';
import { VideoHistoryGallery } from '@/components/video/VideoHistoryGallery';
import { VideoResultModal } from '@/components/video/VideoResultModal';
import { CreditsExhaustedModal } from '@/components/video/CreditsExhaustedModal';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { BYOKCostIndicator } from '@/components/byok/BYOKCostIndicator';
import { useVideoGenerator } from '@/hooks/useVideoGenerator';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useBYOKCosts } from '@/hooks/useBYOKCosts';
import { Video, History, AlertCircle, ShoppingCart, Wand2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { VideoConfig, VideoHistoryItem } from '@/types/video';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const VideoGenerator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { limits } = useUsageLimits();
  const { hasBYOK, registerCost, estimateVideoCost } = useBYOKCosts();
  const [selectedModel, setSelectedModel] = useState('kling-2.5-turbo');
  const [videoDuration, setVideoDuration] = useState(5);
  const {
    loading,
    history,
    resultModalOpen,
    setResultModalOpen,
    generatedVideoUrl,
    thumbnailUrl,
    currentConfig,
    generationStatus,
    timeEstimate,
    generateVideo,
    deleteHistoryItem,
    toggleFavorite,
    cancelGeneration
  } = useVideoGenerator();
  const [fullscreenVideo, setFullscreenVideo] = useState<VideoHistoryItem | null>(null);
  const [preloadedImage, setPreloadedImage] = useState<string | null>(null);
  const [initialMode, setInitialMode] = useState<'text-to-video' | 'image-to-video'>('text-to-video');
  const [hasLoadedImage, setHasLoadedImage] = useState(false);
  const [policyViolation, setPolicyViolation] = useState<{
    error: string;
    prompt: string;
    apiProvider: string;
  } | null>(null);
  const [creditsExhausted, setCreditsExhausted] = useState<{
    show: boolean;
    videoType: 'sora' | 'kling';
    remainingCredits: number;
  } | null>(null);
  const [balanceExhausted, setBalanceExhausted] = useState<{
    show: boolean;
    isUserKey: boolean;
    message: string;
  } | null>(null);

  // Handle preloaded image from creative generator
  useEffect(() => {
    const state = location.state as { preloadedImage?: string; mode?: 'image-to-video' } | null;
    console.log('📸 VideoGenerator - Location state:', state);
    
    if (state?.preloadedImage && !hasLoadedImage) {
      console.log('✅ Loading preloaded image:', state.preloadedImage.substring(0, 50) + '...');
      setPreloadedImage(state.preloadedImage);
      setInitialMode(state.mode || 'image-to-video');
      setHasLoadedImage(true);
      toast.success('Imagem carregada! Configure e gere seu vídeo 🎬');
      // Clear state after loading to avoid re-triggering
      setTimeout(() => {
        window.history.replaceState({}, document.title);
      }, 100);
    }
  }, [location, hasLoadedImage]);

  // Listen for video limit reached - ONLY show CreditsExhaustedModal
  useEffect(() => {
    const handleLimitReached = (event: CustomEvent) => {
      const { videoType, remainingCredits } = event.detail;
      setCreditsExhausted({
        show: true,
        videoType,
        remainingCredits: remainingCredits || 0
      });
    };

    window.addEventListener('video-limit-reached', handleLimitReached as EventListener);
    
    return () => {
      window.removeEventListener('video-limit-reached', handleLimitReached as EventListener);
    };
  }, []);

  // Listen for policy violation events
  useEffect(() => {
    const handlePolicyViolation = (event: CustomEvent) => {
      console.log('📢 Policy violation event received:', event.detail);
      setPolicyViolation(event.detail);
    };

    window.addEventListener('video-policy-violation', handlePolicyViolation as EventListener);
    
    return () => {
      window.removeEventListener('video-policy-violation', handlePolicyViolation as EventListener);
    };
  }, []);

  // Listen for balance exhausted events from video generation
  useEffect(() => {
    const handleBalanceExhausted = (event: CustomEvent) => {
      console.log('💰 Balance exhausted event received:', event.detail);
      setBalanceExhausted({
        show: true,
        isUserKey: event.detail.isUserKey || false,
        message: event.detail.message || 'Saldo esgotado'
      });
    };

    window.addEventListener('video-balance-exhausted', handleBalanceExhausted as EventListener);
    
    return () => {
      window.removeEventListener('video-balance-exhausted', handleBalanceExhausted as EventListener);
    };
  }, []);


  const handleGenerate = async (config: VideoConfig) => {
    // Atualizar modelo e duração selecionados para o indicador
    const model = config.api_provider || 'kling-2.5-turbo';
    const durationStr = config.duration || '5s';
    const durationNum = parseInt(durationStr.replace('s', ''), 10) || 5;
    
    setSelectedModel(model);
    setVideoDuration(durationNum);
    
    const result = await generateVideo(config);
    
    // Registrar custo BYOK se aplicável
    if (result && hasBYOK) {
      const cost = estimateVideoCost(model, durationNum);
      await registerCost('video', model, cost, { 
        duration: durationStr,
        mode: config.mode 
      });
    }
  };
  const handleRegenerate = () => {
    if (currentConfig) {
      setResultModalOpen(false);
      generateVideo(currentConfig);
    }
  };
  return <div className="container max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="min-w-0 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words overflow-wrap-anywhere">Gerador de Vídeos</h1>
          <p className="text-muted-foreground">Crie vídeos profissionais com IA</p>
        </div>
        <Button 
          onClick={() => navigate('/app/video-addons')}
          className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Comprar Créditos
        </Button>
      </div>

      {/* BYOK Status Indicator */}
      {limits && (
        <Alert className="bg-primary/5 border-primary/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              {limits.kling_image_videos_lifetime_limit > 0 && (
                <p className="text-sm">
                  <span className="font-semibold">Créditos Kling:</span>{' '}
                  {(limits.kling_image_videos_lifetime_limit || 0) - (limits.kling_image_videos_lifetime_used || 0)}/{limits.kling_image_videos_lifetime_limit} restantes
                </p>
              )}
              {limits.video_credits > 0 && (
                <p className="text-sm">
                  <span className="font-semibold">Créditos Extras:</span>{' '}
                  {limits.video_credits - limits.video_credits_used}/{limits.video_credits} restantes
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/app/settings')}
              className="ml-4 flex-shrink-0"
            >
              🔑 Conectar Fal.ai
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Policy Violation Alert */}
      {policyViolation && (
        <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="space-y-2">
            <p className="font-semibold">⚠️ Prompt Bloqueado</p>
            <p className="text-sm">
              {(policyViolation.apiProvider === 'fal_sora2_image_to_video' || policyViolation.apiProvider === 'fal_sora2_text_to_video')
                ? 'Sora 2 detectou marcas, produtos ou cores específicas.'
                : 'Conteúdo bloqueado pelos filtros.'
              }
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={() => setPolicyViolation(null)}>
                Entendi
              </Button>
              <Button size="sm" onClick={() => {
                setPolicyViolation(null);
                document.querySelector<HTMLButtonElement>('[data-enhance-prompt]')?.click();
              }}>
                <Wand2 className="h-4 w-4 mr-2" />
                Melhorar Agora
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Balance Exhausted Alert */}
      {balanceExhausted?.show && (
        <Alert variant="destructive" className="border-orange-500/50 bg-orange-500/10">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="space-y-2">
            <p className="font-semibold">💰 {balanceExhausted.isUserKey ? 'Saldo Fal.ai Esgotado' : 'Créditos Temporariamente Indisponíveis'}</p>
            <p className="text-sm">
              {balanceExhausted.isUserKey 
                ? 'O saldo da sua conta Fal.ai acabou. Adicione mais créditos no painel da Fal.ai para continuar gerando vídeos.'
                : 'Os créditos da plataforma estão temporariamente esgotados. Conecte sua própria chave Fal.ai ou tente novamente mais tarde.'
              }
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={() => setBalanceExhausted(null)}>
                Fechar
              </Button>
              {balanceExhausted.isUserKey ? (
                <Button size="sm" asChild>
                  <a href="https://fal.ai/billing" target="_blank" rel="noopener noreferrer">
                    Adicionar Créditos Fal.ai
                  </a>
                </Button>
              ) : (
                <Button size="sm" onClick={() => navigate('/app/settings')}>
                  🔑 Conectar Minha Chave
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

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
          {hasBYOK && (
            <BYOKCostIndicator 
              estimatedCost={estimateVideoCost(selectedModel, videoDuration)} 
              featureType="video" 
              model={selectedModel}
            />
          )}
          <Card>
            <CardHeader>
              <CardTitle>Criar Novo Vídeo</CardTitle>
              <CardDescription>
                Configure os parâmetros e descreva o vídeo que deseja gerar
              </CardDescription>
            </CardHeader>
            <CardContent>
            <VideoConfigForm 
              onGenerate={handleGenerate} 
              loading={loading}
              preloadedImage={preloadedImage}
              initialMode={initialMode}
            />
            </CardContent>
          </Card>

          {generatedVideoUrl && !resultModalOpen && <Card>
              <CardHeader>
                <CardTitle>Último Vídeo Gerado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <VideoPlayer 
                    src={generatedVideoUrl} 
                    controls 
                    className="w-full h-full object-contain"
                  />
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

      <VideoResultModal 
        open={resultModalOpen} 
        onClose={() => setResultModalOpen(false)} 
        videoUrl={generatedVideoUrl} 
        config={currentConfig} 
        onRegenerate={handleRegenerate} 
        loading={loading}
        generationStatus={generationStatus}
        timeEstimate={timeEstimate}
        onCancel={cancelGeneration}
        thumbnailUrl={thumbnailUrl}
      />

      <Dialog open={!!fullscreenVideo} onOpenChange={() => setFullscreenVideo(null)}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Visualizar Vídeo</DialogTitle>
          </DialogHeader>
          {fullscreenVideo && <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <VideoPlayer 
                  src={fullscreenVideo.video_url} 
                  controls 
                  autoPlay={false}
                  className="w-full h-full object-contain"
                />
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