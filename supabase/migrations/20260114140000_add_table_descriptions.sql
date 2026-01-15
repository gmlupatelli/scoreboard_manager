-- Migration: Add table and column descriptions
-- This adds PostgreSQL COMMENT statements for documentation and Supabase Dashboard visibility

-- ============================================================================
-- TABLE DESCRIPTIONS
-- ============================================================================

COMMENT ON TABLE public.user_profiles IS 'User account profiles synced from Supabase Auth. Contains display name, email, and role information.';

COMMENT ON TABLE public.scoreboards IS 'Scoreboards with ownership, visibility settings, scoring type, and custom styling options.';

COMMENT ON TABLE public.scoreboard_entries IS 'Individual entries (players/teams) within scoreboards, containing names, scores, and optional details.';

COMMENT ON TABLE public.invitations IS 'User invitations for registration. Tracks inviter, invitee email, status, and expiration.';

COMMENT ON TABLE public.system_settings IS 'Global application settings. Single-row table controlling registration mode and email verification.';

COMMENT ON TABLE public.kiosk_configs IS 'Kiosk mode configurations per scoreboard. Controls display settings, rotation timing, and slide ordering.';

COMMENT ON TABLE public.kiosk_slides IS 'Custom slides for kiosk mode display. Supports image uploads with title, description, and duration settings.';

COMMENT ON TABLE public.kiosk_file_registry IS 'Tracks all uploaded kiosk files for orphan detection and cleanup.';

-- ============================================================================
-- COLUMN DESCRIPTIONS - user_profiles
-- ============================================================================

COMMENT ON COLUMN public.user_profiles.id IS 'Primary key, references auth.users(id)';
COMMENT ON COLUMN public.user_profiles.email IS 'User email address (unique, validated format)';
COMMENT ON COLUMN public.user_profiles.full_name IS 'Display name for the user';
COMMENT ON COLUMN public.user_profiles.role IS 'User role: system_admin or user';
COMMENT ON COLUMN public.user_profiles.created_at IS 'Account creation timestamp';
COMMENT ON COLUMN public.user_profiles.updated_at IS 'Last profile update timestamp';

-- ============================================================================
-- COLUMN DESCRIPTIONS - scoreboards
-- ============================================================================

COMMENT ON COLUMN public.scoreboards.id IS 'Primary key (UUID)';
COMMENT ON COLUMN public.scoreboards.owner_id IS 'Foreign key to user_profiles - scoreboard owner';
COMMENT ON COLUMN public.scoreboards.title IS 'Scoreboard title (3-100 characters)';
COMMENT ON COLUMN public.scoreboards.description IS 'Optional description (max 200 characters)';
COMMENT ON COLUMN public.scoreboards.sort_order IS 'Score sorting: asc (lowest first) or desc (highest first)';
COMMENT ON COLUMN public.scoreboards.visibility IS 'Access control: public (anyone) or private (owner only)';
COMMENT ON COLUMN public.scoreboards.score_type IS 'Score format: number or time';
COMMENT ON COLUMN public.scoreboards.time_format IS 'Time display format when score_type is time (e.g., mm:ss, hh:mm:ss)';
COMMENT ON COLUMN public.scoreboards.custom_styles IS 'JSONB object with custom styling (colors, fonts, etc.)';
COMMENT ON COLUMN public.scoreboards.style_scope IS 'Where styles apply: main, embed, or both';
COMMENT ON COLUMN public.scoreboards.created_at IS 'Scoreboard creation timestamp';
COMMENT ON COLUMN public.scoreboards.updated_at IS 'Last modification timestamp';

-- ============================================================================
-- COLUMN DESCRIPTIONS - scoreboard_entries
-- ============================================================================

COMMENT ON COLUMN public.scoreboard_entries.id IS 'Primary key (UUID)';
COMMENT ON COLUMN public.scoreboard_entries.scoreboard_id IS 'Foreign key to scoreboards';
COMMENT ON COLUMN public.scoreboard_entries.name IS 'Entry name - player, team, or participant (1-100 chars)';
COMMENT ON COLUMN public.scoreboard_entries.score IS 'Numeric score value';
COMMENT ON COLUMN public.scoreboard_entries.details IS 'Optional additional details (max 500 characters)';
COMMENT ON COLUMN public.scoreboard_entries.created_at IS 'Entry creation timestamp';
COMMENT ON COLUMN public.scoreboard_entries.updated_at IS 'Last modification timestamp';

-- ============================================================================
-- COLUMN DESCRIPTIONS - invitations
-- ============================================================================

