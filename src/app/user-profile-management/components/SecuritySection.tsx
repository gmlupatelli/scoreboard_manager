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
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
      
      <div className="space-y-6">
        {/* Password Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          
          {!showPasswordForm ? (
            <div className="flex items-center justify-between">
              <span className="text-gray-900">••••••••</span>
              <button
                onClick={() => setShowPasswordForm(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    passwordError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="New password"
                />
                
                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 min-w-24">
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    passwordError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm new password"
                />
              </div>

              {/* Error Message */}
              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}

              {/* Password Requirements */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Password Requirements:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className={newPassword.length >= 8 ? 'text-green-600' : ''}>
                      {newPassword.length >= 8 ? '✓' : '○'}
                    </span>
                    At least 8 characters
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={/(?=.*[a-z])(?=.*[A-Z])/.test(newPassword) ? 'text-green-600' : ''}>
                      {/(?=.*[a-z])(?=.*[A-Z])/.test(newPassword) ? '✓' : '○'}
                    </span>
                    Uppercase and lowercase letters
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={/\d/.test(newPassword) ? 'text-green-600' : ''}>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Update Password'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
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