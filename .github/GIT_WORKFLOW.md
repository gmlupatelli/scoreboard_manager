# Git Workflow Guide

## Repository Information
- **Repository**: `gmlupatelli/scoreboard_manager`
- **Main Branch**: `main` (production)
- **Development Branch**: `dev` (testing)
- **Production URL**: https://myscoreboardmanager.netlify.app
- **Dev Preview**: https://dev--myscoreboardmanager.netlify.app

---

## Branch Strategy

### **Main Branches**
- `main` - Production branch (deploys to Netlify production)
- `dev` - Development/testing branch (deploys to Netlify preview)

### **Feature Branches**
- Create feature branches from `dev`
- Naming convention: `feature/description-of-feature`
- Examples: `feature/add-color-picker`, `feature/fix-login-bug`

---

## Common Workflows

### **Starting a New Feature**

```powershell
# 1. Switch to dev and pull latest changes
git checkout dev
git pull origin dev

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes
# ... edit files ...

# 4. Stage and commit
git add .
git commit -m "feat: description of changes"

# 5. Push to remote
git push origin feature/your-feature-name
```

### **Updating Your Feature Branch**

```powershell
# Get latest changes from dev
git checkout dev
git pull origin dev

# Switch back to your feature branch
git checkout feature/your-feature-name

# Merge dev into your feature branch
git merge dev

# Or rebase (cleaner history)
git rebase dev

# Push updates
git push origin feature/your-feature-name
```

### **Merging to Dev (Testing)**

```powershell
# 1. Switch to dev
git checkout dev
git pull origin dev

# 2. Merge your feature branch
git merge feature/your-feature-name

# 3. Push to dev (triggers Netlify dev preview)
git push origin dev

# 4. Test at: https://dev--myscoreboardmanager.netlify.app
```

### **Promoting Dev to Production**

```powershell
# 1. Ensure dev is working correctly
# Test at: https://dev--myscoreboardmanager.netlify.app

# 2. Switch to main
git checkout main
git pull origin main

# 3. Merge dev into main
git merge dev

# 4. Push to production (triggers Netlify production deploy)
git push origin main

# Production deploys to: https://myscoreboardmanager.netlify.app
```

### **Quick Fixes to Production**

```powershell
# For urgent hotfixes only
git checkout main
git checkout -b hotfix/description

# Make changes
git add .
git commit -m "fix: urgent fix description"

# Merge directly to main
git checkout main
git merge hotfix/description
git push origin main

# Don't forget to merge back to dev!
git checkout dev
git merge main
git push origin dev
```

---

## Commit Message Conventions

Use conventional commits format:

```
type(scope): subject

body (optional)
```

### **Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring (no functional changes)
- `style:` - Code style changes (formatting, missing semicolons, etc.)
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks (dependencies, configs)
- `perf:` - Performance improvements
- `ci:` - CI/CD pipeline changes

### **Examples:**
```powershell
git commit -m "feat: add RGBA color picker with transparency support"
git commit -m "fix: standardize password minimum to 6 characters"
git commit -m "refactor: improve localStorage error handling"
git commit -m "docs: update README with deployment instructions"
git commit -m "style: format code with Prettier"
git commit -m "test: add Playwright E2E tests for mobile interactions"
git commit -m "chore: update dependencies"
```

---

## Testing

### **Running E2E Tests**

The project uses Playwright for comprehensive end-to-end testing.

#### **Setup** (one-time)
```powershell
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Install system dependencies (Linux/WSL only)
sudo npx playwright install-deps
```

#### **Running Tests**
```powershell
# Run all tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/mobile.spec.ts

# Run specific device/browser
npx playwright test --project="Desktop Chrome"
npx playwright test --project="Mobile iPhone SE"
npx playwright test --project="Mobile Minimum"
```

#### **Test Coverage**
- **Mobile Tests**: Touch targets, swipe gestures, landscape orientation, 320px viewport
- **Desktop Tests**: Auth flows, CRUD operations, keyboard navigation, real-time updates
- **Accessibility Tests**: WCAG compliance, ARIA labels, screen readers, focus management

#### **Before Pushing Code**
```powershell
# 1. Run linting
npm run lint

# 2. Run type checking
npm run type-check

# 3. Run E2E tests (optional but recommended)
npm run test:e2e

# 4. If all pass, commit and push
git add .
git commit -m "feat: your changes"
git push
```

---

## Supabase Database Migrations

### **Setup Supabase CLI**

