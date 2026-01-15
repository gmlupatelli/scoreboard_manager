-- ============================================================================
-- CONVERT SCOREBOARD AND ENTRY IDS FROM TEXT TO UUID
-- Date: January 14, 2026
-- Description: Standardize all primary keys to use UUID type for consistency
-- ============================================================================
--
-- This migration converts:
--   - scoreboards.id: TEXT -> UUID
--   - scoreboard_entries.id: TEXT -> UUID  
--   - scoreboard_entries.scoreboard_id: TEXT -> UUID
--   - kiosk_configs.scoreboard_id: TEXT -> UUID
--   - kiosk_file_registry.scoreboard_id: TEXT -> UUID
--
-- The existing IDs are already valid UUIDs stored as TEXT, so this is a type conversion.
-- ============================================================================

-- ============================================================================
-- STEP 1: Dynamically drop ALL RLS policies on affected tables
-- ============================================================================
-- This ensures we don't miss any policies regardless of their names

DO $$
DECLARE
  pol RECORD;
BEGIN
  -- Drop all policies on scoreboards
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'scoreboards'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON scoreboards', pol.policyname);
  END LOOP;
  
  -- Drop all policies on scoreboard_entries
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'scoreboard_entries'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON scoreboard_entries', pol.policyname);
  END LOOP;
  
  -- Drop all policies on kiosk_configs
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'kiosk_configs'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON kiosk_configs', pol.policyname);
  END LOOP;
  
  -- Drop all policies on kiosk_slides
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'kiosk_slides'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON kiosk_slides', pol.policyname);
  END LOOP;
  
  -- Drop all policies on kiosk_file_registry
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'kiosk_file_registry'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON kiosk_file_registry', pol.policyname);
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Drop RLS helper functions that reference TEXT ids
-- ============================================================================

DROP FUNCTION IF EXISTS owns_scoreboard(TEXT);
DROP FUNCTION IF EXISTS can_view_scoreboard(TEXT);
DROP FUNCTION IF EXISTS find_orphan_kiosk_files(INTEGER);

-- ============================================================================
-- STEP 3: Drop indexes that reference these columns
-- ============================================================================

DROP INDEX IF EXISTS idx_kiosk_file_registry_scoreboard;
DROP INDEX IF EXISTS idx_kiosk_configs_scoreboard;
DROP INDEX IF EXISTS idx_entries_scoreboard_score;
DROP INDEX IF EXISTS idx_scoreboards_owner;
DROP INDEX IF EXISTS idx_scoreboards_visibility_created;

-- ============================================================================
-- STEP 4: Drop foreign key constraints
-- ============================================================================

-- kiosk_file_registry -> scoreboards
ALTER TABLE kiosk_file_registry DROP CONSTRAINT IF EXISTS kiosk_file_registry_scoreboard_id_fkey;

-- kiosk_configs -> scoreboards  
ALTER TABLE kiosk_configs DROP CONSTRAINT IF EXISTS kiosk_configs_scoreboard_id_fkey;

-- scoreboard_entries -> scoreboards
ALTER TABLE scoreboard_entries DROP CONSTRAINT IF EXISTS scoreboard_entries_scoreboard_id_fkey;

-- ============================================================================
-- STEP 5: Convert column types
-- ============================================================================

-- Helper function to safely convert TEXT to UUID (generates new UUID if not valid)
CREATE OR REPLACE FUNCTION safe_text_to_uuid(input_text TEXT) RETURNS UUID AS $$
BEGIN
  -- Try to cast directly if it looks like a UUID
  IF input_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN input_text::UUID;
  ELSE
    -- Generate a deterministic UUID from the text using MD5 (UUID v3/v5 style)
    -- This ensures the same input always produces the same UUID
    RETURN md5(input_text)::UUID;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Convert scoreboards.id from TEXT to UUID
ALTER TABLE scoreboards 
  ALTER COLUMN id TYPE UUID USING safe_text_to_uuid(id);

