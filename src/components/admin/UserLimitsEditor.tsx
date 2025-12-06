import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

interface UsageLimits {
  plan_type: string;
  api_tier: string;
  creative_images_daily_limit: number;
  creative_images_monthly_limit: number;
  profile_analysis_daily_limit: number;
  carousels_monthly_limit: number;
  carousel_images_monthly_limit: number;
  videos_monthly_limit: number;
  video_credits: number;
  kling_image_videos_lifetime_limit: number;
  kling_image_videos_lifetime_used: number;
}

interface UserLimitsEditorProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UserLimitsEditor = ({ userId, userName, isOpen, onClose, onSuccess }: UserLimitsEditorProps) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [limits, setLimits] = useState<UsageLimits | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserLimits();
    }
  }, [isOpen, userId]);

  const fetchUserLimits = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from('usage_limits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setLimits(data);
    } catch (error) {
      console.error('Erro ao carregar limites:', error);
      toast.error('Erro ao carregar limites do usuário');
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!limits) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('usage_limits')
        .update({
          plan_type: limits.plan_type,
          api_tier: limits.api_tier,
          creative_images_daily_limit: limits.creative_images_daily_limit,
          creative_images_monthly_limit: limits.creative_images_monthly_limit,
          profile_analysis_daily_limit: limits.profile_analysis_daily_limit,
          carousels_monthly_limit: limits.carousels_monthly_limit,
          carousel_images_monthly_limit: limits.carousel_images_monthly_limit,
          videos_monthly_limit: limits.videos_monthly_limit,
          video_credits: limits.video_credits,
          kling_image_videos_lifetime_limit: limits.kling_image_videos_lifetime_limit,
          kling_image_videos_lifetime_used: limits.kling_image_videos_lifetime_used,
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Limites atualizados com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar limites:', error);
      toast.error('Erro ao atualizar limites');
    } finally {
      setLoading(false);
    }
  };

  if (!limits && !fetching) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Limites - {userName}</DialogTitle>
        </DialogHeader>

        {fetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : limits ? (
          <div className="space-y-6">
            {/* Plano e API Tier */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Plano</Label>
                <Select value={limits.plan_type} onValueChange={(value) => setLimits({ ...limits, plan_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="basic">Básico</SelectItem>
                    <SelectItem value="lumi">Lumi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>API Tier</Label>
                <Select value={limits.api_tier || 'standard'} onValueChange={(value) => setLimits({ ...limits, api_tier: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">⚡ Standard (Lovable AI)</SelectItem>
                    <SelectItem value="pro">✨ PRO (Nano Banana PRO)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Imagens Criativas */}
            <div>
              <h3 className="font-semibold mb-3">Imagens Criativas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Limite Diário</Label>
                  <Input
                    type="number"
                    min="0"
                    value={limits.creative_images_daily_limit}
                    onChange={(e) => setLimits({ ...limits, creative_images_daily_limit: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Limite Mensal</Label>
                  <Input
                    type="number"
                    min="0"
                    value={limits.creative_images_monthly_limit}
                    onChange={(e) => setLimits({ ...limits, creative_images_monthly_limit: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Análise de Perfil */}
            <div>
              <h3 className="font-semibold mb-3">Análise de Perfil</h3>
              <div>
                <Label>Limite Diário</Label>
                <Input
                  type="number"
                  min="0"
                  value={limits.profile_analysis_daily_limit}
                  onChange={(e) => setLimits({ ...limits, profile_analysis_daily_limit: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <Separator />

            {/* Carousels */}
            <div>
              <h3 className="font-semibold mb-3">Carousels</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Carrosséis Mensais</Label>
                  <Input
                    type="number"
                    min="0"
                    value={limits.carousels_monthly_limit}
                    onChange={(e) => setLimits({ ...limits, carousels_monthly_limit: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Imagens/Carrossel (Lumi)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={limits.carousel_images_monthly_limit || 0}
                    onChange={(e) => setLimits({ ...limits, carousel_images_monthly_limit: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Vídeos */}
            <div>
              <h3 className="font-semibold mb-3">Vídeos</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>🎬 Kling - Limite Lifetime</Label>
                    <Input
                      type="number"
                      min="0"
                      value={limits.kling_image_videos_lifetime_limit}
                      onChange={(e) => setLimits({ ...limits, kling_image_videos_lifetime_limit: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>🎬 Kling - Usado Lifetime</Label>
                    <Input
                      type="number"
                      min="0"
                      value={limits.kling_image_videos_lifetime_used}
                      onChange={(e) => setLimits({ ...limits, kling_image_videos_lifetime_used: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Vídeos Mensais (antigo)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={limits.videos_monthly_limit}
                      onChange={(e) => setLimits({ ...limits, videos_monthly_limit: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>⚡ Créditos Extras</Label>
                    <Input
                      type="number"
                      min="0"
                      value={limits.video_credits}
                      onChange={(e) => setLimits({ ...limits, video_credits: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
