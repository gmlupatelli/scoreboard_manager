-- ============================================================================
-- Allow Anonymous Access to Private Scoreboards
-- Date: January 20, 2026
-- Description: Enable anonymous users to view private scoreboards via direct link
-- ============================================================================
--
-- This migration modifies RLS policies to allow anonymous users to view any
-- scoreboard (public or private) and their entries when they have a direct link.
-- Only owners can still edit/delete private scoreboards.
--
-- Changes:
-- 1. Update anon_select_public policy on scoreboards to allow viewing all scoreboards
-- 2. Update anon_select_public_entries policy on scoreboard_entries to allow viewing all entries
-- 3. Update can_view_scoreboard helper function to allow viewing any scoreboard
-- ============================================================================

-- ============================================================================
-- UPDATE RLS POLICIES: scoreboards
-- ============================================================================

-- Drop the existing restrictive policy for anonymous users
DROP POLICY IF EXISTS "anon_select_public" ON scoreboards;

-- Create new policy allowing anonymous users to view all scoreboards
CREATE POLICY "anon_select_all" ON scoreboards
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================================
-- UPDATE RLS POLICIES: scoreboard_entries
-- ============================================================================

-- Drop the existing restrictive policy for anonymous users
DROP POLICY IF EXISTS "anon_select_public_entries" ON scoreboard_entries;

-- Create new policy allowing anonymous users to view all scoreboard entries
CREATE POLICY "anon_select_all_entries" ON scoreboard_entries
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================================
-- UPDATE HELPER FUNCTION
-- ============================================================================

-- Update can_view_scoreboard to allow viewing any scoreboard (not just public or owned)
CREATE OR REPLACE FUNCTION public.can_view_scoreboard(scoreboard_uuid UUID) 
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_temp, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.scoreboards 
    WHERE id = scoreboard_uuid
  );
$$;

COMMENT ON FUNCTION public.can_view_scoreboard IS 'Returns true if scoreboard exists (allows viewing any scoreboard via direct link). Uses fixed search_path for security.';
