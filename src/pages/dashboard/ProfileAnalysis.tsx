import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, History as HistoryIcon } from 'lucide-react';
import { ProfileImageUploader } from '@/components/profile/ProfileImageUploader';
import { ProfileAnalysisForm } from '@/components/profile/ProfileAnalysisForm';
import { ProfileAnalysisResult } from '@/components/profile/ProfileAnalysisResult';
import { ProfileHistoryGallery } from '@/components/profile/ProfileHistoryGallery';
import { useProfileAnalysis } from '@/hooks/useProfileAnalysis';
import type { ProfileAnalysisInput } from '@/types/profile';

export default function ProfileAnalysis() {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [currentPlatform, setCurrentPlatform] = useState<string>('');
  const {
    loading,
    analyzeProfile,
    history,
    deleteAnalysis,
    toggleFavorite,
    resultModalOpen,
    setResultModalOpen,
    currentResult,
  } = useProfileAnalysis();

  const handleSubmit = async (formData: Omit<ProfileAnalysisInput, 'image'>) => {
    if (!profileImage) {
      alert('Por favor, adicione uma imagem do perfil');
      return;
    }

    const input: ProfileAnalysisInput = {
      ...formData,
      image: profileImage,
    };

    setCurrentPlatform(formData.platform);
    await analyzeProfile(input);
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Análise de Perfil com IA</h1>
        <p className="text-muted-foreground">
          Receba insights profundos sobre seu perfil nas redes sociais e descubra pontos cegos
        </p>
      </div>

      <Tabs defaultValue="analyze" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="analyze" className="gap-2">
            <Search className="h-4 w-4" />
            Analisar
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <HistoryIcon className="h-4 w-4" />
            Histórico ({history.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
            {/* Upload de Imagem */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>1. Screenshot do Perfil</CardTitle>
                <CardDescription>
                  Faça upload de um screenshot completo do perfil que você deseja analisar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileImageUploader
                  image={profileImage}
                  onImageChange={setProfileImage}
                />
              </CardContent>
            </Card>

            {/* Formulário */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>2. Contexto do Perfil</CardTitle>
                <CardDescription>
                  Preencha as informações para uma análise mais precisa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileAnalysisForm
                  onSubmit={handleSubmit}
                  loading={loading}
                />
              </CardContent>
            </Card>
          </div>

          {/* Informações Adicionais */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle>O que você vai receber</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">📊 Análise Completa</h4>
                  <p className="text-sm text-muted-foreground">
                    Avaliação profunda de todos os elementos visuais e de conteúdo
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">👁️ Pontos Cegos</h4>
                  <p className="text-sm text-muted-foreground">
                    Identifique oportunidades que você provavelmente não está vendo
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">🎯 Plano de Ação</h4>
                  <p className="text-sm text-muted-foreground">
                    Recomendações prioritárias e plano de 30 dias
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <ProfileHistoryGallery
            history={history}
            onDelete={deleteAnalysis}
            onToggleFavorite={toggleFavorite}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Resultado */}
      <Dialog open={resultModalOpen} onOpenChange={setResultModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Resultado da Análise</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
            {currentResult && (
              <ProfileAnalysisResult
                result={currentResult}
                onClose={() => setResultModalOpen(false)}
                platform={currentPlatform}
                profileImage={profileImage || undefined}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
