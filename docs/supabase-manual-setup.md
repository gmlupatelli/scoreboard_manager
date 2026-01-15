# Supabase Manual Setup

This document covers the setup steps that **cannot be included in migrations** and must be configured manually when deploying a new Supabase project.

> **Note**: The baseline migration (`supabase/migrations/20260115000000_baseline.sql`) contains everything else needed to replicate the database schema.

---

## 1. Auth Trigger: Sync Users to Profiles

Supabase doesn't allow creating triggers on `auth.users` via migrations. You must create this trigger manually in the Supabase Dashboard.

### Steps:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run the following SQL:

```sql
-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user'
  );
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user IS 'Creates a user_profile record when a new user signs up. Uses fixed search_path for security.';
```

### What it does:

- When a new user signs up via Supabase Auth, this trigger automatically creates a corresponding `user_profiles` row
- Extracts `full_name` from user metadata, falling back to the email username
- Sets default role to `'user'`

---

## 2. Initial System Settings

The `system_settings` table requires exactly one row with `id = 'default'`. Insert this after running migrations:

### Steps:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run:

```sql
INSERT INTO public.system_settings (id, allow_public_registration, require_email_verification)
VALUES ('default', true, true)
ON CONFLICT (id) DO NOTHING;
```

### Configuration Options:

| Setting                      | Default | Description                                        |
| ---------------------------- | ------- | -------------------------------------------------- |
| `allow_public_registration`  | `true`  | If false, only invited users can register          |
| `require_email_verification` | `true`  | If true, users must verify email before full access |

---

## 3. First Admin User

After your first user signs up, promote them to system admin:

### Steps:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run:

```sql
UPDATE public.user_profiles 
SET role = 'system_admin' 
WHERE email = 'your-admin-email@example.com';
```

### Alternative: Set admin during trigger

If you want the first user to automatically become admin, modify the trigger (Step 1) to check if any users exist:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
  new_role user_role;
BEGIN
  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM public.user_profiles;
  
  -- First user becomes admin, others are regular users
  IF user_count = 0 THEN
    new_role := 'system_admin';
  ELSE
    new_role := 'user';
  END IF;
  
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    new_role
  );
  RETURN NEW;
END;
$$;
```

---

## 4. Email Templates (Optional)

Supabase sends transactional emails for authentication. You can customize these in:

**Supabase Dashboard** → **Authentication** → **Email Templates**

See [supabase-email-templates.md](supabase-email-templates.md) for custom template examples used in this project.

### Templates to Configure:

- **Confirm signup** - Redirect URL: `https://your-domain.com/auth/callback?type=signup`
- **Magic link** - If using passwordless login
- **Change email** - Redirect URL: `https://your-domain.com/auth/callback?type=email_change`
- **Reset password** - Uses Supabase's built-in flow

---

## 5. Authentication Settings

Configure auth settings in **Supabase Dashboard** → **Authentication** → **Providers**:

### Email Provider Settings:

| Setting                    | Recommended Value |
| -------------------------- | ----------------- |
| Enable Email Signup        | ✅ Enabled         |
| Confirm email              | ✅ Enabled         |
| Secure email change        | ✅ Enabled         |
| Double confirm email change| ❌ Disabled        |
| Enable password login      | ✅ Enabled         |

### Site URL:

Set your production URL in **Authentication** → **URL Configuration**:

- **Site URL**: `https://your-domain.com`
- **Redirect URLs**: Add all valid redirect URLs (e.g., `http://localhost:3000/**` for development)

---

## 6. Storage Configuration (Kiosk Slides)

The baseline migration creates the `kiosk-slides` storage bucket, but verify these settings:

**Supabase Dashboard** → **Storage** → **kiosk-slides**:

| Setting            | Value                                       |
| ------------------ | ------------------------------------------- |
| Public bucket      | ❌ No (uses signed URLs)                    |
| File size limit    | 10 MB                                       |
| Allowed MIME types | `image/png`, `image/jpeg`, `image/webp`     |

---

## 7. Realtime Configuration

Realtime is enabled via migration, but ensure it's active:

**Supabase Dashboard** → **Database** → **Replication**:

Verify these tables have Realtime enabled:
- ✅ `scoreboards`
- ✅ `scoreboard_entries`

---

## Summary Checklist

After running the baseline migration, complete these manual steps:

- [ ] Create auth trigger for `handle_new_user()` (Step 1)
- [ ] Insert initial system settings row (Step 2)
- [ ] Promote first user to system_admin (Step 3)
- [ ] Configure email templates (Step 4 - optional)
- [ ] Verify authentication settings (Step 5)
- [ ] Verify storage bucket settings (Step 6)
- [ ] Verify Realtime is enabled (Step 7)

---

## Troubleshooting

### User signs up but no profile created

The auth trigger wasn't created. Run Step 1.

### "Registration is currently disabled" error

System settings row doesn't exist. Run Step 2.

### Admin features not showing

User role wasn't updated. Run Step 3 with the correct email.

### Kiosk images not loading

Storage policies may not have applied. Check RLS policies on `storage.objects` table.
