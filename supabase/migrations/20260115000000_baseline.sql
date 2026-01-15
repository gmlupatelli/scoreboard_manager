-- ============================================================================
-- BASELINE MIGRATION - Scoreboard Manager
-- Date: January 15, 2026
-- Description: Consolidated schema baseline (squashed from previous migrations)
-- ============================================================================
--
-- This is a complete baseline snapshot of the database schema as of January 15, 2026.
-- Previous migrations have been archived to docs/migrations-archive/
--
-- This file contains everything needed to replicate the Supabase schema from scratch:
--   - Extensions (pg_trgm in extensions schema)
--   - Custom ENUM types
--   - All tables with constraints
--   - Indexes for performance
--   - RLS helper functions with fixed search_path
--   - RLS policies for all tables
--   - Storage bucket configuration
--   - Realtime publication settings
--   - Table and column documentation
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Create dedicated extensions schema (Supabase best practice)
CREATE SCHEMA IF NOT EXISTS extensions;

-- pg_trgm for fast text search (ILIKE with indexes)
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Grant usage to Supabase roles
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- Update search_path for roles to include extensions schema
ALTER ROLE authenticated SET search_path = extensions, public;
ALTER ROLE anon SET search_path = extensions, public;
ALTER ROLE service_role SET search_path = extensions, public;

-- ============================================================================
-- CUSTOM ENUM TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM ('system_admin', 'user');
CREATE TYPE scoreboard_visibility AS ENUM ('public', 'private');
CREATE TYPE score_type AS ENUM ('number', 'time');
CREATE TYPE time_format AS ENUM ('hh:mm', 'hh:mm:ss', 'mm:ss', 'mm:ss.s', 'mm:ss.ss', 'mm:ss.sss');
CREATE TYPE style_scope AS ENUM ('main', 'embed', 'both');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');
CREATE TYPE slide_type AS ENUM ('image', 'scoreboard');
CREATE TYPE kiosk_file_type AS ENUM ('original', 'thumbnail');

-- ============================================================================
-- TABLE: user_profiles
-- ============================================================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_user_profiles_full_name_length CHECK (length(full_name) <= 255),
  CONSTRAINT chk_user_profiles_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT chk_user_profiles_timestamps CHECK (created_at <= updated_at)
);

-- ============================================================================
-- TABLE: scoreboards
-- ============================================================================

CREATE TABLE scoreboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order TEXT NOT NULL DEFAULT 'desc',
  visibility scoreboard_visibility NOT NULL DEFAULT 'private',
  score_type score_type NOT NULL DEFAULT 'number',
  time_format time_format,
  custom_styles JSONB,
  style_scope style_scope NOT NULL DEFAULT 'both',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_scoreboards_title_length CHECK (length(title) >= 3 AND length(title) <= 100),
  CONSTRAINT chk_scoreboards_description_length CHECK (description IS NULL OR length(description) <= 200),
  CONSTRAINT chk_scoreboards_timestamps CHECK (created_at <= updated_at)
);

-- ============================================================================
-- TABLE: scoreboard_entries
-- ============================================================================

CREATE TABLE scoreboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scoreboard_id UUID NOT NULL REFERENCES scoreboards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  score NUMERIC NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_entries_name_length CHECK (length(name) >= 1 AND length(name) <= 100),
  CONSTRAINT chk_entries_name_pattern CHECK (name ~* '^[a-zA-Z0-9\s\-'']+$'),
  CONSTRAINT chk_entries_details_length CHECK (details IS NULL OR length(details) <= 500),
  CONSTRAINT chk_entries_timestamps CHECK (created_at <= updated_at)
);

