# Supabase Realtime Setup Guide

This document describes how to configure Supabase Realtime for the Scoreboard Manager application.

## Overview

The application uses Supabase Realtime to provide live updates when scoreboard entries are added, modified, or deleted. This allows multiple users to see changes without refreshing the page.

## Tables with Realtime Enabled

- `scoreboards` - Main scoreboard definitions
- `scoreboard_entries` - Individual entries/scores

## Database Configuration

### 1. REPLICA IDENTITY FULL

Tables must have `REPLICA IDENTITY FULL` set to include all column values in UPDATE/DELETE events:

```sql
ALTER TABLE public.scoreboards REPLICA IDENTITY FULL;
ALTER TABLE public.scoreboard_entries REPLICA IDENTITY FULL;
```

### 2. Publication Membership

Tables must be added to the `supabase_realtime` publication:

```sql
-- Check current tables in publication
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Add tables if not already present (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'scoreboards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scoreboards;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'scoreboard_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scoreboard_entries;
  END IF;
END $$;
```

### 3. Refresh Schema Cache

After making changes, notify Supabase to reload its schema cache:

```sql
NOTIFY pgrst, 'reload schema';
```

## Production Deployment Checklist

When deploying to a new environment or after schema changes:

### Option A: Via Supabase CLI

```bash
# Push migrations (includes 20260114130000_enable_realtime.sql)
npx supabase db push --linked
```

### Option B: Via SQL Editor

Run this complete script in the Supabase Dashboard SQL Editor:

```sql
-- Step 1: Set REPLICA IDENTITY FULL
ALTER TABLE public.scoreboards REPLICA IDENTITY FULL;
ALTER TABLE public.scoreboard_entries REPLICA IDENTITY FULL;

-- Step 2: Add to publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'scoreboards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scoreboards;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'scoreboard_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scoreboard_entries;
  END IF;
END $$;

-- Step 3: Refresh schema cache
NOTIFY pgrst, 'reload schema';
```

### Option C: Via Supabase Dashboard UI

1. Go to **Database** → **Publications**
2. Click on `supabase_realtime`
3. Ensure both `scoreboards` and `scoreboard_entries` are checked/enabled

## Verification

### Check Publication Status

```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

Expected output:
| schemaname | tablename |
|------------|-----------|
| public | scoreboards |
| public | scoreboard_entries |

### Check REPLICA IDENTITY

```sql
SELECT c.relname, c.relreplident
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND c.relname IN ('scoreboards', 'scoreboard_entries');
```

Expected output (f = FULL):
| relname | relreplident |
|---------|--------------|
| scoreboards | f |
| scoreboard_entries | f |

## Troubleshooting

### Error: "mismatch between server and client bindings"

This typically occurs when:

1. Tables are not in the `supabase_realtime` publication
2. Schema changes were made but the cache wasn't refreshed
3. Column types changed (e.g., TEXT → UUID migration)

**Solution:** Run the SQL commands in Option B above.

### Subscription status: CHANNEL_ERROR

Check browser console for details. Common causes:

- RLS policies blocking anonymous access to public scoreboards
- Tables not enabled in publication
- Network/WebSocket connection issues

### Subscription works but no events received

1. Verify the table change is being made (check database directly)
2. Confirm RLS allows the user to SELECT the changed rows
3. For anonymous users, ensure scoreboard `visibility = 'public'`

## Client-Side Implementation

The realtime subscription is implemented in `src/services/scoreboardService.ts`:

```typescript
subscribeToScoreboardChanges(
  scoreboardId: string,
  callbacks: {
    onScoreboardChange?: () => void;
    onEntriesChange?: () => void;
  }
)
```

**Note:** The subscription uses Supabase Realtime's `filter` parameter to only receive events for the specific scoreboard. This is more efficient than filtering client-side as it reduces network traffic.

## Related Files

- Migration: `supabase/migrations/20260114130000_enable_realtime.sql`
- Service: `src/services/scoreboardService.ts` (subscribeToScoreboardChanges)
- Components using realtime:
  - `src/app/individual-scoreboard-view/components/ScoreboardInteractive.tsx`
  - `src/app/individual-scoreboard-view/components/ScoreboardViewLayout.tsx`
  - `src/app/embed/[id]/page.tsx`
