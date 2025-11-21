import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Sparkles, Film } from 'lucide-react';

interface VideoLimitsDebugProps {
  limits: {
    sora_text_videos_lifetime_limit?: number;
    sora_text_videos_lifetime_used?: number;
    kling_image_videos_lifetime_limit?: number;
    kling_image_videos_lifetime_used?: number;
    video_credits?: number;
    video_credits_used?: number;
  };
}

export const VideoLimitsDebug = ({ limits }: VideoLimitsDebugProps) => {
  const soraAvailable = (limits.sora_text_videos_lifetime_limit || 0) - (limits.sora_text_videos_lifetime_used || 0);
  const klingAvailable = (limits.kling_image_videos_lifetime_limit || 0) - (limits.kling_image_videos_lifetime_used || 0);
  const extraCredits = (limits.video_credits || 0) - (limits.video_credits_used || 0);
  const totalAvailable = soraAvailable + klingAvailable + extraCredits;

  const getStatusColor = (available: number, total: number) => {
    if (available === 0) return 'destructive';
    if (available / total < 0.3) return 'secondary';
    return 'default';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Video className="h-5 w-5" />
            Créditos de Vídeo
          </CardTitle>
          <Badge variant={totalAvailable > 0 ? 'default' : 'destructive'}>
            {totalAvailable} Disponíveis
          </Badge>
        </div>
        <CardDescription>
          Detalhamento dos limites lifetime e créditos extras
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sora Credits */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Sora (Text-to-Video)</span>
            </div>
            <Badge variant={getStatusColor(soraAvailable, limits.sora_text_videos_lifetime_limit || 0)}>
              {soraAvailable}/{limits.sora_text_videos_lifetime_limit || 0}
            </Badge>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{
                width: `${((limits.sora_text_videos_lifetime_limit || 0) > 0 
                  ? (soraAvailable / (limits.sora_text_videos_lifetime_limit || 1)) * 100 
                  : 0)}%`
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Usado: {limits.sora_text_videos_lifetime_used || 0} | 
            Restante: {soraAvailable}
          </p>
        </div>

        {/* Kling Credits */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Kling (Image-to-Video)</span>
            </div>
            <Badge variant={getStatusColor(klingAvailable, limits.kling_image_videos_lifetime_limit || 0)}>
              {klingAvailable}/{limits.kling_image_videos_lifetime_limit || 0}
            </Badge>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{
                width: `${((limits.kling_image_videos_lifetime_limit || 0) > 0 
                  ? (klingAvailable / (limits.kling_image_videos_lifetime_limit || 1)) * 100 
                  : 0)}%`
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Usado: {limits.kling_image_videos_lifetime_used || 0} | 
            Restante: {klingAvailable}
          </p>
        </div>

        {/* Extra Credits */}
        {(limits.video_credits || 0) > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Créditos Extras (Addons)</span>
              </div>
              <Badge variant={getStatusColor(extraCredits, limits.video_credits || 0)}>
                {extraCredits}/{limits.video_credits || 0}
              </Badge>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all"
                style={{
                  width: `${((limits.video_credits || 0) > 0 
                    ? (extraCredits / (limits.video_credits || 1)) * 100 
                    : 0)}%`
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Usado: {limits.video_credits_used || 0} | 
              Restante: {extraCredits}
            </p>
          </div>
        )}

        {/* Warning if no credits */}
        {totalAvailable === 0 && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-xs text-destructive">
              ⚠️ Sem créditos disponíveis. Usuário não pode gerar vídeos.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
