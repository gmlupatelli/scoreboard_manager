-- Migration: Admin Subscription Management
-- Adds appreciation tier, is_gifted and gifted_expires_at columns, and admin_audit_log table

-- Add 'appreciation' to the appreciation_tier enum
ALTER TYPE appreciation_tier ADD VALUE IF NOT EXISTS 'appreciation';

-- Add is_gifted column to subscriptions table (for admin-gifted tiers)
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS is_gifted BOOLEAN NOT NULL DEFAULT false;

-- Add gifted_expires_at column to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS gifted_expires_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN subscriptions.gifted_expires_at IS 'Optional expiration date for admin-gifted appreciation tiers';

-- Create admin_audit_log table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target_user_id ON admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);

-- Enable RLS on admin_audit_log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: System admins can view all audit logs
CREATE POLICY "System admins can view audit logs"
  ON admin_audit_log
  FOR SELECT
  TO authenticated
  USING (is_system_admin());

-- RLS Policy: System admins can insert audit logs
CREATE POLICY "System admins can insert audit logs"
  ON admin_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (is_system_admin() AND admin_id = auth.uid());

-- RLS Policy: Service role can manage all audit logs (for API routes)
CREATE POLICY "Service role can manage audit logs"
  ON admin_audit_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment for table documentation
COMMENT ON TABLE admin_audit_log IS 'Tracks admin actions for accountability (subscription management, gifting, etc.)';
