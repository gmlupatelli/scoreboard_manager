# JWT Signing Keys Migration Checklist

**Project**: Scoreboard Manager  
**Date**: January 10, 2026  
**Strategy**: Option A - Immediate migration with 24-hour monitoring period

---

## 🎯 Overview

Migrating from legacy JWT secrets and anon/service_role keys to modern JWT signing keys and Publishable/Secret API keys.

**Why?**
- ✅ More secure (separate signing keys instead of shared secret)
- ✅ Clearer separation between public and admin keys
- ✅ Better key rotation capabilities
- ✅ Future-proofing for Supabase platform updates

---

## 📋 Pre-Migration Checklist

- [ ] Both Supabase projects accessible (Dev: kvorvygjgeelhybnstje, Prod: bfbvcmfezdhdotmbgxsn)
- [ ] Local development environment working (`npm run dev`)
- [ ] Supabase CLI installed and working (`supabase --version`)
- [ ] Backup of current `.env.local` file saved
- [ ] Netlify dashboard access confirmed
- [ ] No active production deploys in progress

---

## 🔧 Phase 1: Development Project Setup (30 minutes)

### Step 1.1: Enable JWT Signing Keys (Dev)

1. Open https://app.supabase.com/project/kvorvygjgeelhybnstje/settings/api
2. Scroll to **"JWT Settings"** section
3. Find **"JWT Signing Keys"** toggle
4. Click **"Enable JWT Signing Keys"**
5. ⚠️ Note: Legacy JWT secret will remain active for compatibility
6. Copy the new **Signing Key ID** (save temporarily)

**Status**: ⬜ Not Started | ✅ Complete

---

### Step 1.2: Generate New API Keys (Dev)

1. Stay on the same API settings page
2. Scroll to **"Project API keys"** section
3. Look for the new **"Publishable key"** (anon) row
4. Click **"Reveal"** and copy the Publishable key
5. Save to secure note: `DEV_PUBLISHABLE_KEY=eyJ...`

6. Look for the new **"Secret key"** (service_role) row
7. Click **"Reveal"** and copy the Secret key
8. Save to secure note: `DEV_SECRET_KEY=eyJ...`

**Verification**:
- [ ] Dev Publishable key saved (starts with `eyJ`)
- [ ] Dev Secret key saved (starts with `eyJ`)
- [ ] Keys are different from each other

**Status**: ⬜ Not Started | ✅ Complete

---

### Step 1.3: Update Local Environment Variables

