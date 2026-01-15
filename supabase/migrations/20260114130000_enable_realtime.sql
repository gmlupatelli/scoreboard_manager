-- Migration: Enable realtime for scoreboards and scoreboard_entries tables
-- This is required for Supabase Realtime to broadcast postgres_changes events

-- Set REPLICA IDENTITY FULL for tables that need real-time updates
-- This allows the realtime system to identify rows in UPDATE/DELETE events
ALTER TABLE public.scoreboards REPLICA IDENTITY FULL;
ALTER TABLE public.scoreboard_entries REPLICA IDENTITY FULL;

-- Add tables to the supabase_realtime publication (idempotent - handles case where already added)
-- This is the publication that Supabase Realtime subscribes to
DO $$
BEGIN
  -- Add scoreboards if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'scoreboards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scoreboards;
  END IF;
  
  -- Add scoreboard_entries if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'scoreboard_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scoreboard_entries;
  END IF;
END $$;