-- ============================================================================
-- TABLE: invitations
-- ============================================================================

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  invitee_email TEXT NOT NULL,
  status invitation_status NOT NULL DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_invitations_invitee_email_format CHECK (invitee_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT chk_invitations_expires_after_created CHECK (expires_at > created_at),
  CONSTRAINT chk_invitations_accepted_at_logic CHECK (
    (status = 'accepted' AND accepted_at IS NOT NULL) OR 
    (status != 'accepted' AND accepted_at IS NULL)
  ),
  CONSTRAINT chk_invitations_timestamps CHECK (created_at <= updated_at)
);

-- ============================================================================
-- TABLE: system_settings
-- ============================================================================

CREATE TABLE system_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  allow_public_registration BOOLEAN NOT NULL DEFAULT true,
  require_email_verification BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_system_settings_single_row CHECK (id = 'default'),
  CONSTRAINT chk_system_settings_timestamps CHECK (created_at <= updated_at)
);

-- ============================================================================
-- TABLE: kiosk_configs
-- ============================================================================

CREATE TABLE kiosk_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scoreboard_id UUID NOT NULL REFERENCES scoreboards(id) ON DELETE CASCADE UNIQUE,
  slide_duration_seconds INTEGER NOT NULL DEFAULT 10,
  scoreboard_position INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT false,
  pin_code TEXT, -- Optional PIN protection (hashed)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_kiosk_configs_slide_duration CHECK (slide_duration_seconds >= 3 AND slide_duration_seconds <= 300),
  CONSTRAINT chk_kiosk_configs_scoreboard_position CHECK (scoreboard_position >= 0),
  CONSTRAINT chk_kiosk_configs_timestamps CHECK (created_at <= updated_at)
);

-- ============================================================================
-- TABLE: kiosk_slides
-- ============================================================================

CREATE TABLE kiosk_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosk_config_id UUID NOT NULL REFERENCES kiosk_configs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  slide_type slide_type NOT NULL,
  image_url TEXT,
  thumbnail_url TEXT,
  duration_override_seconds INTEGER,
  file_name TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uq_kiosk_slides_position UNIQUE (kiosk_config_id, position),
  CONSTRAINT chk_kiosk_slides_position CHECK (position >= 0),
  CONSTRAINT chk_kiosk_slides_duration CHECK (duration_override_seconds IS NULL OR (duration_override_seconds >= 3 AND duration_override_seconds <= 300)),
  CONSTRAINT chk_kiosk_slides_image_url CHECK (
    (slide_type = 'image' AND image_url IS NOT NULL) OR
    (slide_type = 'scoreboard' AND image_url IS NULL)
  )
);

-- ============================================================================
-- TABLE: kiosk_file_registry
-- ============================================================================

