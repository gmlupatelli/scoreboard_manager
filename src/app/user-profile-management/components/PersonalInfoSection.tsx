'use client';

import { useState, useEffect } from 'react';
import { ClockIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

interface PersonalInfoSectionProps {
  profile: Profile | null;
  pendingEmail?: string | null;
  onUpdateProfile: (fullName: string) => Promise<boolean>;
  onUpdateEmail: (newEmail: string) => Promise<boolean>;
  onResendVerification?: () => Promise<boolean>;
}

export default function PersonalInfoSection({
  profile,
  pendingEmail,
  onUpdateProfile,
  onUpdateEmail,
  onResendVerification,
}: PersonalInfoSectionProps) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

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

  const handleResendVerification = async () => {
    if (!onResendVerification) return;

    setResending(true);
    setResendSuccess(false);

    const success = await onResendVerification();

    setResending(false);
    if (success) {
      setResendSuccess(true);
      // Reset success message after 5 seconds
      setTimeout(() => setResendSuccess(false), 5000);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg elevation-1 p-6">
      <h2 className="text-xl font-semibold text-text-primary mb-6">Personal Information</h2>

      <div className="space-y-6">
        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Display Name</label>
          {isEditingName ? (
            <div className="space-y-3">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && fullName.trim() && !savingName) {
                    e.preventDefault();
                    handleSaveName();
                  } else if (e.key === 'Escape') {
                    handleCancelName();
                  }
                }}
                className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your display name"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSaveName}
                  disabled={savingName || !fullName.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:bg-muted disabled:text-text-secondary disabled:cursor-not-allowed transition-smooth"
                  title="Save display name"
                >
                  {savingName ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancelName}
                  disabled={savingName}
                  className="px-4 py-2 bg-muted text-text-secondary rounded-lg hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-muted transition-smooth"
                  title="Cancel editing"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-text-primary">{profile?.full_name || 'Not set'}</span>
              <button
                onClick={() => setIsEditingName(true)}
                className="text-primary hover:opacity-80 font-medium transition-smooth"
                title="Edit display name"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && email.trim() && !savingEmail) {
                    e.preventDefault();
                    handleSaveEmail();
                  } else if (e.key === 'Escape') {
                    handleCancelEmail();
                  }
                }}
                className={`w-full px-4 py-2 border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent ${
                  emailError ? 'border-destructive' : 'border-border'
                }`}
                placeholder="Enter your email address"
                autoFocus
              />
              {emailError && <p className="text-sm text-destructive">{emailError}</p>}
              <p className="text-sm text-text-secondary">
                A verification email will be sent to your new address
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveEmail}
                  disabled={savingEmail || !email.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:bg-muted disabled:text-text-secondary disabled:cursor-not-allowed transition-smooth"
                  title="Save email address"
                >
                  {savingEmail ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancelEmail}
                  disabled={savingEmail}
                  className="px-4 py-2 bg-muted text-text-secondary rounded-lg hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-muted transition-smooth"
                  title="Cancel editing"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-text-primary">{profile?.email}</span>
                <button
                  onClick={() => setIsEditingEmail(true)}
                  className="text-primary hover:opacity-80 font-medium transition-smooth"
                >
                  Edit
                </button>
              </div>
              {pendingEmail && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <ClockIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Pending email change
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <EnvelopeIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm text-amber-700 dark:text-amber-300 truncate">
                          {pendingEmail}
                        </span>
                      </div>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Please check your inbox and click the verification link to confirm this
                        change.
                      </p>
                      {onResendVerification && (
                        <div className="mt-2">
                          {resendSuccess ? (
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                              Verification email sent successfully!
                            </p>
                          ) : (
                            <button
                              onClick={handleResendVerification}
                              disabled={resending}
                              className="text-xs font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 underline underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
                              title="Resend verification email"
                            >
                              {resending ? 'Sending...' : 'Resend verification email'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Account Created */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Account Created
          </label>
          <span className="text-text-primary">
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}