-- Update the default to use gen_random_uuid() directly (not cast to text)
ALTER TABLE scoreboards 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Convert scoreboard_entries.id from TEXT to UUID
ALTER TABLE scoreboard_entries 
  ALTER COLUMN id TYPE UUID USING safe_text_to_uuid(id);

ALTER TABLE scoreboard_entries 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Convert scoreboard_entries.scoreboard_id from TEXT to UUID
ALTER TABLE scoreboard_entries 
  ALTER COLUMN scoreboard_id TYPE UUID USING safe_text_to_uuid(scoreboard_id);

-- Convert kiosk_configs.scoreboard_id from TEXT to UUID
ALTER TABLE kiosk_configs 
  ALTER COLUMN scoreboard_id TYPE UUID USING safe_text_to_uuid(scoreboard_id);

-- Convert kiosk_file_registry.scoreboard_id from TEXT to UUID
ALTER TABLE kiosk_file_registry 
  ALTER COLUMN scoreboard_id TYPE UUID USING safe_text_to_uuid(scoreboard_id);

-- Drop the helper function (cleanup)
DROP FUNCTION IF EXISTS safe_text_to_uuid(TEXT);

-- ============================================================================
-- STEP 6: Recreate foreign key constraints
-- ============================================================================

-- scoreboard_entries -> scoreboards
ALTER TABLE scoreboard_entries 
  ADD CONSTRAINT scoreboard_entries_scoreboard_id_fkey 
  FOREIGN KEY (scoreboard_id) REFERENCES scoreboards(id) ON DELETE CASCADE;

-- kiosk_configs -> scoreboards
ALTER TABLE kiosk_configs 
  ADD CONSTRAINT kiosk_configs_scoreboard_id_fkey 
  FOREIGN KEY (scoreboard_id) REFERENCES scoreboards(id) ON DELETE CASCADE;