1. Open `.env.local` in your editor
2. Find `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (line ~16)
3. Replace the value with your new **DEV_PUBLISHABLE_KEY**
4. Find `SUPABASE_SECRET_KEY` (line ~21)
5. Replace the value with your new **DEV_SECRET_KEY**
6. Save the file

**Before**:
```dotenv
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...old_dev_anon_key...
SUPABASE_SECRET_KEY=eyJ...old_dev_service_role_key...
```

**After**:
```dotenv
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...new_dev_publishable_key...
SUPABASE_SECRET_KEY=eyJ...new_dev_secret_key...
```

**Status**: ⬜ Not Started | ✅ Complete

---

### Step 1.4: Test Local Development

1. Clear Next.js cache:
   ```powershell
   Remove-Item -Recurse -Force .next
   ```

2. Start development server:
   ```powershell
   npm run dev
   ```

3. Open http://localhost:5000

4. Test critical functionality:
   - [ ] Login page loads
   - [ ] Can log in with existing account
   - [ ] Dashboard loads with scoreboards
   - [ ] Can create a new scoreboard
   - [ ] Can view a scoreboard
   - [ ] Can add an entry to scoreboard
   - [ ] Real-time updates work (open in 2 tabs, add entry in one)
   - [ ] Can log out

5. Test admin functionality (if system admin):
   - [ ] Can access /system-admin
   - [ ] Can send invitation
   - [ ] Settings page loads

**Status**: ⬜ Not Started | ✅ Complete | ❌ Issues Found

**Issues Found**:
```
[Document any errors here]
```

---

### Step 1.5: Test Supabase CLI

1. Test CLI authentication:
   ```powershell
   supabase login
   ```

2. Link to dev project:
   ```powershell
   supabase link --project-ref kvorvygjgeelhybnstje
   ```

3. Check migration status:
   ```powershell
   supabase migration list
   ```

4. Create test migration:
   ```powershell
   supabase migration new test_jwt_migration
   ```

5. Add simple SQL to the created file:
   ```sql
   -- Test migration after JWT key migration
   -- This is a no-op migration for testing purposes
   SELECT 1;
   ```

6. Apply migration:
   ```powershell
   supabase db push
   ```

7. Verify in Supabase dashboard (SQL Editor):
   ```sql
   SELECT * FROM supabase_migrations.schema_migrations 
   ORDER BY version DESC LIMIT 5;
   ```

**Verification**:
- [ ] CLI login successful
- [ ] Project link successful
- [ ] Migration list shows existing migrations
- [ ] Test migration created successfully
- [ ] Test migration applied without errors
- [ ] Migration appears in dashboard

**Status**: ⬜ Not Started | ✅ Complete | ❌ Issues Found

---

## 🚀 Phase 2: Production Project Setup (30 minutes)

### Step 2.1: Enable JWT Signing Keys (Prod)

1. Open https://app.supabase.com/project/bfbvcmfezdhdotmbgxsn/settings/api
2. Scroll to **"JWT Settings"** section
3. Find **"JWT Signing Keys"** toggle
4. Click **"Enable JWT Signing Keys"**
5. ⚠️ Legacy JWT secret remains active
6. Copy the new **Signing Key ID** (save temporarily)

**Status**: ⬜ Not Started | ✅ Complete

---

### Step 2.2: Generate New API Keys (Prod)

1. Stay on the same API settings page
2. Scroll to **"Project API keys"** section
3. Look for the new **"Publishable key"** row
4. Click **"Reveal"** and copy the Publishable key
5. Save to secure note: `PROD_PUBLISHABLE_KEY=eyJ...`

6. Look for the new **"Secret key"** row
7. Click **"Reveal"** and copy the Secret key
8. Save to secure note: `PROD_SECRET_KEY=eyJ...`

**Verification**:
- [ ] Prod Publishable key saved (starts with `eyJ`)
- [ ] Prod Secret key saved (starts with `eyJ`)
- [ ] Keys are different from Dev keys
- [ ] Keys are different from each other

**Status**: ⬜ Not Started | ✅ Complete

---

### Step 2.3: Update Netlify Environment Variables

1. Open https://app.netlify.com → Your site → **Site settings**
2. Click **Environment variables** (left sidebar)
3. Find `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` variable
4. Click **Options** (⋯) → **Edit**
5. Update **Production** value with your new **PROD_PUBLISHABLE_KEY**
6. Keep other deploy contexts (dev, branch-deploys) unchanged for now
7. Click **Save**

8. Find `SUPABASE_SECRET_KEY` variable
9. Click **Options** (⋯) → **Edit**
10. Update **Production** value with your new **PROD_SECRET_KEY**
11. Keep other deploy contexts unchanged
12. Click **Save**

**Verification**:
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` updated for Production
- [ ] `SUPABASE_SECRET_KEY` updated for Production
- [ ] Other variables unchanged (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, etc.)
- [ ] Dev and branch-deploy contexts still use old keys (for rollback safety)

**Status**: ⬜ Not Started | ✅ Complete

---

### Step 2.4: Deploy to Production

1. Ensure you're on the main branch:
   ```powershell
   git checkout main
   git pull origin main
   ```

2. Merge dev branch (which has Netlify automation):
   ```powershell
   git merge dev
   ```

3. Push to trigger deployment:
   ```powershell
   git push origin main
   ```

4. Monitor Netlify deploy:
   - Open Netlify dashboard → **Deploys** tab
   - Watch build logs in real-time
   - Look for: "Supabase CLI linking..." and "Running migrations..."

