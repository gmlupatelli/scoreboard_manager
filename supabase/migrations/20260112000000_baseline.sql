-- ============================================================================
-- BASELINE MIGRATION - Scoreboard Manager
-- Date: January 12, 2026
-- Description: Consolidated schema baseline (squashed from previous migrations)
-- ============================================================================
--
-- This is a baseline snapshot of the database schema as of January 12, 2026.
-- Previous migrations have been archived to docs/migrations-archive/
--
-- NOTE: This migration is a no-op for existing databases. It documents the
-- current schema state for new deployments and reference.
-- ============================================================================

-- For existing databases, this is a no-op
-- For new databases, run the full schema from Supabase Dashboard or use db reset

SELECT 1;

-- ============================================================================
-- SCHEMA DOCUMENTATION (Reference Only - Not Executed)
-- ============================================================================
/*

-- ENUMS
CREATE TYPE user_role AS ENUM ('system_admin', 'user');
CREATE TYPE scoreboard_visibility AS ENUM ('public', 'private');
CREATE TYPE score_type AS ENUM ('number', 'time');
CREATE TYPE time_format AS ENUM ('hh:mm', 'hh:mm:ss', 'mm:ss', 'mm:ss.s', 'mm:ss.ss', 'mm:ss.sss');
CREATE TYPE style_scope AS ENUM ('main', 'embed', 'both');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- USER_PROFILES
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

-- SCOREBOARDS
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

-- SCOREBOARD_ENTRIES
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

-- INVITATIONS
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

-- SYSTEM_SETTINGS
CREATE TABLE system_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  allow_public_registration BOOLEAN NOT NULL DEFAULT true,
  require_email_verification BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_system_settings_single_row CHECK (id = 'default'),
  CONSTRAINT chk_system_settings_timestamps CHECK (created_at <= updated_at)
);

-- PERFORMANCE INDEXES
CREATE INDEX idx_entries_scoreboard_score ON scoreboard_entries(scoreboard_id, score DESC);
CREATE INDEX idx_scoreboards_visibility_created ON scoreboards(visibility, created_at DESC);

-- TRIGRAM EXTENSION (for fast ILIKE searches)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_scoreboards_title_trgm ON scoreboards USING gin(title gin_trgm_ops);
CREATE INDEX idx_scoreboards_description_trgm ON scoreboards USING gin(description gin_trgm_ops);

-- RLS HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION is_system_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'system_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION owns_scoreboard(scoreboard_uuid UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM scoreboards 
    WHERE id = scoreboard_uuid AND owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_view_scoreboard(scoreboard_uuid UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM scoreboards 
    WHERE id = scoreboard_uuid 
    AND (visibility = 'public' OR owner_id = auth.uid())
  );
$$ LANGUAGE sql SECURITY DEFINER;

*/
