'use client';

import { useState } from 'react';

interface SecuritySectionProps {
  onChangePassword: (newPassword: string) => Promise<boolean>;
}

export default function SecuritySection({ onChangePassword }: SecuritySectionProps) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    label: string;
    color: string;
  }>({
    score: 0,
    label: '',
    color: 'bg-gray-300'
  });

  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;

    const strengthMap = [
      { score: 0, label: '', color: 'bg-gray-300' },
      { score: 1, label: 'Weak', color: 'bg-red-500' },
      { score: 2, label: 'Fair', color: 'bg-orange-500' },
      { score: 3, label: 'Good', color: 'bg-yellow-500' },
      { score: 4, label: 'Strong', color: 'bg-green-500' },
      { score: 5, label: 'Very Strong', color: 'bg-green-600' }
    ];

    return strengthMap[score];
  };

  const validatePassword = (): boolean => {
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])/.test(newPassword)) {
      setPasswordError('Password must contain both uppercase and lowercase letters');
      return false;
    }

    if (!/(?=.*\d)/.test(newPassword)) {
      setPasswordError('Password must contain at least one number');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    setPasswordError('');
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const handleSavePassword = async () => {
    if (!validatePassword()) {
      return;
    }

    setSaving(true);
    const success = await onChangePassword(newPassword);
    setSaving(false);

    if (success) {
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStrength({ score: 0, label: '', color: 'bg-gray-300' });
      setShowPasswordForm(false);
    }
  };

  const handleCancel = () => {
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordStrength({ score: 0, label: '', color: 'bg-gray-300' });
    setShowPasswordForm(false);
  };

  return (
    <div className="bg-card border border-border rounded-lg elevation-1 p-6">
      <h2 className="text-xl font-semibold text-text-primary mb-6">Security Settings</h2>
      
      <div className="space-y-6">
        {/* Password Section */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Password
          </label>
          
          {!showPasswordForm ? (
            <div className="flex items-center justify-between">
              <span className="text-text-primary">••••••••</span>
              <button
                onClick={() => setShowPasswordForm(true)}
                className="text-primary hover:opacity-80 font-medium transition-smooth"
              >
                Change Password
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* New Password */}
              <div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent ${
                    passwordError ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="New password"
                />
                
                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-text-secondary min-w-24">
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className={`w-full px-4 py-2 border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent ${
                    passwordError ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="Confirm new password"
                />
              </div>

              {/* Error Message */}
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}

              {/* Password Requirements */}
              <div className="bg-surface border border-border rounded-lg p-4">
                <p className="text-sm font-medium text-text-primary mb-2">
                  Password Requirements:
                </p>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li className="flex items-center gap-2">
                    <span className={newPassword.length >= 8 ? 'text-success' : ''}>
                      {newPassword.length >= 8 ? '✓' : '○'}
                    </span>
                    At least 8 characters
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={/(?=.*[a-z])(?=.*[A-Z])/.test(newPassword) ? 'text-success' : ''}>
                      {/(?=.*[a-z])(?=.*[A-Z])/.test(newPassword) ? '✓' : '○'}
                    </span>
                    Uppercase and lowercase letters
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={/\d/.test(newPassword) ? 'text-success' : ''}>
                      {/\d/.test(newPassword) ? '✓' : '○'}
                    </span>
                    At least one number
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSavePassword}
                  disabled={saving || !newPassword || !confirmPassword}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:bg-muted disabled:text-text-secondary disabled:cursor-not-allowed transition-smooth"
                >
                  {saving ? 'Saving...' : 'Update Password'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-4 py-2 bg-muted text-text-secondary rounded-lg hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}