**Expected Build Log Output**:
```
Supabase CLI linking to production...
✓ Linked to project bfbvcmfezdhdotmbgxsn
Running database migrations...
✓ All migrations applied successfully
Building Next.js application...
```

**Status**: ⬜ Not Started | ✅ Complete | ❌ Build Failed

**Build Log Notes**:
```
[Document build output or errors here]
```

---

### Step 2.5: Test Production Deployment

1. Wait for Netlify deploy to complete
2. Open https://myscoreboardmanager.netlify.app
3. Clear browser cache (Ctrl+Shift+R)

4. Test critical functionality:
   - [ ] Homepage loads
   - [ ] Login page loads
   - [ ] Can log in with existing account
   - [ ] Dashboard loads with scoreboards
   - [ ] Can view a scoreboard
   - [ ] Can add an entry to scoreboard
   - [ ] Real-time updates work
   - [ ] Can log out

5. Test from different device/browser:
   - [ ] Mobile browser test
   - [ ] Incognito/private browsing test

**Status**: ⬜ Not Started | ✅ Complete | ❌ Issues Found

**Issues Found**:
```
[Document any errors here]
```

---

## 📊 Phase 3: Monitoring Period (24 hours)

### Monitoring Tasks

**Immediately After Deploy**:
- [ ] Check Netlify Functions logs for errors
- [ ] Check browser console for auth errors
- [ ] Test invitation flow (if applicable)
- [ ] Monitor error reporting (if you have error tracking)

**After 6 Hours**:
- [ ] Check for any user reports of issues
- [ ] Verify real-time updates still working
- [ ] Test from fresh browser session

**After 24 Hours**:
- [ ] Final verification of all features
- [ ] Check database connection stability
- [ ] Review any accumulated error logs

**Rollback Plan (If Issues Occur)**:
1. Open Netlify → **Deploys** → Click previous successful deploy
2. Click **"Publish deploy"** to rollback
3. In Netlify environment variables, revert keys to old values
4. Document the issue for investigation

**Status**: ⬜ Not Started | 🔄 In Progress | ✅ Complete | ❌ Issues - Rolled Back

**Monitoring Notes**:
```
[Document any observations or issues during monitoring]
```

---

## 🗑️ Phase 4: Revoke Legacy Keys (After 24 hours)

### Step 4.1: Revoke Dev Legacy Keys

**⚠️ Only proceed if Phase 3 monitoring showed zero issues**

1. Open https://app.supabase.com/project/kvorvygjgeelhybnstje/settings/api
2. Scroll to **"Project API keys"** section
3. Find the **legacy "anon" key** row (different from Publishable)
4. Click **Options** (⋯) → **Revoke key**
5. Confirm revocation

6. Find the **legacy "service_role" key** row (different from Secret)
7. Click **Options** (⋯) → **Revoke key**
8. Confirm revocation

9. Scroll to **"JWT Settings"** section
10. Find **"Legacy JWT Secret"**
11. Click **"Disable Legacy JWT Secret"**
12. ⚠️ This action is reversible for 30 days
13. Confirm disable

