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
        })
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
   */
  async updateEmail(newEmail: string) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Also update email in user_profiles table
      if (data?.user?.id) {
        await supabase
          .from('user_profiles')
          .update({ email: newEmail })
          .eq('id', data.user.id);
      }

      return { success: true, error: null };
    } catch (error) {
      return { 
        success: false, 
        error: 'Failed to update email. Please try again.' 
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
   * Delete user account (complete deletion)
   */
  async deleteAccount(userId: string) {
    try {
      // First, call the database function to clean up related data
      const { error: dbError } = await supabase.rpc('delete_user_account');

      if (dbError) {
        return { success: false, error: dbError.message };
      }

      // Then delete the auth user (this will cascade to profile due to FK)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        // If auth deletion fails, but DB cleanup succeeded, still sign out
        await supabase.auth.signOut();
        return { 
          success: true, 
          error: 'Account data deleted. Please contact support if needed.' 
        };
      }

      return { success: true, error: null };
    } catch (error) {
      return { 
        success: false, 
        error: 'Failed to delete account. Please try again.' 
      };
    }
  }
};