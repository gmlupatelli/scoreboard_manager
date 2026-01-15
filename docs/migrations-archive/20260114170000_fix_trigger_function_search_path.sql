-- Migration: Fix search_path for update_kiosk_configs_updated_at trigger function
-- Date: 2026-01-14
-- Description: Set explicit search_path to prevent mutable search_path security issue

CREATE OR REPLACE FUNCTION public.update_kiosk_configs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_temp, public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_kiosk_configs_updated_at IS 'Trigger function to auto-update updated_at timestamp. Uses fixed search_path for security.';
