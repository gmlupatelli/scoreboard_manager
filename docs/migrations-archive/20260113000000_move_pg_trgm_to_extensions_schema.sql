-- Migration: Move pg_trgm extension from public to dedicated extensions schema
-- This addresses the Supabase lint warning about extensions in public schema

-- Step 1: Create the dedicated extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Step 2: Move the pg_trgm extension to the extensions schema
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Step 3: Grant usage on the extensions schema to necessary roles
-- Supabase uses these roles for authenticated and anonymous access
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- Step 4: Update the search_path for roles that need access to extension functions
-- This allows unqualified use of pg_trgm functions like similarity()
ALTER ROLE authenticated SET search_path = extensions, public;
ALTER ROLE anon SET search_path = extensions, public;
ALTER ROLE service_role SET search_path = extensions, public;

-- Step 5: Recreate the GIN trigram indexes
-- The indexes reference the operator class, so we need to drop and recreate them
-- with the schema-qualified operator class

-- Drop existing indexes
DROP INDEX IF EXISTS public.idx_scoreboards_title_trgm;
DROP INDEX IF EXISTS public.idx_scoreboards_description_trgm;

-- Recreate indexes with schema-qualified operator class
CREATE INDEX idx_scoreboards_title_trgm 
  ON public.scoreboards 
  USING gin (title extensions.gin_trgm_ops);

CREATE INDEX idx_scoreboards_description_trgm 
  ON public.scoreboards 
  USING gin (description extensions.gin_trgm_ops);
