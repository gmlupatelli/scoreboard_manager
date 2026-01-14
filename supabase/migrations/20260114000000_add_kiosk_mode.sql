-- ============================================================================
-- KIOSK MODE MIGRATION
-- Date: January 14, 2026
-- Description: Add kiosk/TV mode support with carousel slides functionality
-- ============================================================================

-- Create slide_type enum
CREATE TYPE slide_type AS ENUM ('image', 'scoreboard');

-- ============================================================================
-- KIOSK CONFIGURATIONS TABLE
-- ============================================================================
-- Stores kiosk settings for each scoreboard

CREATE TABLE kiosk_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scoreboard_id UUID NOT NULL REFERENCES scoreboards(id) ON DELETE CASCADE UNIQUE,
  slide_duration_seconds INTEGER NOT NULL DEFAULT 10,
  scoreboard_position INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT false,
  pin_code TEXT, -- Optional PIN protection (hashed)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_kiosk_configs_slide_duration CHECK (slide_duration_seconds >= 3 AND slide_duration_seconds <= 300),
  CONSTRAINT chk_kiosk_configs_scoreboard_position CHECK (scoreboard_position >= 0),
  CONSTRAINT chk_kiosk_configs_timestamps CHECK (created_at <= updated_at)
);

-- ============================================================================
-- KIOSK SLIDES TABLE
-- ============================================================================
-- Stores individual slides for kiosk carousels

CREATE TABLE kiosk_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosk_config_id UUID NOT NULL REFERENCES kiosk_configs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  slide_type slide_type NOT NULL,
  image_url TEXT, -- For image slides (Supabase Storage path)
  thumbnail_url TEXT, -- Thumbnail for management UI
  duration_override_seconds INTEGER, -- Optional per-slide duration
  file_name TEXT, -- Original filename for display
  file_size INTEGER, -- File size in bytes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT uq_kiosk_slides_position UNIQUE (kiosk_config_id, position),
  CONSTRAINT chk_kiosk_slides_position CHECK (position >= 0),
  CONSTRAINT chk_kiosk_slides_duration CHECK (duration_override_seconds IS NULL OR (duration_override_seconds >= 3 AND duration_override_seconds <= 300)),
  CONSTRAINT chk_kiosk_slides_image_url CHECK (
    (slide_type = 'image' AND image_url IS NOT NULL) OR
    (slide_type = 'scoreboard' AND image_url IS NULL)
  )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for querying slides by config and position
CREATE INDEX idx_kiosk_slides_config_position ON kiosk_slides(kiosk_config_id, position);

-- Index for looking up kiosk config by scoreboard
CREATE INDEX idx_kiosk_configs_scoreboard ON kiosk_configs(scoreboard_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at on kiosk_configs
CREATE OR REPLACE FUNCTION update_kiosk_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_kiosk_configs_updated_at
  BEFORE UPDATE ON kiosk_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_kiosk_configs_updated_at();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE kiosk_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosk_slides ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user owns the scoreboard for a kiosk config
CREATE OR REPLACE FUNCTION owns_kiosk_config(config_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM kiosk_configs kc
    JOIN scoreboards s ON s.id = kc.scoreboard_id
    WHERE kc.id = config_id AND s.owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function: Check if kiosk is viewable (public scoreboard with kiosk enabled)
CREATE OR REPLACE FUNCTION can_view_kiosk(config_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM kiosk_configs kc
    JOIN scoreboards s ON s.id = kc.scoreboard_id
    WHERE kc.id = config_id 
    AND kc.enabled = true
    AND (s.visibility = 'public' OR s.owner_id = auth.uid())
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Kiosk configs policies
CREATE POLICY "Users can view their own kiosk configs"
  ON kiosk_configs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scoreboards 
      WHERE scoreboards.id = kiosk_configs.scoreboard_id 
      AND scoreboards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert kiosk configs for their scoreboards"
  ON kiosk_configs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scoreboards 
      WHERE scoreboards.id = scoreboard_id 
      AND scoreboards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own kiosk configs"
  ON kiosk_configs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM scoreboards 
      WHERE scoreboards.id = kiosk_configs.scoreboard_id 
      AND scoreboards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own kiosk configs"
  ON kiosk_configs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM scoreboards 
      WHERE scoreboards.id = kiosk_configs.scoreboard_id 
      AND scoreboards.owner_id = auth.uid()
    )
  );

-- Public can view enabled kiosks for public scoreboards
CREATE POLICY "Anyone can view enabled public kiosk configs"
  ON kiosk_configs FOR SELECT
  USING (
    enabled = true
    AND EXISTS (
      SELECT 1 FROM scoreboards 
      WHERE scoreboards.id = kiosk_configs.scoreboard_id 
      AND scoreboards.visibility = 'public'
    )
  );

-- Kiosk slides policies
CREATE POLICY "Users can view slides for their kiosk configs"
  ON kiosk_slides FOR SELECT
  USING (owns_kiosk_config(kiosk_config_id));

CREATE POLICY "Users can insert slides for their kiosk configs"
  ON kiosk_slides FOR INSERT
  WITH CHECK (owns_kiosk_config(kiosk_config_id));

CREATE POLICY "Users can update slides for their kiosk configs"
  ON kiosk_slides FOR UPDATE
  USING (owns_kiosk_config(kiosk_config_id));

CREATE POLICY "Users can delete slides for their kiosk configs"
  ON kiosk_slides FOR DELETE
  USING (owns_kiosk_config(kiosk_config_id));

-- Public can view slides for enabled public kiosks
CREATE POLICY "Anyone can view slides for enabled public kiosks"
  ON kiosk_slides FOR SELECT
  USING (can_view_kiosk(kiosk_config_id));

-- ============================================================================
-- STORAGE BUCKET FOR KIOSK SLIDES
-- ============================================================================
-- Note: This needs to be run in Supabase Dashboard or via Supabase CLI
-- The bucket 'kiosk-slides' should be created with the following settings:
-- - Public: false (use signed URLs or RLS)
-- - File size limit: 10MB
-- - Allowed MIME types: image/png, image/jpeg, image/webp, application/pdf

-- Storage policies (to be created in Supabase Dashboard):
-- 1. Users can upload to their own folder: kiosk-slides/{user_id}/{scoreboard_id}/*
-- 2. Users can delete from their own folder
-- 3. Public read access for enabled kiosks with signed URLs