CREATE TABLE kiosk_file_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL UNIQUE,
  file_type kiosk_file_type NOT NULL,
  slide_id UUID REFERENCES kiosk_slides(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  scoreboard_id UUID NOT NULL REFERENCES scoreboards(id) ON DELETE CASCADE,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Scoreboard entries performance
CREATE INDEX idx_entries_scoreboard_score ON scoreboard_entries(scoreboard_id, score DESC);

-- Scoreboards listing and search
CREATE INDEX idx_scoreboards_owner ON scoreboards(owner_id);
CREATE INDEX idx_scoreboards_visibility_created ON scoreboards(visibility, created_at DESC);
CREATE INDEX idx_scoreboards_title_trgm ON scoreboards USING gin (title extensions.gin_trgm_ops);
CREATE INDEX idx_scoreboards_description_trgm ON scoreboards USING gin (description extensions.gin_trgm_ops);

-- Kiosk slides
CREATE INDEX idx_kiosk_slides_config_position ON kiosk_slides(kiosk_config_id, position);
CREATE INDEX idx_kiosk_configs_scoreboard ON kiosk_configs(scoreboard_id);

-- File registry
CREATE INDEX idx_kiosk_file_registry_orphans ON kiosk_file_registry(slide_id) WHERE slide_id IS NULL;
CREATE INDEX idx_kiosk_file_registry_user ON kiosk_file_registry(user_id);
CREATE INDEX idx_kiosk_file_registry_scoreboard ON kiosk_file_registry(scoreboard_id);

-- ============================================================================
-- TRIGGER: Auto-update updated_at on kiosk_configs
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_kiosk_configs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_temp, public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_kiosk_configs_updated_at
  BEFORE UPDATE ON kiosk_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_kiosk_configs_updated_at();

COMMENT ON FUNCTION public.update_kiosk_configs_updated_at IS 'Trigger function to auto-update updated_at timestamp. Uses fixed search_path for security.';

-- ============================================================================
-- RLS HELPER FUNCTIONS (SECURITY DEFINER with fixed search_path)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_system_admin() 
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_temp, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'system_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_scoreboard(scoreboard_uuid UUID) 
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_temp, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.scoreboards 
    WHERE id = scoreboard_uuid AND owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_scoreboard(scoreboard_uuid UUID) 
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_temp, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.scoreboards 
    WHERE id = scoreboard_uuid 
    AND (visibility = 'public' OR owner_id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_kiosk_config(config_id UUID) 
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_temp, public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.kiosk_configs kc
    JOIN public.scoreboards s ON s.id = kc.scoreboard_id
    WHERE kc.id = config_id AND s.owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_kiosk(config_id UUID) 
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_temp, public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.kiosk_configs kc
    JOIN public.scoreboards s ON s.id = kc.scoreboard_id
    WHERE kc.id = config_id 
    AND kc.enabled = true
    AND (s.visibility = 'public' OR s.owner_id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.find_orphan_kiosk_files(older_than_minutes INTEGER DEFAULT 60)
RETURNS TABLE (
  id UUID,
  storage_path TEXT,
  file_type public.kiosk_file_type,
  user_id UUID,
  scoreboard_id UUID,
  file_size INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_temp, public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.storage_path,
    r.file_type,
    r.user_id,
    r.scoreboard_id,
    r.file_size,
    r.created_at
  FROM public.kiosk_file_registry r
  WHERE r.slide_id IS NULL
    AND r.created_at < NOW() - (older_than_minutes || ' minutes')::INTERVAL
  ORDER BY r.created_at ASC;
END;
$$;

-- Function comments
COMMENT ON FUNCTION public.is_system_admin IS 'Returns true if current user is a system admin. Uses fixed search_path for security.';
COMMENT ON FUNCTION public.owns_scoreboard IS 'Returns true if current user owns the specified scoreboard. Uses fixed search_path for security.';
COMMENT ON FUNCTION public.can_view_scoreboard IS 'Returns true if current user can view the scoreboard (public or owner). Uses fixed search_path for security.';
COMMENT ON FUNCTION public.owns_kiosk_config IS 'Returns true if current user owns the kiosk config via scoreboard ownership. Uses fixed search_path for security.';
COMMENT ON FUNCTION public.can_view_kiosk IS 'Returns true if kiosk is viewable (enabled and public or owner). Uses fixed search_path for security.';
COMMENT ON FUNCTION public.find_orphan_kiosk_files IS 'Returns orphan files older than specified minutes (default 60). Uses fixed search_path for security.';

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoreboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoreboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosk_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosk_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosk_file_registry ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: user_profiles
-- ============================================================================

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "System admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (is_system_admin());

-- ============================================================================
-- RLS POLICIES: scoreboards
-- ============================================================================

CREATE POLICY "anon_select_public" ON scoreboards
  FOR SELECT
  TO anon
  USING (visibility = 'public');

CREATE POLICY "user_select_own_or_public" ON scoreboards
  FOR SELECT
  TO authenticated
  USING (visibility = 'public' OR owner_id = auth.uid());

CREATE POLICY "admin_select_all" ON scoreboards
  FOR SELECT
  TO authenticated
  USING (is_system_admin());

CREATE POLICY "user_insert_own" ON scoreboards
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "user_update_own" ON scoreboards
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "user_delete_own" ON scoreboards
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: scoreboard_entries
-- ============================================================================

CREATE POLICY "anon_select_public_entries" ON scoreboard_entries
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM scoreboards
      WHERE scoreboards.id = scoreboard_entries.scoreboard_id
      AND scoreboards.visibility = 'public'
    )
  );

CREATE POLICY "user_select_own_entries" ON scoreboard_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scoreboards
      WHERE scoreboards.id = scoreboard_entries.scoreboard_id
      AND (scoreboards.visibility = 'public' OR scoreboards.owner_id = auth.uid())
    )
  );

