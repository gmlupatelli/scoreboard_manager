# Migrations Archive

This folder contains archived migration files for historical reference.

## Archived Migrations

### Batch 1 (Archived 2026-01-12)

| Version        | Name                           | Notes                                                   |
| -------------- | ------------------------------ | ------------------------------------------------------- |
| 20260109120000 | add_score_type_and_time_format | Added score_type and time_format columns                |
| 20260111000000 | comprehensive_improvements     | Renamed subtitle→description, added constraints/indexes |

### Batch 2 (Archived 2026-01-15)

| Version        | Name                                  | Notes                                              |
| -------------- | ------------------------------------- | -------------------------------------------------- |
| 20260112000000 | baseline                              | Previous baseline (Jan 12)                         |
| 20260113000000 | move_pg_trgm_to_extensions_schema     | Moved pg_trgm to extensions schema                 |
| 20260114000000 | add_kiosk_mode                        | Kiosk mode tables and RLS                          |
| 20260114100000 | create_kiosk_storage_bucket           | Storage bucket for kiosk slides                    |
| 20260114110000 | add_kiosk_file_registry               | File registry for orphan detection                 |
| 20260114120000 | convert_ids_to_uuid                   | Changed scoreboard/entry IDs from TEXT to UUID     |
| 20260114130000 | enable_realtime                       | Enabled Realtime for scoreboards/entries           |
| 20260114140000 | add_table_descriptions                | Added PostgreSQL COMMENT statements                |
| 20260114150000 | admin_view_all_scoreboards            | Admin RLS policy for viewing all scoreboards       |
| 20260114160000 | fix_function_search_path              | Security fix: explicit search_path on functions    |
| 20260114170000 | fix_trigger_function_search_path      | Security fix: search_path on trigger function      |
| 20260115100000 | fix_kiosk_slides_rls                  | Fixed nested RLS issue with SECURITY DEFINER       |

## Why Archive?

Migrations are archived (squashed) when:

- The schema is stable after multiple changes
- There are 10+ migration files cluttering the folder
- Starting fresh after manual database changes

## Current Baseline

The active baseline is `supabase/migrations/20260115000000_baseline.sql` which documents the complete schema as of January 15, 2026.

**This baseline is COMPLETE and EXECUTABLE** - it contains everything needed to replicate the database from scratch:

- ✅ Extensions (pg_trgm in extensions schema)
- ✅ All ENUM types
- ✅ All tables with constraints
- ✅ All indexes (including trigram for search)
- ✅ All RLS helper functions (with fixed search_path)
- ✅ All RLS policies
- ✅ Storage bucket and policies
- ✅ Realtime publication configuration
- ✅ Table and column documentation (COMMENT statements)
- ✅ Instructions for auth trigger and initial setup

## Restoring Archived Migrations

If you need to reference the original SQL, the files are preserved in this folder. Note that these cannot be re-applied to databases that already have the baseline applied.

## Squashing Process

When squashing migrations:

1. **Clear remote history** (run in Supabase SQL Editor):

   ```sql
   DELETE FROM supabase_migrations.schema_migrations;
   ```

2. **Archive old migration files** to this folder

3. **Create new baseline** in `supabase/migrations/`:

   ```bash
   supabase migration new baseline
   ```

4. **Document schema** in the baseline file (as comments)

5. **Commit and push** - Netlify will record the new baseline
