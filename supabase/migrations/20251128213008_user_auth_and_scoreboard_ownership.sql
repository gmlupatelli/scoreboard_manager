-- Location: supabase/migrations/20251128213008_user_auth_and_scoreboard_ownership.sql
-- Schema Analysis: Empty database - Fresh project
-- Integration Type: Complete authentication and authorization system
-- Dependencies: None (initial migration)

-- ============================================
-- 1. TYPES
-- ============================================

CREATE TYPE public.user_role AS ENUM ('system_admin', 'user');
CREATE TYPE public.scoreboard_visibility AS ENUM ('public', 'private');

-- ============================================
-- 2. CORE TABLES
-- ============================================

-- User profiles table (intermediary for public schema)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role public.user_role DEFAULT 'user'::public.user_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Scoreboards table with ownership and privacy
CREATE TABLE public.scoreboards (
    id TEXT PRIMARY KEY,
    owner_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    sort_order TEXT DEFAULT 'asc'::TEXT NOT NULL CHECK (sort_order IN ('asc', 'desc')),
    visibility public.scoreboard_visibility DEFAULT 'public'::public.scoreboard_visibility NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Scoreboard entries table
CREATE TABLE public.scoreboard_entries (
    id TEXT PRIMARY KEY,
    scoreboard_id TEXT REFERENCES public.scoreboards(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    score NUMERIC NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================
-- 3. INDEXES
-- ============================================

CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_scoreboards_owner_id ON public.scoreboards(owner_id);
CREATE INDEX idx_scoreboards_visibility ON public.scoreboards(visibility);
CREATE INDEX idx_scoreboards_created_at ON public.scoreboards(created_at DESC);
CREATE INDEX idx_scoreboard_entries_scoreboard_id ON public.scoreboard_entries(scoreboard_id);
CREATE INDEX idx_scoreboard_entries_score ON public.scoreboard_entries(score);

-- ============================================
-- 4. FUNCTIONS (MUST BE BEFORE RLS POLICIES)
-- ============================================

-- Function to check if user is system admin (uses auth.users metadata)
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() 
    AND up.role = 'system_admin'::public.user_role
)
$$;

-- Function to check if user owns a scoreboard
CREATE OR REPLACE FUNCTION public.owns_scoreboard(scoreboard_uuid TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.scoreboards s
    WHERE s.id = scoreboard_uuid 
    AND s.owner_id = auth.uid()
)
$$;

-- Function to check if scoreboard is accessible (public or owned)
CREATE OR REPLACE FUNCTION public.can_view_scoreboard(scoreboard_uuid TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.scoreboards s
    WHERE s.id = scoreboard_uuid 
    AND (
        s.visibility = 'public'::public.scoreboard_visibility 
        OR s.owner_id = auth.uid()
        OR public.is_system_admin()
    )
)
$$;

-- Trigger function for user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id, 
        email, 
        full_name, 
        role
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'user'::public.user_role)
    );
    RETURN NEW;
END;
$$;

-- Trigger function for updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- ============================================
-- 5. ENABLE RLS
-- ============================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoreboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoreboard_entries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- User Profiles Policies (Pattern 1: Core User Table)
CREATE POLICY "users_view_own_profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.is_system_admin());

CREATE POLICY "users_update_own_profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "system_admin_full_access_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (public.is_system_admin())
WITH CHECK (public.is_system_admin());

-- Scoreboards Policies
CREATE POLICY "users_view_accessible_scoreboards"
ON public.scoreboards
FOR SELECT
TO authenticated
USING (
    visibility = 'public'::public.scoreboard_visibility 
    OR owner_id = auth.uid() 
    OR public.is_system_admin()
);

CREATE POLICY "public_view_public_scoreboards"
ON public.scoreboards
FOR SELECT
TO public
USING (visibility = 'public'::public.scoreboard_visibility);

CREATE POLICY "users_create_own_scoreboards"
ON public.scoreboards
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "users_update_own_scoreboards"
ON public.scoreboards
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid() OR public.is_system_admin())
WITH CHECK (owner_id = auth.uid() OR public.is_system_admin());

CREATE POLICY "users_delete_own_scoreboards"
ON public.scoreboards
FOR DELETE
TO authenticated
USING (owner_id = auth.uid() OR public.is_system_admin());

-- Scoreboard Entries Policies
CREATE POLICY "users_view_accessible_entries"
ON public.scoreboard_entries
FOR SELECT
TO authenticated
USING (public.can_view_scoreboard(scoreboard_id));

CREATE POLICY "public_view_public_entries"
ON public.scoreboard_entries
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM public.scoreboards s
        WHERE s.id = scoreboard_id 
        AND s.visibility = 'public'::public.scoreboard_visibility
    )
);

