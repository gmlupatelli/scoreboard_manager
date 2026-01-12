# Migrations Archive

This folder contains archived migration files for historical reference.

## Archived Migrations

| Version | Name | Archived Date | Notes |
|---------|------|---------------|-------|
| 20260109120000 | add_score_type_and_time_format | 2026-01-12 | Added score_type and time_format columns |
| 20260111000000 | comprehensive_improvements | 2026-01-12 | Renamed subtitle→description, added constraints/indexes |

## Why Archive?

Migrations are archived (squashed) when:
- The schema is stable after multiple changes
- There are 10+ migration files cluttering the folder
- Starting fresh after manual database changes

## Current Baseline

The active baseline is `supabase/migrations/20260112000000_baseline.sql` which documents the complete schema as of January 12, 2026.

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
