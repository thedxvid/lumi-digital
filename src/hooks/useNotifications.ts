import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface NotificationPreferences {
  id?: string;
  user_id?: string;
  push_enabled: boolean;
  email_enabled: boolean;
  inactivity_reminders: boolean;
  goal_reminders: boolean;
  weekly_digest: boolean;
  feature_updates: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export function useNotifications() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    push_enabled: false,
    email_enabled: true,
    inactivity_reminders: true,
    goal_reminders: true,
    weekly_digest: true,
    feature_updates: true
  });
  const [loading, setLoading] = useState(true);
  const [pushSupported, setPushSupported] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    // Check if push notifications are supported
    setPushSupported('Notification' in window && 'serviceWorker' in navigator);
    
    if (session?.user?.id) {
      loadPreferences();
    }
  }, [session]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', session?.user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    try {
      const newPrefs = { ...preferences, ...updates };

      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: session?.user?.id,
          ...newPrefs
        })
        .select()
        .single();

      if (error) throw error;

      setPreferences(data);
      toast.success('Preferências atualizadas!');
      return data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast.error('Erro ao atualizar preferências');
      return null;
    }
  };

  const requestPushPermission = async () => {
    if (!pushSupported) {
      toast.error('Notificações push não são suportadas neste navegador');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        await updatePreferences({ push_enabled: true });
        toast.success('Notificações ativadas!');
        return true;
      } else {
        toast.error('Permissão negada para notificações');
        return false;
      }
    } catch (error) {
      console.error('Error requesting push permission:', error);
      toast.error('Erro ao ativar notificações');
      return false;
    }
  };

  const sendTestNotification = () => {
    if (!pushSupported || Notification.permission !== 'granted') {
      toast.error('Notificações não estão ativadas');
      return;
    }

    new Notification('LUMI 🌟', {
      body: 'Suas notificações estão funcionando perfeitamente!',
      icon: '/lovable-uploads/6b34a50f-dd26-4cb2-aac7-e17de61a6471.png',
      badge: '/lovable-uploads/6b34a50f-dd26-4cb2-aac7-e17de61a6471.png'
    });
  };

  return {
    preferences,
    loading,
    pushSupported,
    pushEnabled: preferences.push_enabled && Notification.permission === 'granted',
    updatePreferences,
    requestPushPermission,
    sendTestNotification,
    refreshPreferences: loadPreferences
  };
}