CREATE POLICY "users_manage_own_scoreboard_entries"
ON public.scoreboard_entries
FOR ALL
TO authenticated
USING (public.owns_scoreboard(scoreboard_id) OR public.is_system_admin())
WITH CHECK (public.owns_scoreboard(scoreboard_id) OR public.is_system_admin());

-- ============================================
-- 7. TRIGGERS
-- ============================================

-- Trigger for automatic user profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at timestamps
CREATE TRIGGER handle_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_scoreboards_updated_at
    BEFORE UPDATE ON public.scoreboards
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_scoreboard_entries_updated_at
    BEFORE UPDATE ON public.scoreboard_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 8. MOCK DATA
-- ============================================

DO $$
DECLARE
    system_admin_id UUID := gen_random_uuid();
    user1_id UUID := gen_random_uuid();
    user2_id UUID := gen_random_uuid();
    scoreboard1_id TEXT := 'scoreboard_' || EXTRACT(EPOCH FROM NOW())::TEXT;
    scoreboard2_id TEXT := 'scoreboard_' || (EXTRACT(EPOCH FROM NOW()) + 1)::TEXT;
    scoreboard3_id TEXT := 'scoreboard_' || (EXTRACT(EPOCH FROM NOW()) + 2)::TEXT;
BEGIN
    -- Create auth users with all required fields
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (
            system_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'admin@scoreboard.com', crypt('admin123', gen_salt('bf', 10)), now(), now(), now(),
            '{"full_name": "System Administrator", "role": "system_admin"}'::jsonb,
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
        ),
        (
            user1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'john@example.com', crypt('user123', gen_salt('bf', 10)), now(), now(), now(),
            '{"full_name": "John Smith", "role": "user"}'::jsonb,
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
        ),
        (
            user2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'jane@example.com', crypt('user123', gen_salt('bf', 10)), now(), now(), now(),
            '{"full_name": "Jane Doe", "role": "user"}'::jsonb,
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
        );

    -- Note: user_profiles will be automatically created by trigger

    -- Wait a moment for trigger to complete (in real scenario, this happens automatically)
    PERFORM pg_sleep(0.1);

    -- Create scoreboards with ownership
    INSERT INTO public.scoreboards (id, owner_id, title, subtitle, sort_order, visibility)
    VALUES
        (scoreboard1_id, user1_id, 'Q4 Sales Performance', 'Top performing sales representatives', 'desc', 'public'::public.scoreboard_visibility),
        (scoreboard2_id, user1_id, 'Employee Ratings', 'Internal performance metrics', 'desc', 'private'::public.scoreboard_visibility),
        (scoreboard3_id, user2_id, 'Customer Satisfaction', 'Customer feedback scores', 'desc', 'public'::public.scoreboard_visibility);

    -- Create scoreboard entries
    INSERT INTO public.scoreboard_entries (id, scoreboard_id, name, score, details)
    VALUES
        ('entry_' || gen_random_uuid()::TEXT, scoreboard1_id, 'Sarah Johnson', 98500, 'Exceeded quarterly target by 35%'),
        ('entry_' || gen_random_uuid()::TEXT, scoreboard1_id, 'Michael Chen', 87200, 'Closed 15 enterprise deals'),
        ('entry_' || gen_random_uuid()::TEXT, scoreboard1_id, 'Emily Rodriguez', 76800, 'Strong performance in new accounts'),
        ('entry_' || gen_random_uuid()::TEXT, scoreboard2_id, 'Team Lead A', 95, 'Excellent leadership skills'),
        ('entry_' || gen_random_uuid()::TEXT, scoreboard2_id, 'Team Lead B', 88, 'Strong technical expertise'),
        ('entry_' || gen_random_uuid()::TEXT, scoreboard3_id, 'Product Quality', 92, 'Customer satisfaction rating'),
        ('entry_' || gen_random_uuid()::TEXT, scoreboard3_id, 'Support Response', 89, 'Average response time rating');
END $$;

-- ============================================
-- 9. COMMENTS
-- ============================================

COMMENT ON TABLE public.user_profiles IS 'User profiles with role-based access control';
COMMENT ON TABLE public.scoreboards IS 'Scoreboards with ownership and privacy controls';
COMMENT ON TABLE public.scoreboard_entries IS 'Individual entries for scoreboards';
COMMENT ON COLUMN public.scoreboards.visibility IS 'Public scoreboards appear on landing page, private ones are accessible only via direct link';
COMMENT ON COLUMN public.user_profiles.role IS 'system_admin has full access to all scoreboards, user can only manage their own';