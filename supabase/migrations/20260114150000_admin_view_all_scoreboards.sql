-- Migration: Allow system admins to view ALL scoreboards (including private)
-- Date: 2026-01-14
-- Description: Adds RLS policy for system_admin users to view all scoreboards and entries

-- ============================================================================
-- System admin can view ALL scoreboards (public and private)
-- ============================================================================

-- Drop if exists to make idempotent
DROP POLICY IF EXISTS "admin_select_all" ON scoreboards;

CREATE POLICY "admin_select_all" ON scoreboards
  FOR SELECT
  TO authenticated
  USING (is_system_admin());

-- ============================================================================
-- System admin can view ALL scoreboard entries
-- ============================================================================

DROP POLICY IF EXISTS "admin_select_all_entries" ON scoreboard_entries;

CREATE POLICY "admin_select_all_entries" ON scoreboard_entries
  FOR SELECT
  TO authenticated
  USING (is_system_admin());
