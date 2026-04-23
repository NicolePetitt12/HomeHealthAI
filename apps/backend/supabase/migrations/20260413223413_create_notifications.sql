-- Notification type enum
CREATE TYPE public.notification_type AS ENUM (
  'scan_completed',
  'subscription_changed',
  'app_update',
  'promotion'
);

-- Notifications table
CREATE TABLE public.notifications (
  id         uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid            NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       public.notification_type NOT NULL,
  title      text            NOT NULL,
  body       text            NOT NULL,
  data       jsonb           DEFAULT '{}'::jsonb,
  is_read    boolean         NOT NULL DEFAULT false,
  created_at timestamptz     NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user    ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread  ON public.notifications(user_id) WHERE NOT is_read;

-- Push tokens (multi-device support)
CREATE TABLE public.push_tokens (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expo_token text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, expo_token)
);

CREATE INDEX idx_push_tokens_user ON public.push_tokens(user_id);

-- Notification preferences (one row per user, created lazily)
CREATE TABLE public.notification_preferences (
  user_id              uuid    PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  push_enabled         boolean NOT NULL DEFAULT true,
  scan_completed       boolean NOT NULL DEFAULT true,
  subscription_changed boolean NOT NULL DEFAULT true,
  app_update           boolean NOT NULL DEFAULT true,
  promotion            boolean NOT NULL DEFAULT true,
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.notifications            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- notifications: users SELECT/UPDATE/DELETE own only (INSERT via service role)
CREATE POLICY "notifications_sel_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_upd_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_del_own" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- push_tokens: users manage own
CREATE POLICY "push_tokens_sel_own" ON public.push_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "push_tokens_ins_own" ON public.push_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "push_tokens_del_own" ON public.push_tokens FOR DELETE USING (auth.uid() = user_id);

-- notification_preferences: users manage own
CREATE POLICY "notif_prefs_sel_own" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_prefs_ins_own" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notif_prefs_upd_own" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);
