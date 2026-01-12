-- ============================================================================
-- COMPREHENSIVE DATABASE IMPROVEMENTS MIGRATION
-- Date: January 11, 2026
-- Description: Rename subtitle→description, add constraints, indexes
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Rename subtitle → description
-- ----------------------------------------------------------------------------

ALTER TABLE scoreboards RENAME COLUMN subtitle TO description;

-- ----------------------------------------------------------------------------
-- STEP 2: Add Missing CHECK Constraints
-- ----------------------------------------------------------------------------

-- User profiles
ALTER TABLE user_profiles
  ADD CONSTRAINT chk_user_profiles_role 
    CHECK (role IN ('system_admin', 'user')),
  ADD CONSTRAINT chk_user_profiles_full_name_length 
    CHECK (full_name IS NULL OR length(full_name) <= 255),
  ADD CONSTRAINT chk_user_profiles_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  ADD CONSTRAINT chk_user_profiles_timestamps 
    CHECK (created_at <= updated_at);

-- Scoreboards
ALTER TABLE scoreboards
  ADD CONSTRAINT chk_scoreboards_title_length 
    CHECK (length(title) >= 3 AND length(title) <= 100),
  ADD CONSTRAINT chk_scoreboards_description_length 
    CHECK (description IS NULL OR length(description) <= 200),
  ADD CONSTRAINT chk_scoreboards_visibility 
    CHECK (visibility IN ('public', 'private')),
  ADD CONSTRAINT chk_scoreboards_timestamps 
    CHECK (created_at <= updated_at);

-- Scoreboard entries
ALTER TABLE scoreboard_entries
  ADD CONSTRAINT chk_entries_name_length 
    CHECK (length(name) >= 1 AND length(name) <= 100),
  ADD CONSTRAINT chk_entries_name_pattern 
    CHECK (name ~* '^[a-zA-Z0-9\s\-'']+$'),
  ADD CONSTRAINT chk_entries_details_length 
    CHECK (details IS NULL OR length(details) <= 500),
  ADD CONSTRAINT chk_entries_timestamps 
    CHECK (created_at <= updated_at);

-- Invitations
ALTER TABLE invitations
  ADD CONSTRAINT chk_invitations_status 
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  ADD CONSTRAINT chk_invitations_invitee_email_format 
    CHECK (invitee_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  ADD CONSTRAINT chk_invitations_expires_after_created 
    CHECK (expires_at > created_at),
  ADD CONSTRAINT chk_invitations_accepted_at_logic 
    CHECK (
      (status = 'accepted' AND accepted_at IS NOT NULL) 
      OR (status != 'accepted' AND accepted_at IS NULL)
    ),
  ADD CONSTRAINT chk_invitations_timestamps 
    CHECK (created_at <= updated_at);

-- System settings
ALTER TABLE system_settings
  ADD CONSTRAINT chk_system_settings_single_row 
    CHECK (id = 'default'),
  ADD CONSTRAINT chk_system_settings_timestamps 
    CHECK (created_at <= updated_at);

-- ----------------------------------------------------------------------------
-- STEP 3: Add Performance Indexes
-- ----------------------------------------------------------------------------

-- Composite index for entry ranking (critical for leaderboards)
CREATE INDEX idx_entries_scoreboard_score 
  ON scoreboard_entries(scoreboard_id, score DESC);

-- Enable trigram extension for fast ILIKE searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Search optimization indexes
CREATE INDEX idx_scoreboards_title_trgm 
  ON scoreboards USING gin(title gin_trgm_ops);

CREATE INDEX idx_scoreboards_description_trgm 
  ON scoreboards USING gin(description gin_trgm_ops);

-- Composite index for public scoreboard listing
CREATE INDEX idx_scoreboards_visibility_created 
  ON scoreboards(visibility, created_at DESC);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
