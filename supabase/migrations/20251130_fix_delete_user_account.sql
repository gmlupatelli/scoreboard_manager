-- Migration: Fix delete_user_account function
-- Created: 2025-11-30
-- Purpose: Fix reference to non-existent "public.entries" table - should be "public.scoreboard_entries"
-- 
-- INSTRUCTIONS:
-- Run this SQL in your Supabase Dashboard SQL Editor for BOTH development and production:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"

CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_id UUID;
  deleted_scoreboards INTEGER;
  deleted_entries INTEGER;
  deleted_profile INTEGER;
BEGIN
  -- Get the current user ID
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Not authenticated'
    );
  END IF;

  -- Delete user's scoreboard entries first (FIXED: was "public.entries", now "public.scoreboard_entries")
  DELETE FROM public.scoreboard_entries 
  WHERE scoreboard_id IN (
    SELECT id FROM public.scoreboards WHERE owner_id = user_id
  );
  GET DIAGNOSTICS deleted_entries = ROW_COUNT;
  
  -- Delete user's scoreboards (this will also cascade delete entries due to FK constraint)
  DELETE FROM public.scoreboards WHERE owner_id = user_id;
  GET DIAGNOSTICS deleted_scoreboards = ROW_COUNT;
  
  -- Delete user profile (auth.users deletion must be done via Supabase Auth API)
  DELETE FROM public.user_profiles WHERE id = user_id;
  GET DIAGNOSTICS deleted_profile = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Account data deleted successfully',
    'deleted_scoreboards', deleted_scoreboards,
    'deleted_entries', deleted_entries,
    'deleted_profile', deleted_profile > 0
  );
END;
$$;

-- Ensure permissions are granted
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;

COMMENT ON FUNCTION delete_user_account IS 'Deletes user account data including profile, entries, and scoreboards';