#### **Install Supabase CLI** (one-time)
```powershell
# Recommended: Using Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or using Chocolatey (Windows)
choco install supabase

# Or using npx (no global install needed)
# Just prefix commands with: npx supabase <command>
# Example: npx supabase login

# Or download binary directly from:
# https://github.com/supabase/cli/releases
```

#### **Configure Environment** (one-time)
1. Copy `.env.example` to `.env.local`
2. Fill in all Supabase credentials (see `.env.example` for instructions)
3. Get your Personal Access Token from Supabase dashboard

#### **Get Supabase Access Token**
1. Go to https://app.supabase.com
2. Click your profile (bottom left)
3. Go to **Account Settings** → **Access Tokens**
4. Click **Generate New Token**
5. Name it: "Local Development CLI"
6. Copy the token (starts with `sbp_`)
7. Add to `.env.local` as `SUPABASE_ACCESS_TOKEN`

#### **Get Database Password**
1. Go to your Supabase project dashboard
2. **Settings** → **Database**
3. Under **Connection string**, reveal the password
4. Add to `.env.local` as `SUPABASE_DB_PASSWORD`

#### **Get Project References**
1. Go to your Supabase project dashboard
2. **Settings** → **General**
3. Copy the **Reference ID** (example: `abcdefghijklmnop`)
4. Do this for both dev and prod projects
5. Add to `.env.local` as `SUPABASE_PROJECT_REF_DEV` and `SUPABASE_PROJECT_REF_PROD`

#### **Login to Supabase CLI**
```powershell
# Using access token from .env.local
supabase login

# Or manually
supabase login --token sbp_your_token_here
```

---

### **Working with Migrations**

#### **Link to Project**
```powershell
# Link to development project
supabase link --project-ref $env:SUPABASE_PROJECT_REF_DEV

# Or production project
supabase link --project-ref $env:SUPABASE_PROJECT_REF_PROD

# Verify link
supabase status
```

#### **Create a New Migration**
```powershell
# Generate migration file with timestamp
supabase migration new add_new_feature

# This creates: supabase/migrations/TIMESTAMP_add_new_feature.sql
```

#### **Write Your Migration**
Edit the generated SQL file:
```sql
-- supabase/migrations/20260110120000_add_new_feature.sql

-- Rollback: DROP COLUMN IF EXISTS new_field;

-- Add your SQL changes here
ALTER TABLE scoreboards ADD COLUMN new_field TEXT;

-- Example: Create a new table
CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own records"
ON new_table FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

#### **Check Migration Status**
```powershell
# See which migrations are applied
supabase migration list

# Output shows:
# Local: migrations on your machine
# Remote: migrations on Supabase server
```

#### **Apply Migration to Development**
```powershell
# 1. Link to dev project
supabase link --project-ref $env:SUPABASE_PROJECT_REF_DEV

# 2. Check status
supabase migration list

# 3. Push migration
supabase db push

# 4. Verify in Supabase dashboard
```

#### **Apply Migration to Production**
```powershell
# 1. Link to prod project
supabase link --project-ref $env:SUPABASE_PROJECT_REF_PROD

# 2. Check status
supabase migration list

# 3. Push migration (be careful!)
supabase db push

# 4. Verify in Supabase dashboard
```

---

### **Automated Production Migrations**

Production database migrations are **automatically applied** during Netlify deployments:

#### **How It Works:**
1. Migration files in `supabase/migrations/` are committed to git
2. Push to `main` branch triggers Netlify production build
3. Netlify build process:
   - Installs Supabase CLI via npx (no download/extraction issues)
   - Links to production project using `SUPABASE_PROJECT_REF`
   - Runs `supabase db push` to apply new migrations
   - Builds the Next.js app with `npm run build`
4. If migration fails → build fails → production stays on previous version ✅

#### **Required Netlify Environment Variables:**
These must be set in Netlify (**Site settings** → **Environment variables** → **Production** scope):
- `SUPABASE_ACCESS_TOKEN` - Your personal access token (starts with `sbp_`)
- `SUPABASE_DB_PASSWORD` - Production database password
- `SUPABASE_PROJECT_REF` - Production project ref: `bfbvcmfezdhdotmbgxsn`

#### **Important Notes:**
- ✅ **Always test migrations in dev first** before merging to main
- ✅ **Migrations are atomic** - failed migrations prevent bad deployments
- ✅ **Safe rollback** - redeploy previous version in Netlify dashboard
- ✅ **Uses npm-based CLI** - more stable than binary downloads
- ⚠️ **Breaking schema changes** - consider multi-phase migrations
- ⚠️ **Data migrations** - test thoroughly in dev, backup production first

#### **Dev Branch Behavior:**
The `dev` branch does **NOT** auto-run migrations on Netlify. You apply dev migrations manually:
```powershell
supabase link --project-ref kvorvygjgeelhybnstje
supabase db push
```

This gives you control to test migrations locally before committing to git.

---

### **Complete Database Change Workflow**

**Scenario: Add a new field to scoreboards table**

```powershell
# 1. Ensure you're on dev branch
git checkout dev
git pull origin dev

