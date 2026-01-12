-- ============================================================================
-- COMPREHENSIVE DATABASE IMPROVEMENTS MIGRATION
-- Date: January 11, 2026
-- Description: Rename subtitle→description, add constraints, indexes
-- ============================================================================
--
-- NOTE: This migration was applied manually to the production database.
-- This file exists only to satisfy Supabase migration tracking.
--
-- Changes applied manually:
--   - Renamed scoreboards.subtitle → description
--   - Added CHECK constraints on user_profiles, scoreboards, entries, invitations
--   - Added performance indexes (trigram, composite)
--   - Enabled pg_trgm extension
--
-- ============================================================================

SELECT 1; -- No-op to satisfy migration runner
