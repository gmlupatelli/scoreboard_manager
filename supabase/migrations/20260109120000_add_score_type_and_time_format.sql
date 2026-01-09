-- Add score_type column to scoreboards table
ALTER TABLE scoreboards 
ADD COLUMN IF NOT EXISTS score_type VARCHAR(10) NOT NULL DEFAULT 'number'
CHECK (score_type IN ('number', 'time'));

-- Add time_format column for time-based scoreboards
ALTER TABLE scoreboards 
ADD COLUMN IF NOT EXISTS time_format VARCHAR(20) DEFAULT NULL
CHECK (time_format IS NULL OR time_format IN ('hh:mm', 'hh:mm:ss', 'mm:ss', 'mm:ss.s', 'mm:ss.ss', 'mm:ss.sss'));

-- All existing scoreboards default to 'number' type with 'desc' sort order
-- The default values in the ALTER statement handle this automatically

-- Update existing scoreboards to ensure sort_order is 'desc' if not already set
UPDATE scoreboards SET sort_order = 'desc' WHERE sort_order IS NULL;

COMMENT ON COLUMN scoreboards.score_type IS 'Type of score: number for numeric scores, time for duration-based scores';
COMMENT ON COLUMN scoreboards.time_format IS 'Display format for time scores: hh:mm, hh:mm:ss, mm:ss, mm:ss.s, mm:ss.ss, mm:ss.sss';
