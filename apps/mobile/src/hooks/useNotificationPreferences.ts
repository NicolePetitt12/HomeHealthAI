import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

export interface NotificationPrefs {
  push_enabled: boolean;
  scan_completed: boolean;
  subscription_changed: boolean;
  app_update: boolean;
  promotion: boolean;
}

const DEFAULTS: NotificationPrefs = {
  push_enabled: true,
  scan_completed: true,
  subscription_changed: true,
  app_update: true,
  promotion: true,
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('push_enabled, scan_completed, subscription_changed, app_update, promotion')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as NotificationPrefs | null) ?? DEFAULTS;
    },
    enabled: !!user,
  });
}

export function useUpdateNotificationPreferences() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: Partial<NotificationPrefs>) => {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert(
          { user_id: user!.id, ...prefs },
          { onConflict: 'user_id' },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });
}