CREATE POLICY "admin_select_all_entries" ON scoreboard_entries
  FOR SELECT
  TO authenticated
  USING (is_system_admin());

CREATE POLICY "user_insert_own_entries" ON scoreboard_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scoreboards
      WHERE scoreboards.id = scoreboard_entries.scoreboard_id
      AND scoreboards.owner_id = auth.uid()
    )
  );

CREATE POLICY "user_update_own_entries" ON scoreboard_entries
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scoreboards
      WHERE scoreboards.id = scoreboard_entries.scoreboard_id
      AND scoreboards.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scoreboards
      WHERE scoreboards.id = scoreboard_entries.scoreboard_id
      AND scoreboards.owner_id = auth.uid()
    )
  );

CREATE POLICY "user_delete_own_entries" ON scoreboard_entries
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scoreboards
      WHERE scoreboards.id = scoreboard_entries.scoreboard_id
      AND scoreboards.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: invitations
-- ============================================================================

CREATE POLICY "Users can view invitations they sent"
  ON invitations FOR SELECT
  TO authenticated
  USING (inviter_id = auth.uid());

CREATE POLICY "Users can create invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "Users can update invitations they sent"
  ON invitations FOR UPDATE
  TO authenticated
  USING (inviter_id = auth.uid());

CREATE POLICY "System admins can view all invitations"
  ON invitations FOR SELECT
  TO authenticated
  USING (is_system_admin());

-- ============================================================================
-- RLS POLICIES: system_settings
-- ============================================================================

CREATE POLICY "Anyone can read system settings"
  ON system_settings FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Only system admins can update system settings"
  ON system_settings FOR UPDATE
  TO authenticated
  USING (is_system_admin())
  WITH CHECK (is_system_admin());

-- ============================================================================
-- RLS POLICIES: kiosk_configs
-- ============================================================================

CREATE POLICY "Users can view kiosk config for their scoreboards" ON kiosk_configs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scoreboards
      WHERE scoreboards.id = kiosk_configs.scoreboard_id
      AND scoreboards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create kiosk config for their scoreboards" ON kiosk_configs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scoreboards
      WHERE scoreboards.id = kiosk_configs.scoreboard_id
      AND scoreboards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update kiosk config for their scoreboards" ON kiosk_configs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scoreboards
      WHERE scoreboards.id = kiosk_configs.scoreboard_id
      AND scoreboards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete kiosk config for their scoreboards" ON kiosk_configs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scoreboards
      WHERE scoreboards.id = kiosk_configs.scoreboard_id
      AND scoreboards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anon can view enabled kiosk configs" ON kiosk_configs
  FOR SELECT
  TO anon
  USING (enabled = true);

-- ============================================================================
-- RLS POLICIES: kiosk_slides
-- ============================================================================

CREATE POLICY "Users can manage slides for their kiosk configs" ON kiosk_slides
  FOR ALL
  TO authenticated
  USING (owns_kiosk_config(kiosk_config_id))
  WITH CHECK (owns_kiosk_config(kiosk_config_id));

CREATE POLICY "Anon can view slides for enabled kiosk configs" ON kiosk_slides
  FOR SELECT
  TO anon
  USING (can_view_kiosk(kiosk_config_id));

-- ============================================================================
-- RLS POLICIES: kiosk_file_registry
-- ============================================================================

