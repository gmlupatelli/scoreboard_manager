'use client';

import { useState } from 'react';
import { subscriptionService } from '@/services/subscriptionService';
import Icon from '@/components/ui/AppIcon';

interface UserSubscription {
  id: string;
  email: string;
  fullName: string | null;
}

interface GiftTierModalProps {
  user: UserSubscription;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GiftTierModal({ user, onClose, onSuccess }: GiftTierModalProps) {
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationDate, setExpirationDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async () => {
    setError(null);

    if (hasExpiration && !expirationDate) {
      setError('Please select an expiration date');
      return;
    }

    if (hasExpiration) {
      const selectedDate = new Date(expirationDate);
      if (selectedDate <= new Date()) {
        setError('Expiration date must be in the future');
        return;
      }
    }

    setIsSubmitting(true);

    const expiresAt = hasExpiration ? new Date(expirationDate).toISOString() : null;
    const { error: giftError } = await subscriptionService.giftAppreciationTierAdmin(
      user.id,
      expiresAt
    );

    if (giftError) {
      setError(giftError);
      setIsSubmitting(false);
      return;
    }

    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-xl">🎁</span>
              </div>
              <h2 className="text-xl font-semibold text-text-primary">Gift Appreciation Tier</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-secondary hover:bg-muted rounded-lg transition-colors"
              title="Close"
            >
              <Icon name="XMarkIcon" size={20} />
            </button>
          </div>

          {/* User Info */}
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="text-sm text-text-secondary">Gifting appreciation tier to:</div>
            <div className="font-medium text-text-primary">{user.fullName || 'No name'}</div>
            <div className="text-sm text-text-secondary">{user.email}</div>
          </div>

          {/* Benefits Info */}
          <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon
                name="SparklesIcon"
                size={18}
                className="text-purple-600 flex-shrink-0 mt-0.5"
              />
              <div className="text-sm">
                <div className="font-medium text-purple-700">Appreciation Tier Benefits</div>
                <ul className="text-purple-600 mt-1 space-y-1">
                  <li>• Full access to all supporter features</li>
                  <li>• Kiosk mode for scoreboards</li>
                  <li>• No payment required</li>
                  <li>• Can be set to expire or remain permanent</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Expiration Option */}
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={hasExpiration}
                onChange={(e) => setHasExpiration(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-text-primary">Set an expiration date</span>
            </label>

            {hasExpiration && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  min={minDate}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            )}

            {!hasExpiration && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Icon
                    name="InformationCircleIcon"
                    size={18}
                    className="text-amber-600 flex-shrink-0 mt-0.5"
                  />
                  <span className="text-sm text-amber-700">
                    Without an expiration date, the appreciation tier will remain active until
                    manually removed.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <Icon
                name="ExclamationCircleIcon"
                size={20}
                className="text-red-600 flex-shrink-0 mt-0.5"
              />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-text-secondary hover:bg-muted rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Gifting...
                </>
              ) : (
                <>
                  <Icon name="GiftIcon" size={18} />
                  Gift Appreciation Tier
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
