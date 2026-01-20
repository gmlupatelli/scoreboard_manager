# Applying Migration: Allow Anonymous Scoreboard Access

This migration enables anonymous users (not logged in) to view private scoreboards when they have a direct link.

## Migration File
`supabase/migrations/20260120000000_allow_anonymous_scoreboard_access.sql`

## Changes Made

This migration modifies Row Level Security (RLS) policies to allow anonymous users to:
1. View any scoreboard (public or private) via direct link
2. View entries for any scoreboard
3. Still restricts editing/deleting to owners only

## How to Apply

### Option 1: Using Supabase CLI (Recommended)

If you have Supabase CLI configured:

```bash
# Link to your project (if not already linked)
supabase link --project-ref <your-project-ref>

# Push the migration
supabase db push
```

### Option 2: Manual Application via Dashboard

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy the contents of `supabase/migrations/20260120000000_allow_anonymous_scoreboard_access.sql`
3. Paste into the SQL editor
4. Click **Run**

### Option 3: Production Deployment

If you have a production build script:

```bash
npm run build:prod
```

This will run migrations and build the app.

## Testing

After applying the migration, test anonymous access:

1. Open a private scoreboard link in an incognito window:
   - View: `/individual-scoreboard-view?id=<scoreboard-id>`
   - Embed: `/embed/<scoreboard-id>`
2. Verify the scoreboard loads without authentication
3. Verify entries are visible

## Rollback (if needed)

If you need to revert this change, run the following SQL:

```sql
-- Restore original restrictive policies for anonymous users
DROP POLICY IF EXISTS "anon_select_all" ON scoreboards;
DROP POLICY IF EXISTS "anon_select_all_entries" ON scoreboard_entries;

CREATE POLICY "anon_select_public" ON scoreboards
  FOR SELECT
  TO anon
  USING (visibility = 'public');

CREATE POLICY "anon_select_public_entries" ON scoreboard_entries
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM scoreboards
      WHERE scoreboards.id = scoreboard_entries.scoreboard_id
      AND scoreboards.visibility = 'public'
    )
  );

-- Restore original can_view_scoreboard function
CREATE OR REPLACE FUNCTION public.can_view_scoreboard(scoreboard_uuid UUID) 
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_temp, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.scoreboards 
    WHERE id = scoreboard_uuid 
    AND (visibility = 'public' OR owner_id = auth.uid())
  );
$$;
```

## Security Considerations

This change allows anyone with a direct link to view private scoreboards. This is intentional based on the issue requirements. Private scoreboards are still:
- Not listed in public searches
- Only editable by owners
- Only manageable by owners

The "private" designation now means "not publicly listed" rather than "not accessible without login".

### Rate Limiting

This migration enables anonymous read access to all scoreboards and entries. Consider implementing rate limiting at the application or API gateway level to prevent:
- Data scraping by unauthenticated users
- Excessive queries that could impact database performance
- Potential abuse of the public API

**Recommended mitigations:**
1. **Supabase Edge Functions**: Implement rate limiting in edge functions if you're using them
2. **API Gateway**: Use Cloudflare, AWS API Gateway, or similar to rate limit by IP
3. **Monitoring**: Set up alerts for unusual query patterns from anonymous users
4. **Indexes**: Ensure proper database indexes exist (already configured in baseline migration)

The existing trigram indexes on `scoreboards` should help with performance, but monitor your database metrics after applying this change.