CREATE POLICY "Users can view their own file registry" ON kiosk_file_registry
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own file registry" ON kiosk_file_registry
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own file registry" ON kiosk_file_registry
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all file registry" ON kiosk_file_registry
  FOR SELECT
  TO authenticated
  USING (is_system_admin());

CREATE POLICY "Admins can delete any file registry" ON kiosk_file_registry
  FOR DELETE
  TO authenticated
  USING (is_system_admin());

-- ============================================================================
-- STORAGE: kiosk-slides bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kiosk-slides',
  'kiosk-slides',
  false,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies
CREATE POLICY "Users can upload kiosk slides to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kiosk-slides' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own kiosk slides"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'kiosk-slides' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'kiosk-slides' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own kiosk slides"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'kiosk-slides' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read their own kiosk slides"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kiosk-slides' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- REALTIME: Enable for scoreboards and entries
-- ============================================================================

ALTER TABLE public.scoreboards REPLICA IDENTITY FULL;
ALTER TABLE public.scoreboard_entries REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'scoreboards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scoreboards;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'scoreboard_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scoreboard_entries;
  END IF;
END $$;

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE public.user_profiles IS 'User account profiles synced from Supabase Auth. Contains display name, email, and role information.';
COMMENT ON TABLE public.scoreboards IS 'Scoreboards with ownership, visibility settings, scoring type, and custom styling options.';
COMMENT ON TABLE public.scoreboard_entries IS 'Individual entries (players/teams) within scoreboards, containing names, scores, and optional details.';
COMMENT ON TABLE public.invitations IS 'User invitations for registration. Tracks inviter, invitee email, status, and expiration.';
COMMENT ON TABLE public.system_settings IS 'Global application settings. Single-row table controlling registration mode and email verification.';
COMMENT ON TABLE public.kiosk_configs IS 'Kiosk mode configurations per scoreboard. Controls display settings, rotation timing, and slide ordering.';
COMMENT ON TABLE public.kiosk_slides IS 'Custom slides for kiosk mode display. Supports image uploads with title, description, and duration settings.';
COMMENT ON TABLE public.kiosk_file_registry IS 'Tracks all uploaded kiosk files for orphan detection and cleanup.';

-- ============================================================================
-- COLUMN COMMENTS: user_profiles
-- ============================================================================

COMMENT ON COLUMN public.user_profiles.id IS 'Primary key, references auth.users(id)';
COMMENT ON COLUMN public.user_profiles.email IS 'User email address (unique, validated format)';
COMMENT ON COLUMN public.user_profiles.full_name IS 'Display name for the user';
COMMENT ON COLUMN public.user_profiles.role IS 'User role: system_admin or user';
COMMENT ON COLUMN public.user_profiles.created_at IS 'Account creation timestamp';
COMMENT ON COLUMN public.user_profiles.updated_at IS 'Last profile update timestamp';

-- ============================================================================
-- COLUMN COMMENTS: scoreboards
-- ============================================================================

COMMENT ON COLUMN public.scoreboards.id IS 'Primary key (UUID)';
COMMENT ON COLUMN public.scoreboards.owner_id IS 'Foreign key to user_profiles - scoreboard owner';
COMMENT ON COLUMN public.scoreboards.title IS 'Scoreboard title (3-100 characters)';
COMMENT ON COLUMN public.scoreboards.description IS 'Optional description (max 200 characters)';
COMMENT ON COLUMN public.scoreboards.sort_order IS 'Score sorting: asc (lowest first) or desc (highest first)';
COMMENT ON COLUMN public.scoreboards.visibility IS 'Access control: public (anyone) or private (owner only)';
COMMENT ON COLUMN public.scoreboards.score_type IS 'Score format: number or time';
COMMENT ON COLUMN public.scoreboards.time_format IS 'Time display format when score_type is time (e.g., mm:ss, hh:mm:ss)';
COMMENT ON COLUMN public.scoreboards.custom_styles IS 'JSONB object with custom styling (colors, fonts, etc.)';
COMMENT ON COLUMN public.scoreboards.style_scope IS 'Where styles apply: main, embed, or both';
COMMENT ON COLUMN public.scoreboards.created_at IS 'Scoreboard creation timestamp';
COMMENT ON COLUMN public.scoreboards.updated_at IS 'Last modification timestamp';

