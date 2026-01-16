-- Migration: Enable realtime for kiosk_configs and kiosk_slides tables
-- This allows the management UI to receive instant updates when slides change

-- Set REPLICA IDENTITY FULL for tables that need real-time updates
-- This allows the realtime system to identify rows in UPDATE/DELETE events
ALTER TABLE public.kiosk_configs REPLICA IDENTITY FULL;
ALTER TABLE public.kiosk_slides REPLICA IDENTITY FULL;

-- Add tables to the supabase_realtime publication (idempotent - handles case where already added)
DO $$
BEGIN
  -- Add kiosk_configs if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'kiosk_configs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kiosk_configs;
  END IF;
  
  -- Add kiosk_slides if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'kiosk_slides'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kiosk_slides;
  END IF;
END $$;
