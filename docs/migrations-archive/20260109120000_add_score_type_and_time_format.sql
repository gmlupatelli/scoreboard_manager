-- ============================================================================
-- ADD SCORE TYPE AND TIME FORMAT MIGRATION (ARCHIVED)
-- Date: January 9, 2026
-- Archived: January 12, 2026
-- ============================================================================

-- Add score_type column with default 'number'
ALTER TABLE scoreboards 
ADD COLUMN score_type TEXT NOT NULL DEFAULT 'number'
CHECK (score_type IN ('number', 'time'));

-- Add time_format column (nullable, only used when score_type = 'time')
ALTER TABLE scoreboards 
ADD COLUMN time_format TEXT
CHECK (time_format IS NULL OR time_format IN ('hh:mm', 'hh:mm:ss', 'mm:ss', 'mm:ss.s', 'mm:ss.ss', 'mm:ss.sss'));