-- ============================================================================
-- COLUMN COMMENTS: scoreboard_entries
-- ============================================================================

COMMENT ON COLUMN public.scoreboard_entries.id IS 'Primary key (UUID)';
COMMENT ON COLUMN public.scoreboard_entries.scoreboard_id IS 'Foreign key to scoreboards';
COMMENT ON COLUMN public.scoreboard_entries.name IS 'Entry name - player, team, or participant (1-100 chars)';
COMMENT ON COLUMN public.scoreboard_entries.score IS 'Numeric score value';
COMMENT ON COLUMN public.scoreboard_entries.details IS 'Optional additional details (max 500 characters)';
COMMENT ON COLUMN public.scoreboard_entries.created_at IS 'Entry creation timestamp';
COMMENT ON COLUMN public.scoreboard_entries.updated_at IS 'Last modification timestamp';

-- ============================================================================
-- COLUMN COMMENTS: invitations
-- ============================================================================

COMMENT ON COLUMN public.invitations.id IS 'Primary key (UUID)';
COMMENT ON COLUMN public.invitations.inviter_id IS 'Foreign key to user_profiles - who sent the invite (nullable if inviter deleted)';
COMMENT ON COLUMN public.invitations.invitee_email IS 'Email address of the invited person';
COMMENT ON COLUMN public.invitations.status IS 'Invitation status: pending, accepted, expired, or cancelled';
COMMENT ON COLUMN public.invitations.accepted_at IS 'Timestamp when invitation was accepted (required if status=accepted)';
COMMENT ON COLUMN public.invitations.expires_at IS 'Invitation expiration timestamp (default: 7 days from creation)';
COMMENT ON COLUMN public.invitations.created_at IS 'Invitation creation timestamp';
COMMENT ON COLUMN public.invitations.updated_at IS 'Last status update timestamp';

-- ============================================================================
-- COLUMN COMMENTS: system_settings
-- ============================================================================

COMMENT ON COLUMN public.system_settings.id IS 'Primary key (always "default" - single row table)';
COMMENT ON COLUMN public.system_settings.allow_public_registration IS 'If true, anyone can register. If false, invitation required.';
COMMENT ON COLUMN public.system_settings.require_email_verification IS 'If true, users must verify email before full access.';
COMMENT ON COLUMN public.system_settings.created_at IS 'Settings creation timestamp';
COMMENT ON COLUMN public.system_settings.updated_at IS 'Last settings update timestamp';

-- ============================================================================
-- COLUMN COMMENTS: kiosk_configs
-- ============================================================================

COMMENT ON COLUMN public.kiosk_configs.id IS 'Primary key (UUID)';
COMMENT ON COLUMN public.kiosk_configs.scoreboard_id IS 'Foreign key to scoreboards (unique - one config per scoreboard)';
COMMENT ON COLUMN public.kiosk_configs.enabled IS 'Whether kiosk mode is active for this scoreboard';
COMMENT ON COLUMN public.kiosk_configs.pin_code IS 'Optional PIN code for kiosk access protection';
COMMENT ON COLUMN public.kiosk_configs.scoreboard_position IS 'Position of the scoreboard slide in rotation order';
COMMENT ON COLUMN public.kiosk_configs.slide_duration_seconds IS 'Default seconds to display each slide';
COMMENT ON COLUMN public.kiosk_configs.created_at IS 'Config creation timestamp';
COMMENT ON COLUMN public.kiosk_configs.updated_at IS 'Last config update timestamp';

-- ============================================================================
-- COLUMN COMMENTS: kiosk_slides
-- ============================================================================

