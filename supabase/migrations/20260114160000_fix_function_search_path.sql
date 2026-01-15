-- Migration: Fix search_path for all SECURITY DEFINER functions
-- Date: 2026-01-14
-- Description: Set explicit search_path to prevent SQL injection and object resolution issues
-- Affected functions: is_system_admin, owns_scoreboard, can_view_scoreboard, 
--                     owns_kiosk_config, can_view_kiosk, find_orphan_kiosk_files
-- Note: Using CREATE OR REPLACE to preserve dependent policies

-- ============================================================================
-- Fix is_system_admin()
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

-- ============================================================================
-- Fix owns_scoreboard(UUID)
-- ============================================================================

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

-- ============================================================================
-- Fix can_view_scoreboard(UUID)
-- ============================================================================

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

-- ============================================================================
-- Fix owns_kiosk_config(UUID)
-- ============================================================================

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

-- ============================================================================
-- Fix can_view_kiosk(UUID)
-- ============================================================================

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

-- ============================================================================
-- Fix find_orphan_kiosk_files(INTEGER)
-- ============================================================================

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

-- ============================================================================
-- Add comments
-- ============================================================================

COMMENT ON FUNCTION public.is_system_admin IS 'Returns true if current user is a system admin. Uses fixed search_path for security.';
COMMENT ON FUNCTION public.owns_scoreboard IS 'Returns true if current user owns the specified scoreboard. Uses fixed search_path for security.';
COMMENT ON FUNCTION public.can_view_scoreboard IS 'Returns true if current user can view the scoreboard (public or owner). Uses fixed search_path for security.';
COMMENT ON FUNCTION public.owns_kiosk_config IS 'Returns true if current user owns the kiosk config via scoreboard ownership. Uses fixed search_path for security.';
COMMENT ON FUNCTION public.can_view_kiosk IS 'Returns true if kiosk is viewable (enabled and public or owner). Uses fixed search_path for security.';
COMMENT ON FUNCTION public.find_orphan_kiosk_files IS 'Returns orphan files older than specified minutes (default 60). Uses fixed search_path for security.';
