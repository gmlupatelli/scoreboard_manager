import { supabase } from '@/lib/supabase/client';

export interface ProfileUpdateData {
  full_name?: string;
  email?: string;
}

export const profileService = {
  /**
   * Get user profile by user ID
   */
  async getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data ?? null, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: 'Failed to fetch profile. Please try again.' 
      };
    }
  },

  /**
   * Update user profile (full name only - email handled separately)
   * Updates both user_profiles table and Supabase Auth user metadata
   */
  async updateProfile(userId: string, updates: ProfileUpdateData) {
    try {
      // Update Supabase Auth user metadata so it reflects in Supabase dashboard
      if (updates.full_name) {
        const { error: authError } = await supabase.auth.updateUser({
          data: { full_name: updates.full_name }
        });

        if (authError) {
          return { data: null, error: authError.message };
        }
      }

      // Also update user_profiles table
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          full_name: updates.full_name,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data ?? null, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: 'Failed to update profile. Please try again.' 
      };
    }
  },

  /**
   * Update user email (requires Supabase Auth API)
   * Note: This only initiates the email change - the actual email update 
   * happens in Supabase Auth after the user verifies the new address.
   * The user_profiles table is updated after verification in verify-email page.
   */
  async updateEmail(newEmail: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Don't update user_profiles here - wait until email is verified
      // The new email is stored in user.new_email until verified

      return { success: true, error: null };
    } catch (error) {
      return { 
        success: false, 
        error: 'Failed to update email. Please try again.' 
      };
    }
  },

  /**
   * Sync user_profiles email with verified auth email
   * Called after email change verification succeeds
   */
  async syncProfileEmail(userId: string, verifiedEmail: string) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          email: verifiedEmail,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { 
        success: false, 
        error: 'Failed to sync profile email.' 
      };
    }
  },

  /**
   * Ensure user profile exists after signup verification
   * Creates the profile if it doesn't exist
   */
  async ensureProfileExists(user: { id: string; email?: string; user_metadata?: { full_name?: string; role?: string } }) {
    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        return { success: true, error: null };
      }

      // Create the profile if it doesn't exist
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || null,
          role: user.user_metadata?.role || 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { 
        success: false, 
        error: 'Failed to create user profile.' 
      };
    }
  },

  /**
   * Resend email verification for pending email change
   */
  async resendEmailVerification(pendingEmail: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        email: pendingEmail
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { 
        success: false, 
        error: 'Failed to resend verification email. Please try again.' 
      };
    }
  },

  /**
   * Change user password
   */
  async changePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { 
        success: false, 
        error: 'Failed to change password. Please try again.' 
      };
    }
  },

  /**
   * Delete user account (complete deletion including Supabase Auth user)
   */
  async deleteAccount(_userId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to delete account' };
      }

      if (data.warning) {
        return { success: true, error: null, warning: data.warning };
      }

      return { success: true, error: null };
    } catch {
      return { 
        success: false, 
        error: 'Failed to delete account. Please try again.' 
      };
    }
  }
};