import { SupabaseClient } from '@supabase/supabase-js';

type NotificationType = 'scan_completed' | 'subscription_changed' | 'app_update' | 'promotion';

interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send an in-app notification and (optionally) a push notification.
 * Respects user preferences — skips if the notification type is disabled.
 */
export async function sendNotification(
  admin: SupabaseClient,
  params: SendNotificationParams,
): Promise<void> {
  const { userId, type, title, body, data } = params;

  // 1. Check user preferences (if row exists)
  const { data: prefs } = await admin
    .from('notification_preferences')
    .select('push_enabled, scan_completed, subscription_changed, app_update, promotion')
    .eq('user_id', userId)
    .maybeSingle();

  // If preferences row exists and this type is disabled, skip entirely
  if (prefs && !prefs[type]) return;

  // 2. Dedup: skip if an identical notification was sent in the last 60 seconds
  const { data: existing } = await admin
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('type', type)
    .eq('title', title)
    .eq('body', body)
    .gte('created_at', new Date(Date.now() - 60_000).toISOString())
    .limit(1);

  if (existing && existing.length > 0) return;

  // 3. Insert notification record
  const { error: insertError } = await admin.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    data: data ?? {},
  });

  if (insertError) {
    console.error('Failed to insert notification:', insertError);
    return;
  }

  // 3. Send push notification if enabled
  const pushEnabled = prefs?.push_enabled ?? true;
  if (!pushEnabled) return;

  const { data: tokens } = await admin
    .from('push_tokens')
    .select('id, expo_token')
    .eq('user_id', userId);

  if (!tokens || tokens.length === 0) return;

  const messages = tokens.map((t: { expo_token: string }) => ({
    to: t.expo_token,
    title,
    body,
    data: data ?? {},
    sound: 'default' as const,
  }));

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    if (response.ok) {
      const result = await response.json();
      // Clean up stale tokens
      const staleTokenIds: string[] = [];
      const tickets = Array.isArray(result.data) ? result.data : [result];
      for (let i = 0; i < tickets.length; i++) {
        if (tickets[i]?.details?.error === 'DeviceNotRegistered') {
          staleTokenIds.push(tokens[i].id);
        }
      }
      if (staleTokenIds.length > 0) {
        await admin.from('push_tokens').delete().in('id', staleTokenIds);
      }
    }
  } catch (err) {
    console.error('Failed to send push notification:', err);
  }
}