# 2. Create feature branch
git checkout -b feature/add-scoreboard-field

# 3. Create migration
supabase migration new add_scoreboard_field

# 4. Edit the migration file
# supabase/migrations/TIMESTAMP_add_scoreboard_field.sql
# Add your SQL changes

# 5. Link to dev project and apply
supabase link --project-ref $env:SUPABASE_PROJECT_REF_DEV
supabase db push

# 6. Test the changes in dev environment
npm run dev
# Visit: http://localhost:5000

# 7. Commit migration file
git add supabase/migrations/
git commit -m "feat: add new field to scoreboards table"
git push origin feature/add-scoreboard-field

# 8. Merge to dev and test on dev preview
git checkout dev
git merge feature/add-scoreboard-field
git push origin dev
# Test at: https://dev--myscoreboardmanager.netlify.app

# 9. Promote to main (migrations apply automatically via Netlify)
git checkout main
git merge dev
git push origin main
# Netlify automatically:
# - Applies migration to production database
# - Builds and deploys to: https://myscoreboardmanager.netlify.app
```

---

### **Supabase CLI Quick Reference**

```powershell
# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Check status
supabase status
supabase migration list

# Create migration
supabase migration new migration_name

# Apply migrations
supabase db push

# Generate TypeScript types from database
supabase gen types typescript --linked > src/types/database.types.ts

# Pull remote schema changes (if someone else made changes)
supabase db pull

# Diff local vs remote
supabase db diff

# Get database connection string
supabase db url
```

---

### **Troubleshooting Migrations**

#### **Migration Already Applied Remotely**
```powershell
# If migration exists remotely but not marked locally
supabase migration repair --status applied 20260110120000

# If you need to revert a remote migration
supabase migration repair --status reverted 20260110120000
```

#### **Sync Issues Between Local and Remote**
```powershell
# Pull remote migrations to local
supabase db pull

# Force push (careful - can overwrite remote!)
supabase db push --force
```

#### **View Database Directly**
```powershell
# Get connection string
supabase db url

# Connect using psql (if installed)
psql "$(supabase db url)"
```

---

### **Migration Squashing (Periodic Cleanup)**

When migrations accumulate (10+ files) or the schema is stable, squash them into a baseline:

#### **When to Squash**
- Schema is stable after multiple changes
- 10+ migration files cluttering the folder
- Starting fresh after manual database changes
- Major version release milestone

#### **Squashing Process**

```powershell
# 1. Ensure all migrations are applied to production
supabase link --project-ref $env:SUPABASE_PROJECT_REF_PROD
supabase migration list  # Verify all applied

# 2. Archive old migrations
mkdir docs/migrations-archive -Force
Move-Item supabase/migrations/*.sql docs/migrations-archive/

# 3. Clear remote migration history (run in Supabase SQL Editor)
# DELETE FROM supabase_migrations.schema_migrations;

# 4. Create new baseline
supabase migration new baseline

# 5. Document schema in baseline (as comments, SELECT 1; as no-op)
# See existing baseline for format

# 6. Commit and push
git add .
git commit -m "chore: squash migrations into baseline"
git push origin main
```

#### **File Locations**
| Location | Purpose |
|----------|---------|
| `supabase/migrations/` | Active migrations (run by `db push`) |
| `docs/migrations-archive/` | Historical reference only |

#### **Baseline Format**
```sql
-- No-op for existing databases
SELECT 1;

-- Schema documentation in comments
/*
CREATE TABLE example (...);
*/
```

---

### **Best Practices for Database Changes**

1. **Always test in dev first**
   - Apply migration to dev project
   - Test thoroughly on dev preview site
   - Only then apply to production

2. **Keep migrations small and focused**
   - One logical change per migration
   - Easier to debug and rollback

3. **Include rollback instructions**
   - Comment at top of migration with rollback SQL
   ```sql
   -- Rollback: DROP COLUMN IF EXISTS new_field;
   ALTER TABLE scoreboards ADD COLUMN new_field TEXT;
   ```

4. **Never edit applied migrations**
   - Once pushed, create a new migration to fix issues
   - Editing can cause sync problems

5. **Commit migrations with code changes**
   - Migration files should be in version control
   - Helps track database schema evolution

6. **Document breaking changes**
   - If migration changes data structure, update README
   - Notify team members before production deploy

7. **Monitor Netlify build logs**
   - Check migration output in deploy logs
   - Look for errors before app build starts

---

## Useful Git Commands

### **Checking Status**
```powershell
# See current branch and uncommitted changes
git status