COMMENT ON COLUMN public.kiosk_slides.id IS 'Primary key (UUID)';
COMMENT ON COLUMN public.kiosk_slides.kiosk_config_id IS 'Foreign key to kiosk_configs';
COMMENT ON COLUMN public.kiosk_slides.slide_type IS 'Type of slide: image or scoreboard';
COMMENT ON COLUMN public.kiosk_slides.position IS 'Order position in slide sequence';
COMMENT ON COLUMN public.kiosk_slides.image_url IS 'Storage path to the slide image';
COMMENT ON COLUMN public.kiosk_slides.thumbnail_url IS 'Storage path to the thumbnail image';
COMMENT ON COLUMN public.kiosk_slides.file_name IS 'Original uploaded file name';
COMMENT ON COLUMN public.kiosk_slides.file_size IS 'File size in bytes';
COMMENT ON COLUMN public.kiosk_slides.duration_override_seconds IS 'Optional custom duration (overrides config default)';
COMMENT ON COLUMN public.kiosk_slides.created_at IS 'Slide creation timestamp';

-- ============================================================================
-- COLUMN COMMENTS: kiosk_file_registry
-- ============================================================================

COMMENT ON COLUMN public.kiosk_file_registry.id IS 'Primary key (UUID)';
COMMENT ON COLUMN public.kiosk_file_registry.storage_path IS 'Full path in Supabase Storage bucket';
COMMENT ON COLUMN public.kiosk_file_registry.file_type IS 'Type of file: original or thumbnail';
COMMENT ON COLUMN public.kiosk_file_registry.slide_id IS 'Foreign key to kiosk_slides (null if orphaned/pending)';
COMMENT ON COLUMN public.kiosk_file_registry.user_id IS 'Foreign key to user_profiles - who uploaded the file';
COMMENT ON COLUMN public.kiosk_file_registry.scoreboard_id IS 'Foreign key to scoreboards - associated scoreboard';
COMMENT ON COLUMN public.kiosk_file_registry.file_size IS 'File size in bytes';
COMMENT ON COLUMN public.kiosk_file_registry.created_at IS 'Upload timestamp';

-- ============================================================================
-- RLS POLICY COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can manage slides for their kiosk configs" ON kiosk_slides IS 
  'Authenticated users can manage (CRUD) slides for kiosk configs they own via scoreboard ownership. Uses SECURITY DEFINER function to bypass nested RLS.';

COMMENT ON POLICY "Anon can view slides for enabled kiosk configs" ON kiosk_slides IS 
  'Anonymous users can view slides for enabled kiosk configs. Uses SECURITY DEFINER function to bypass nested RLS.';

-- ============================================================================
-- ADDITIONAL NOTES FOR NEW DEPLOYMENTS
-- ============================================================================
--
-- 1. AUTH TRIGGER: You need to create a trigger to sync auth.users to user_profiles.
--    This is typically done via a Supabase Edge Function or database trigger.
--    Example trigger (create in Supabase Dashboard):
--
--    CREATE OR REPLACE FUNCTION public.handle_new_user()
--    RETURNS TRIGGER
--    LANGUAGE plpgsql
--    SECURITY DEFINER
--    SET search_path = public
--    AS $$
--    BEGIN
--      INSERT INTO public.user_profiles (id, email, full_name, role)
--      VALUES (
--        NEW.id,
--        NEW.email,
--        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
--        'user'
--      );
--      RETURN NEW;
--    END;
--    $$;
--
--    CREATE TRIGGER on_auth_user_created
--      AFTER INSERT ON auth.users
--      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
--
-- 2. INITIAL SYSTEM SETTINGS: Insert default row after migration:
--    INSERT INTO system_settings (id) VALUES ('default') ON CONFLICT DO NOTHING;
--
-- 3. FIRST ADMIN: To make the first user a system_admin:
--    UPDATE user_profiles SET role = 'system_admin' WHERE email = 'your-email@example.com';
--
-- ============================================================================
