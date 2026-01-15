-- ============================================================================
-- FIX KIOSK SLIDES RLS POLICY
-- Date: January 15, 2026
-- Description: Update kiosk_slides RLS to use SECURITY DEFINER helper functions
--              to ensure proper access when querying via authenticated client
-- ============================================================================

-- Drop the existing policy that uses inline EXISTS
DROP POLICY IF EXISTS "Users can manage slides for their kiosk configs" ON kiosk_slides;

-- Recreate using the SECURITY DEFINER helper function
-- This ensures RLS evaluation doesn't get blocked by nested RLS on kiosk_configs
CREATE POLICY "Users can manage slides for their kiosk configs" ON kiosk_slides
  FOR ALL
  TO authenticated
  USING (owns_kiosk_config(kiosk_config_id))
  WITH CHECK (owns_kiosk_config(kiosk_config_id));

-- Also fix the anon policy to use the helper function
DROP POLICY IF EXISTS "Anon can view slides for enabled kiosk configs" ON kiosk_slides;

CREATE POLICY "Anon can view slides for enabled kiosk configs" ON kiosk_slides
  FOR SELECT
  TO anon
  USING (can_view_kiosk(kiosk_config_id));

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON POLICY "Users can manage slides for their kiosk configs" ON kiosk_slides IS 
  'Authenticated users can manage (CRUD) slides for kiosk configs they own via scoreboard ownership. Uses SECURITY DEFINER function to bypass nested RLS.';

COMMENT ON POLICY "Anon can view slides for enabled kiosk configs" ON kiosk_slides IS 
  'Anonymous users can view slides for enabled kiosk configs. Uses SECURITY DEFINER function to bypass nested RLS.';
