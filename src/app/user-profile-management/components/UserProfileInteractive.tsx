'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { profileService } from '@/services/profileService';
import PersonalInfoSection from './PersonalInfoSection';
import SecuritySection from './SecuritySection';
import DangerZoneSection from './DangerZoneSection';
import Toast from './Toast';
import Icon from '@/components/ui/AppIcon';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export default function UserProfileInteractive() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    const { data, error } = await profileService.getProfile(user.id);
    
    if (error) {
      showToast(error, 'error');
    } else if (data) {
      setProfile(data);
    }
    
    setLoading(false);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
  };

  const handleUpdateProfile = async (fullName: string) => {
    if (!user?.id) return false;

    const { data, error } = await profileService.updateProfile(user.id, {
      full_name: fullName
    });

    if (error) {
      showToast(error, 'error');
      return false;
    }

    if (data) {
      setProfile(data);
      showToast('Profile updated successfully', 'success');
      return true;
    }

    return false;
  };

  const handleUpdateEmail = async (newEmail: string) => {
    const { success, error } = await profileService.updateEmail(newEmail);

    if (error) {
      showToast(error, 'error');
      return false;
    }

    if (success) {
      showToast('Verification email sent to new address', 'success');
      return true;
    }

    return false;
  };

  const handleChangePassword = async (newPassword: string) => {
    const { success, error } = await profileService.changePassword(newPassword);

    if (error) {
      showToast(error, 'error');
      return false;
    }

    if (success) {
      showToast('Password changed successfully', 'success');
      return true;
    }

    return false;
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return false;

    const { success, error } = await profileService.deleteAccount(user.id);

    if (error) {
      showToast(error, 'error');
      return false;
    }

    if (success) {
      await signOut();
      router.push('/account-deleted');
      return true;
    }

    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Profile Settings</h1>
            <p className="text-text-secondary">Manage your account settings and preferences</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150"
            >
              <Icon name="ArrowLeftIcon" size={18} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>

        {/* Personal Information */}
        <PersonalInfoSection
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onUpdateEmail={handleUpdateEmail}
        />

        {/* Security Settings */}
        <SecuritySection onChangePassword={handleChangePassword} />

        {/* Danger Zone */}
        <DangerZoneSection onDeleteAccount={handleDeleteAccount} />
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}