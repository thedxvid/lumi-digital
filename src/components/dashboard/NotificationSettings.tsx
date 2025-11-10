import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, TestTube } from 'lucide-react';

export function NotificationSettings() {
  const {
    preferences,
    loading,
    pushSupported,
    pushEnabled,
    updatePreferences,
    requestPushPermission,
    sendTestNotification
  } = useNotifications();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-sm text-muted-foreground">Carregando preferências...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações
        </CardTitle>
        <CardDescription>
          Configure como e quando você quer ser notificado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Push Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Notificações Push</Label>
            <p className="text-sm text-muted-foreground">
              Receber notificações no navegador
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pushEnabled && (
              <Button
                size="sm"
                variant="outline"
                onClick={sendTestNotification}
              >
                <TestTube className="w-4 h-4 mr-2" />
                Testar
              </Button>
            )}
            <Switch
              checked={pushEnabled}
              onCheckedChange={(checked) => {
                if (checked && !pushEnabled) {
                  requestPushPermission();
                } else if (!checked) {
                  updatePreferences({ push_enabled: false });
                }
              }}
              disabled={!pushSupported}
            />
          </div>
        </div>

        {!pushSupported && (
          <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            ⚠️ Notificações push não são suportadas neste navegador
          </p>
        )}

        <Separator />

        {/* Email Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Notificações por Email</Label>
            <p className="text-sm text-muted-foreground">
              Receber atualizações importantes por email
            </p>
          </div>
          <Switch
            checked={preferences.email_enabled}
            onCheckedChange={(checked) =>
              updatePreferences({ email_enabled: checked })
            }
          />
        </div>

        <Separator />

        {/* Specific Notifications */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Tipos de Notificação</h4>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-normal">Lembretes de Inatividade</Label>
              <p className="text-xs text-muted-foreground">
                Notificação após 3 dias sem usar a plataforma
              </p>
            </div>
            <Switch
              checked={preferences.inactivity_reminders}
              onCheckedChange={(checked) =>
                updatePreferences({ inactivity_reminders: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-normal">Lembretes de Metas</Label>
              <p className="text-xs text-muted-foreground">
                Acompanhamento do progresso das suas metas
              </p>
            </div>
            <Switch
              checked={preferences.goal_reminders}
              onCheckedChange={(checked) =>
                updatePreferences({ goal_reminders: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-normal">Resumo Semanal</Label>
              <p className="text-xs text-muted-foreground">
                Digest semanal do seu progresso e atividades
              </p>
            </div>
            <Switch
              checked={preferences.weekly_digest}
              onCheckedChange={(checked) =>
                updatePreferences({ weekly_digest: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-normal">Atualizações de Recursos</Label>
              <p className="text-xs text-muted-foreground">
                Notificações sobre novos recursos e melhorias
              </p>
            </div>
            <Switch
              checked={preferences.feature_updates}
              onCheckedChange={(checked) =>
                updatePreferences({ feature_updates: checked })
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