**Verification**:
- [ ] Legacy anon key revoked
- [ ] Legacy service_role key revoked
- [ ] Legacy JWT secret disabled
- [ ] Local development still works
- [ ] Dev preview site still works (https://dev--myscoreboardmanager.netlify.app)

**Status**: ⬜ Not Started | ✅ Complete

**Revocation Date/Time**: _______________

---

### Step 4.2: Monitor Dev After Revocation (2 hours)

1. Test local development:
   ```powershell
   npm run dev
   ```
   - [ ] Login still works
   - [ ] Dashboard loads
   - [ ] Can perform CRUD operations

2. Check dev preview site:
   - [ ] https://dev--myscoreboardmanager.netlify.app still works
   - [ ] No console errors

**Status**: ⬜ Not Started | ✅ Complete | ❌ Issues Found

---

### Step 4.3: Revoke Prod Legacy Keys

**⚠️ Only proceed if Step 4.2 showed zero issues**

1. Open https://app.supabase.com/project/bfbvcmfezdhdotmbgxsn/settings/api
2. Scroll to **"Project API keys"** section
3. Revoke **legacy "anon" key**
4. Revoke **legacy "service_role" key**
5. Scroll to **"JWT Settings"**
6. **Disable Legacy JWT Secret**
7. Confirm all actions

**Verification**:
- [ ] Legacy anon key revoked
- [ ] Legacy service_role key revoked
- [ ] Legacy JWT secret disabled
- [ ] Production site still works (https://myscoreboardmanager.netlify.app)
- [ ] No error reports from users

**Status**: ⬜ Not Started | ✅ Complete

**Revocation Date/Time**: _______________

---

### Step 4.4: Final Production Test

1. Test from fresh browser (clear cookies):
   - [ ] Can register new account
   - [ ] Can log in
   - [ ] All features work
   - [ ] Real-time updates work
   - [ ] Can log out

2. Test migration automation (create and deploy a new migration):
   ```powershell
   # Create migration
   supabase migration new final_jwt_test
   
   # Add simple SQL
   # (Add a comment or small table)
   
   # Commit and deploy
   git add supabase/migrations/
   git commit -m "test: verify automated migrations after JWT migration"
   git push origin main
   ```

3. Verify migration applied in Netlify build logs
4. Check Supabase dashboard that migration is present

**Status**: ⬜ Not Started | ✅ Complete | ❌ Issues Found

---

## 📝 Phase 5: Documentation Updates

### Step 5.1: Update Repository Documentation

- [ ] Commit `.env.example` changes
- [ ] Update README.md with migration notes
- [ ] Update .github/GIT_WORKFLOW.md with new key terminology
- [ ] Add this checklist to docs/ folder for future reference

### Step 5.2: Clean Up

- [ ] Delete secure notes with temporary key storage
- [ ] Update password manager (if storing Supabase credentials)
- [ ] Archive old keys (save encrypted for 30 days as emergency backup)

**Status**: ⬜ Not Started | ✅ Complete

---

## 🎉 Migration Complete!

**Completion Checklist**:
- [ ] JWT Signing Keys enabled in both Dev and Prod
- [ ] New Publishable and Secret keys generated and deployed
- [ ] 24+ hours of stable operation confirmed
- [ ] Legacy keys revoked in both projects
- [ ] Documentation updated
- [ ] Migration automation still works
- [ ] All features tested and working

**Migration Completed**: _______________  
**Signed Off By**: _______________

---

## 🆘 Troubleshooting

### Issue: "Invalid JWT" errors after key change

**Solution**:
1. Users need to log out and log back in (clears old tokens)
2. Clear application localStorage: `localStorage.clear()`
3. Clear browser cookies for the domain

### Issue: Netlify build fails with "Supabase CLI auth error"

**Solution**:
1. Verify `SUPABASE_ACCESS_TOKEN` is still valid in Netlify
2. Check `SUPABASE_DB_PASSWORD` hasn't changed
3. Ensure `SUPABASE_PROJECT_REF_PROD` is correct
4. Try regenerating access token in Supabase dashboard

### Issue: Real-time subscriptions stop working

**Solution**:
1. Check if new Publishable key has realtime:* permissions
2. Verify RLS policies still allow authenticated users
3. Check browser console for subscription errors

### Issue: Need to rollback urgently

**Quick Rollback Steps**:
1. Netlify → Deploys → Previous deploy → "Publish deploy"
2. Netlify → Environment variables → Revert both keys to old values
3. Supabase dashboard → Re-enable legacy JWT secret (if disabled)
4. Old legacy keys are valid for 30 days after revocation

---

## 📚 Resources

- Supabase JWT Documentation: https://supabase.com/docs/guides/auth/jwts
- Supabase API Keys Documentation: https://supabase.com/docs/guides/api/api-keys
- Netlify Environment Variables: https://docs.netlify.com/environment-variables/overview/

---

**Notes**:
```
[Add any additional notes, observations, or lessons learned here]
```
