'use client';

import { useState, useEffect } from 'react';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

interface PersonalInfoSectionProps {
  profile: Profile | null;
  onUpdateProfile: (fullName: string) => Promise<boolean>;
  onUpdateEmail: (newEmail: string) => Promise<boolean>;
}

export default function PersonalInfoSection({
  profile,
  onUpdateProfile,
  onUpdateEmail
}: PersonalInfoSectionProps) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Update local state when profile prop changes
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setEmail(profile.email ?? '');
    }
  }, [profile]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSaveName = async () => {
    if (!fullName.trim()) {
      return;
    }

    setSavingName(true);
    const success = await onUpdateProfile(fullName.trim());
    setSavingName(false);

    if (success) {
      setIsEditingName(false);
    }
  };

  const handleSaveEmail = async () => {
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (email === profile?.email) {
      setIsEditingEmail(false);
      return;
    }

    setSavingEmail(true);
    const success = await onUpdateEmail(email.trim());
    setSavingEmail(false);

    if (success) {
      setIsEditingEmail(false);
    }
  };

  const handleCancelName = () => {
    setFullName(profile?.full_name ?? '');
    setIsEditingName(false);
  };

  const handleCancelEmail = () => {
    setEmail(profile?.email ?? '');
    setEmailError('');
    setIsEditingEmail(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
      
      <div className="space-y-6">
        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Name
          </label>
          {isEditingName ? (
            <div className="space-y-3">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your display name"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSaveName}
                  disabled={savingName || !fullName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {savingName ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancelName}
                  disabled={savingName}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-gray-900">
                {profile?.full_name || 'Not set'}
              </span>
              <button
                onClick={() => setIsEditingName(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          {isEditingEmail ? (
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  emailError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email address"
              />
              {emailError && (
                <p className="text-sm text-red-600">{emailError}</p>
              )}
              <p className="text-sm text-gray-600">
                A verification email will be sent to your new address
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveEmail}
                  disabled={savingEmail || !email.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {savingEmail ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancelEmail}
                  disabled={savingEmail}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-gray-900">{profile?.email}</span>
              <button
                onClick={() => setIsEditingEmail(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Account Created */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Created
          </label>
          <span className="text-gray-900">
            {profile?.created_at 
              ? new Date(profile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}