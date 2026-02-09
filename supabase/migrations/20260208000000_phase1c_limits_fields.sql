-- Phase 1c: limits enforcement fields

ALTER TABLE public.scoreboards
  ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS downgrade_notice_seen_at timestamptz;