# See commit history
git log --oneline

# See all branches
git branch -a

# See what changed
git diff
```

### **Undoing Changes**
```powershell
# Discard changes in working directory
git checkout -- <file>

# Unstage a file
git reset HEAD <file>

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes) - CAREFUL!
git reset --hard HEAD~1

# Revert a commit (creates new commit)
git revert <commit-hash>
```

### **Cleaning Up**
```powershell
# Delete local feature branch
git branch -d feature/branch-name

# Force delete (if not merged)
git branch -D feature/branch-name

# Delete remote branch
git push origin --delete feature/branch-name

# Clean up stale branches
git remote prune origin
```

### **Stashing Work**
```powershell
# Save current work temporarily
git stash

# List stashes
git stash list

# Apply most recent stash
git stash pop

# Apply specific stash
git stash apply stash@{0}
```

---

## GitHub Pull Requests

### **Creating a PR**
1. Push your feature branch to GitHub
2. Go to GitHub repository
3. Click "Compare & pull request"
4. Set base branch to `dev` (not `main`)
5. Add description of changes
6. Request review if needed
7. Netlify will automatically create a deploy preview

### **PR Checklist**
- [ ] Code builds without errors (`npm run build`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Tested locally
- [ ] Commit messages follow convention
- [ ] Updated documentation if needed
- [ ] Database migrations tested in dev

---

## Netlify Deploys

### **Automatic Deployments**
- **Main branch** → https://myscoreboardmanager.netlify.app (Production)
- **Dev branch** → https://dev--myscoreboardmanager.netlify.app (Staging)
- **Pull requests** → https://deploy-preview-[PR#]--myscoreboardmanager.netlify.app

### **Deploy Previews**
Every PR automatically gets a preview deploy:
```
deploy-preview-42--myscoreboardmanager.netlify.app
```
Check the Netlify bot comment on your PR for the URL.

---

## Emergency Procedures

### **Rollback Production**
```powershell
# Find last good commit
git log --oneline

# Reset main to that commit
git checkout main
git reset --hard <good-commit-hash>
git push origin main --force

# IMPORTANT: Update dev to match
git checkout dev
git reset --hard main
git push origin dev --force
```

### **Fix Broken Build**
```powershell
# Check build locally first
npm run build

# If successful locally but failing on Netlify:
# 1. Clear cache in Netlify dashboard
# 2. Trigger redeploy

# If still failing, check environment variables in Netlify:
# Site settings → Environment variables
```

---

## Project-Specific Notes

### **Before Pushing**
1. Test locally: `npm run dev`
2. Check for errors: `npm run lint`
3. Build check: `npm run build`
4. Type check: `npm run type-check`

### **Required Environment Variables**
Ensure these are set in Netlify for all environments:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

---

## Tips for GitHub Copilot

### **Context for Copilot**
When working on features, mention:
- "This is for the scoreboard manager app"
- "We use Next.js 14 with App Router"
- "We use Supabase for backend"
- "Follow our commit message convention (feat:, fix:, etc.)"

### **Common Patterns**
- Use `'use client'` for client components
- Use `safeLocalStorage` utility for localStorage operations
- Use `ErrorBoundary` component for error handling
- Follow TypeScript strict mode
- Use Tailwind CSS for styling

---

## Quick Reference

```powershell
# Daily workflow
git checkout dev && git pull origin dev
git checkout -b feature/my-feature
# ... make changes ...
git add . && git commit -m "feat: my feature"
git push origin feature/my-feature

# Test and promote
git checkout dev && git merge feature/my-feature && git push origin dev
# Test at dev URL, then:
git checkout main && git merge dev && git push origin main

# Cleanup
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

---

## Getting Help

- **Git documentation**: https://git-scm.com/docs
- **GitHub guides**: https://guides.github.com
- **Netlify docs**: https://docs.netlify.com
- **Supabase CLI docs**: https://supabase.com/docs/guides/cli
- **Project README**: See root README.md for project-specific info