-- kiosk_file_registry -> scoreboards
ALTER TABLE kiosk_file_registry 
  ADD CONSTRAINT kiosk_file_registry_scoreboard_id_fkey 
  FOREIGN KEY (scoreboard_id) REFERENCES scoreboards(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 7: Recreate indexes
-- ============================================================================

-- Index for scoreboard entries by scoreboard and score (for leaderboards)
CREATE INDEX idx_entries_scoreboard_score ON scoreboard_entries(scoreboard_id, score DESC);

-- Index for scoreboards by owner
CREATE INDEX idx_scoreboards_owner ON scoreboards(owner_id);

-- Index for scoreboards by visibility and created_at
CREATE INDEX idx_scoreboards_visibility_created ON scoreboards(visibility, created_at DESC);

-- Index for kiosk configs by scoreboard
CREATE INDEX idx_kiosk_configs_scoreboard ON kiosk_configs(scoreboard_id);

-- Index for file registry by scoreboard
CREATE INDEX idx_kiosk_file_registry_scoreboard ON kiosk_file_registry(scoreboard_id);

-- ============================================================================
-- STEP 8: Recreate RLS helper functions with UUID type
-- ============================================================================

-- Drop any remaining versions of these functions (in case they weren't dropped earlier)
DROP FUNCTION IF EXISTS owns_scoreboard(UUID);
DROP FUNCTION IF EXISTS can_view_scoreboard(UUID);

CREATE FUNCTION owns_scoreboard(scoreboard_uuid UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM scoreboards 
    WHERE id = scoreboard_uuid AND owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE FUNCTION can_view_scoreboard(scoreboard_uuid UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM scoreboards 
    WHERE id = scoreboard_uuid 
    AND (visibility = 'public' OR owner_id = auth.uid())
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to find orphan files for cleanup
CREATE OR REPLACE FUNCTION find_orphan_kiosk_files(older_than_minutes INTEGER DEFAULT 60)
RETURNS TABLE (
  id UUID,
  storage_path TEXT,
  file_type kiosk_file_type,
  user_id UUID,
  scoreboard_id UUID,
  file_size INTEGER,
  created_at TIMESTAMPTZ
) AS $$
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
  FROM kiosk_file_registry r
  WHERE r.slide_id IS NULL
    AND r.created_at < NOW() - (older_than_minutes || ' minutes')::INTERVAL
  ORDER BY r.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 9: Recreate RLS policies for scoreboards
-- ============================================================================

-- Anonymous users can view public scoreboards
CREATE POLICY "anon_select_public" ON scoreboards
  FOR SELECT
  TO anon
  USING (visibility = 'public');

-- Authenticated users can view public scoreboards and their own
CREATE POLICY "user_select_own_or_public" ON scoreboards
  FOR SELECT
  TO authenticated
  USING (visibility = 'public' OR owner_id = auth.uid());

-- Users can create their own scoreboards
CREATE POLICY "user_insert_own" ON scoreboards
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Users can update their own scoreboards
CREATE POLICY "user_update_own" ON scoreboards
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Users can delete their own scoreboards
CREATE POLICY "user_delete_own" ON scoreboards
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================================
-- STEP 10: Recreate RLS policies for scoreboard_entries
-- ============================================================================

-- Anonymous can view entries of public scoreboards
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

-- Users can view entries of their own or public scoreboards
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

-- Users can insert entries to their own scoreboards
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

-- Users can update entries of their own scoreboards
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

-- Users can delete entries of their own scoreboards
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
-- STEP 11: Recreate RLS policies for kiosk_configs
-- ============================================================================

-- Users can view kiosk config for their scoreboards
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

-- Users can create kiosk config for their scoreboards
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

-- Users can update kiosk config for their scoreboards
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

-- Users can delete kiosk config for their scoreboards
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

-- Anon can view enabled kiosk configs (for public display)
CREATE POLICY "Anon can view enabled kiosk configs" ON kiosk_configs
  FOR SELECT
  TO anon
  USING (enabled = true);

-- ============================================================================
-- STEP 12: Recreate RLS policies for kiosk_slides
-- ============================================================================

-- Users can manage slides for their kiosk configs
CREATE POLICY "Users can manage slides for their kiosk configs" ON kiosk_slides
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM kiosk_configs
      JOIN scoreboards ON scoreboards.id = kiosk_configs.scoreboard_id
      WHERE kiosk_configs.id = kiosk_slides.kiosk_config_id
      AND scoreboards.owner_id = auth.uid()
    )
  );

-- Anon can view slides for enabled kiosk configs
CREATE POLICY "Anon can view slides for enabled kiosk configs" ON kiosk_slides
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM kiosk_configs
      WHERE kiosk_configs.id = kiosk_slides.kiosk_config_id
      AND kiosk_configs.enabled = true
    )
  );

-- ============================================================================
-- STEP 13: Recreate RLS policies for kiosk_file_registry
-- ============================================================================

-- Users can view their own file registry entries
CREATE POLICY "Users can view their own file registry" ON kiosk_file_registry
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own file registry entries
CREATE POLICY "Users can insert their own file registry" ON kiosk_file_registry
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own file registry entries
CREATE POLICY "Users can delete their own file registry" ON kiosk_file_registry
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- VERIFICATION QUERY (for manual testing)
-- ============================================================================
-- Run this after migration to verify:
-- SELECT 
--   'scoreboards' as table_name, 
--   pg_typeof(id) as id_type,
--   count(*) as row_count
-- FROM scoreboards
-- GROUP BY pg_typeof(id)
-- UNION ALL
-- SELECT 
--   'scoreboard_entries',
--   pg_typeof(id),
--   count(*)
-- FROM scoreboard_entries
-- GROUP BY pg_typeof(id)
-- UNION ALL
-- SELECT 
--   'kiosk_configs (scoreboard_id)',
--   pg_typeof(scoreboard_id),
--   count(*)
-- FROM kiosk_configs
-- GROUP BY pg_typeof(scoreboard_id);
