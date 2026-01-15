-- ============================================================================
-- KIOSK FILE REGISTRY
-- Tracks all uploaded files for easy orphan detection and cleanup
-- ============================================================================

-- Create file type enum
CREATE TYPE kiosk_file_type AS ENUM ('original', 'thumbnail');

-- Create file registry table
CREATE TABLE kiosk_file_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL UNIQUE,  -- e.g., userId/scoreboardId/file.jpg
  file_type kiosk_file_type NOT NULL, -- 'original' | 'thumbnail'
  slide_id UUID REFERENCES kiosk_slides(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  scoreboard_id TEXT NOT NULL REFERENCES scoreboards(id) ON DELETE CASCADE,
  file_size INTEGER,                  -- File size in bytes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for orphan detection (files without slides)
CREATE INDEX idx_kiosk_file_registry_orphans 
  ON kiosk_file_registry(slide_id) 
  WHERE slide_id IS NULL;

-- Index for user's files
CREATE INDEX idx_kiosk_file_registry_user 
  ON kiosk_file_registry(user_id);

-- Index for scoreboard's files (for cleanup when scoreboard deleted)
CREATE INDEX idx_kiosk_file_registry_scoreboard 
  ON kiosk_file_registry(scoreboard_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE kiosk_file_registry ENABLE ROW LEVEL SECURITY;

-- Users can view their own file registry entries
CREATE POLICY "Users can view their own file registry"
  ON kiosk_file_registry FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own file registry entries
CREATE POLICY "Users can insert their own file registry"
  ON kiosk_file_registry FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own file registry entries
CREATE POLICY "Users can delete their own file registry"
  ON kiosk_file_registry FOR DELETE
  USING (user_id = auth.uid());

-- System admins can view all file registry entries
CREATE POLICY "Admins can view all file registry"
  ON kiosk_file_registry FOR SELECT
  USING (is_system_admin());

-- System admins can delete any file registry entries
CREATE POLICY "Admins can delete any file registry"
  ON kiosk_file_registry FOR DELETE
  USING (is_system_admin());

-- ============================================================================
-- HELPER FUNCTION: Find orphan files
-- ============================================================================

CREATE OR REPLACE FUNCTION find_orphan_kiosk_files(
  older_than_minutes INTEGER DEFAULT 60
)
RETURNS TABLE (
  id UUID,
  storage_path TEXT,
  file_type kiosk_file_type,
  user_id UUID,
  scoreboard_id UUID,
  file_size INTEGER,
  created_at TIMESTAMPTZ,
  age_minutes NUMERIC
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
    r.created_at,
    EXTRACT(EPOCH FROM (NOW() - r.created_at)) / 60 AS age_minutes
  FROM kiosk_file_registry r
  WHERE r.slide_id IS NULL
    AND r.created_at < NOW() - (older_than_minutes || ' minutes')::INTERVAL
  ORDER BY r.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE kiosk_file_registry IS 'Tracks all uploaded kiosk files for orphan detection';
COMMENT ON COLUMN kiosk_file_registry.slide_id IS 'NULL when file is orphaned (slide was deleted)';
COMMENT ON FUNCTION find_orphan_kiosk_files IS 'Returns orphan files older than specified minutes (default 60)';
