-- Location: supabase/migrations/20251129220000_system_settings_and_invitations.sql
-- Feature: System settings and user invitation system
-- Dependencies: 20251128213008_user_auth_and_scoreboard_ownership.sql

-- ============================================
-- 1. TYPES
-- ============================================

CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- ============================================
-- 2. TABLES
-- ============================================

-- System settings table for app-wide configuration
CREATE TABLE public.system_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    allow_public_registration BOOLEAN DEFAULT true NOT NULL,
    require_email_verification BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Invitations table to track user invites
CREATE TABLE public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    invitee_email TEXT NOT NULL,
    status public.invitation_status DEFAULT 'pending'::public.invitation_status NOT NULL,
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days') NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================
-- 3. INDEXES
-- ============================================

CREATE INDEX idx_invitations_inviter_id ON public.invitations(inviter_id);
CREATE INDEX idx_invitations_invitee_email ON public.invitations(invitee_email);
CREATE INDEX idx_invitations_status ON public.invitations(status);
CREATE INDEX idx_invitations_expires_at ON public.invitations(expires_at);

-- ============================================
-- 4. FUNCTIONS
-- ============================================

-- Function to check if public registration is allowed
CREATE OR REPLACE FUNCTION public.is_public_registration_allowed()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
SELECT COALESCE(
    (SELECT allow_public_registration FROM public.system_settings WHERE id = 'default'),
    true
)
$$;

-- Function to check if email has valid pending invitation
CREATE OR REPLACE FUNCTION public.has_valid_invitation(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.invitations
    WHERE invitee_email = LOWER(check_email)
    AND status = 'pending'::public.invitation_status
    AND expires_at > CURRENT_TIMESTAMP
)
$$;

-- Function to mark invitation as accepted
CREATE OR REPLACE FUNCTION public.accept_invitation(user_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.invitations
    SET 
        status = 'accepted'::public.invitation_status,
        accepted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE invitee_email = LOWER(user_email)
    AND status = 'pending'::public.invitation_status;
END;
$$;

-- ============================================
-- 5. ENABLE RLS
-- ============================================

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- System Settings Policies
-- Anyone can read settings (needed for registration check)
CREATE POLICY "anyone_can_read_settings"
ON public.system_settings
FOR SELECT
TO public
USING (true);

-- Only system admins can update settings
CREATE POLICY "system_admin_update_settings"
ON public.system_settings
FOR UPDATE
TO authenticated
USING (public.is_system_admin())
WITH CHECK (public.is_system_admin());

-- Only system admins can insert settings
CREATE POLICY "system_admin_insert_settings"
ON public.system_settings
FOR INSERT
TO authenticated
WITH CHECK (public.is_system_admin());

-- Invitations Policies
-- Users can view their own sent invitations
CREATE POLICY "users_view_own_invitations"
ON public.invitations
FOR SELECT
TO authenticated
USING (inviter_id = auth.uid() OR public.is_system_admin());

-- Users can create invitations
CREATE POLICY "authenticated_users_create_invitations"
ON public.invitations
FOR INSERT
TO authenticated
WITH CHECK (inviter_id = auth.uid());

-- Users can cancel their own pending invitations
CREATE POLICY "users_update_own_invitations"
ON public.invitations
FOR UPDATE
TO authenticated
USING (inviter_id = auth.uid() OR public.is_system_admin())
WITH CHECK (inviter_id = auth.uid() OR public.is_system_admin());

-- System admins can delete invitations
CREATE POLICY "system_admin_delete_invitations"
ON public.invitations
FOR DELETE
TO authenticated
USING (public.is_system_admin());

-- Allow checking invitation validity for registration (anonymous)
CREATE POLICY "anyone_check_invitation_validity"
ON public.invitations
FOR SELECT
TO public
USING (status = 'pending'::public.invitation_status AND expires_at > CURRENT_TIMESTAMP);

-- ============================================
-- 7. TRIGGERS
-- ============================================

-- Trigger for system_settings updated_at
CREATE TRIGGER handle_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for invitations updated_at
CREATE TRIGGER handle_invitations_updated_at
    BEFORE UPDATE ON public.invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 8. DEFAULT DATA
-- ============================================

-- Insert default system settings
INSERT INTO public.system_settings (id, allow_public_registration, require_email_verification)
VALUES ('default', true, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 9. COMMENTS
-- ============================================

COMMENT ON TABLE public.system_settings IS 'App-wide configuration settings, managed by system admins';
COMMENT ON TABLE public.invitations IS 'User invitations for invite-only registration';
COMMENT ON COLUMN public.system_settings.allow_public_registration IS 'When false, only invited users can register';
COMMENT ON COLUMN public.invitations.status IS 'pending = awaiting acceptance, accepted = user registered, expired = past expiry date, cancelled = revoked by inviter';
