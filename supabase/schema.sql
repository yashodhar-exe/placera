-- ============================================================
-- Placement Ops — Supabase Schema v2
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ─── PROFILES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text,
  username    text UNIQUE,
  email       text,
  avatar_url  text,
  role        text NOT NULL DEFAULT 'student'
                CHECK (role IN ('student', 'recruiter', 'tpo')),
  provider    text DEFAULT 'email',
  company_name text,
  branch      text,
  cgpa        numeric(4,2),
  last_login  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own"  ON public.profiles FOR SELECT  USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own"  ON public.profiles FOR INSERT  WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE  USING (auth.uid() = id);

-- Index
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ─── SETTINGS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme           text DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  notifications   boolean DEFAULT true,
  email_alerts    boolean DEFAULT true,
  compact_view    boolean DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_own" ON public.user_settings FOR ALL USING (
  auth.uid() = user_id
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL,
  body        text,
  read        boolean DEFAULT false,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON public.app_notifications FOR ALL USING (
  auth.uid() = user_id
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.app_notifications(user_id, read);

-- ─── SESSIONS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ip_address  text,
  user_agent  text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  last_seen   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_own" ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.user_sessions(user_id, is_active);

-- ─── ACTIVITY LOGS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action      text NOT NULL,
  target_type text,
  target_id   text,
  details     jsonb DEFAULT '{}',
  ip_address  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_logs_own" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "activity_logs_insert" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id, created_at DESC);

-- ─── AUTO-UPDATE updated_at TRIGGER ──────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER settings_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ─── AUTO-PROVISION PROFILE ON SIGNUP ────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, email, role, avatar_url, company_name, branch, cgpa, provider
  )
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'branch',
    NULLIF(new.raw_user_meta_data->>'cgpa', '')::numeric,
    COALESCE(new.raw_app_meta_data->>'provider', 'email')
  ) ON CONFLICT (id) DO NOTHING;

  -- Provision default settings
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── UPDATE last_login ON SIGN-IN ────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles
  SET last_login = now()
  WHERE id = new.id;
  RETURN new;
END; $$;
