# ACTION REQUIRED: Apply Database Migration

## Summary

This PR fixes the issue where private scoreboards are not accessible to non-logged-in users who have a direct link. 

The code changes have been made, but **you need to apply the database migration** to make the fix work.

## What Changed

### 1. Database Migration (Requires Manual Application)
A new migration file has been created: `supabase/migrations/20260120000000_allow_anonymous_scoreboard_access.sql`

This migration:
- Allows anonymous users to view any scoreboard (public or private) via direct link
- Allows anonymous users to view entries for any scoreboard
- Still restricts editing/deleting to owners only

### 2. UI Text Updates (Already Applied)
- Updated modal text from "Only you can view this scoreboard" to "Only you or someone with the scoreboard link can view this scoreboard"
- Changes made in:
  - `src/app/dashboard/components/CreateScoreboardModal.tsx`
  - `src/app/scoreboard-management/components/EditScoreboardModal.tsx`

## How to Apply the Migration

### Quick Method: Using Supabase CLI

```bash
# Make sure you're linked to your production project
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push
```

### Alternative: Via Supabase Dashboard

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Open the file: `supabase/migrations/20260120000000_allow_anonymous_scoreboard_access.sql`
3. Copy all the SQL code
4. Paste it into the SQL editor
5. Click **Run**

### Using the Build Script

If you have a production deployment process:

```bash
npm run build:prod
```

This will run migrations and build the app.

## Testing After Migration

Once the migration is applied, test the following in an incognito/private browser window:

1. **Private Scoreboard View Page**
   - Navigate to: `/individual-scoreboard-view?id=<private-scoreboard-id>`
   - Should load successfully without requiring login
   - Should display scoreboard title, description, and entries

2. **Private Scoreboard Embed Page**
   - Navigate to: `/embed/<private-scoreboard-id>`
   - Should load successfully without requiring login
   - Should display embedded scoreboard with styling

3. **Verify Owner-Only Actions**
   - Private scoreboards should still only be editable by owners
   - Verify that management pages still require authentication

## Security Notes

This change makes private scoreboards accessible to anyone with the link. This is the intended behavior based on the issue requirements.

Private scoreboards are still:
- ✅ Not listed in public searches or the public scoreboards page
- ✅ Only editable by their owners
- ✅ Only manageable (delete, edit settings) by their owners

The "private" designation now means:
- ❌ **Before**: Not accessible without being the owner and logged in
- ✅ **After**: Not publicly listed, but accessible to anyone with the direct link

## Rollback Instructions

If you need to revert this change, see the rollback section in `docs/MIGRATION_GUIDE_20260120.md`.

## Questions?

See the full migration guide: `docs/MIGRATION_GUIDE_20260120.md`