COMMENT ON COLUMN public.invitations.id IS 'Primary key (UUID)';
COMMENT ON COLUMN public.invitations.inviter_id IS 'Foreign key to user_profiles - who sent the invite (nullable if inviter deleted)';
COMMENT ON COLUMN public.invitations.invitee_email IS 'Email address of the invited person';
COMMENT ON COLUMN public.invitations.status IS 'Invitation status: pending, accepted, expired, or cancelled';
COMMENT ON COLUMN public.invitations.accepted_at IS 'Timestamp when invitation was accepted (required if status=accepted)';
COMMENT ON COLUMN public.invitations.expires_at IS 'Invitation expiration timestamp (default: 7 days from creation)';
COMMENT ON COLUMN public.invitations.created_at IS 'Invitation creation timestamp';
COMMENT ON COLUMN public.invitations.updated_at IS 'Last status update timestamp';

-- ============================================================================
-- COLUMN DESCRIPTIONS - system_settings
-- ============================================================================

COMMENT ON COLUMN public.system_settings.id IS 'Primary key (always "default" - single row table)';
COMMENT ON COLUMN public.system_settings.allow_public_registration IS 'If true, anyone can register. If false, invitation required.';
COMMENT ON COLUMN public.system_settings.require_email_verification IS 'If true, users must verify email before full access.';
COMMENT ON COLUMN public.system_settings.created_at IS 'Settings creation timestamp';
COMMENT ON COLUMN public.system_settings.updated_at IS 'Last settings update timestamp';

-- ============================================================================
-- COLUMN DESCRIPTIONS - kiosk_configs
-- ============================================================================

COMMENT ON COLUMN public.kiosk_configs.id IS 'Primary key (UUID)';
COMMENT ON COLUMN public.kiosk_configs.scoreboard_id IS 'Foreign key to scoreboards (unique - one config per scoreboard)';
COMMENT ON COLUMN public.kiosk_configs.enabled IS 'Whether kiosk mode is active for this scoreboard';
COMMENT ON COLUMN public.kiosk_configs.pin_code IS 'Optional PIN code for kiosk access protection';
COMMENT ON COLUMN public.kiosk_configs.scoreboard_position IS 'Position of the scoreboard slide in rotation order';
COMMENT ON COLUMN public.kiosk_configs.slide_duration_seconds IS 'Default seconds to display each slide';
COMMENT ON COLUMN public.kiosk_configs.created_at IS 'Config creation timestamp';
COMMENT ON COLUMN public.kiosk_configs.updated_at IS 'Last config update timestamp';

-- ============================================================================
-- COLUMN DESCRIPTIONS - kiosk_slides
-- ============================================================================

COMMENT ON COLUMN public.kiosk_slides.id IS 'Primary key (UUID)';
COMMENT ON COLUMN public.kiosk_slides.kiosk_config_id IS 'Foreign key to kiosk_configs';
COMMENT ON COLUMN public.kiosk_slides.slide_type IS 'Type of slide: image or scoreboard';
COMMENT ON COLUMN public.kiosk_slides.position IS 'Order position in slide sequence';
COMMENT ON COLUMN public.kiosk_slides.image_url IS 'Storage path to the slide image';
COMMENT ON COLUMN public.kiosk_slides.thumbnail_url IS 'Storage path to the thumbnail image';
COMMENT ON COLUMN public.kiosk_slides.file_name IS 'Original uploaded file name';
COMMENT ON COLUMN public.kiosk_slides.file_size IS 'File size in bytes';
COMMENT ON COLUMN public.kiosk_slides.duration_override_seconds IS 'Optional custom duration (overrides config default)';
COMMENT ON COLUMN public.kiosk_slides.created_at IS 'Slide creation timestamp';

-- ============================================================================
-- COLUMN DESCRIPTIONS - kiosk_file_registry
-- ============================================================================

COMMENT ON COLUMN public.kiosk_file_registry.id IS 'Primary key (UUID)';
COMMENT ON COLUMN public.kiosk_file_registry.storage_path IS 'Full path in Supabase Storage bucket';
COMMENT ON COLUMN public.kiosk_file_registry.file_type IS 'Type of file: original or thumbnail';
COMMENT ON COLUMN public.kiosk_file_registry.slide_id IS 'Foreign key to kiosk_slides (null if orphaned/pending)';
COMMENT ON COLUMN public.kiosk_file_registry.user_id IS 'Foreign key to user_profiles - who uploaded the file';
COMMENT ON COLUMN public.kiosk_file_registry.scoreboard_id IS 'Foreign key to scoreboards - associated scoreboard';
COMMENT ON COLUMN public.kiosk_file_registry.file_size IS 'File size in bytes';
COMMENT ON COLUMN public.kiosk_file_registry.created_at IS 'Upload timestamp';
