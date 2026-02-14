'use client';

import { useState } from 'react';
import { subscriptionService } from '@/services/subscriptionService';
import Icon from '@/components/ui/AppIcon';
import { getTierDetails } from '@/lib/subscription/tiers';
import { UserSubscription } from '../types';

interface CancelConfirmModalProps {
  user: UserSubscription;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CancelConfirmModal({ user, onClose, onSuccess }: CancelConfirmModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tier = user.subscription?.tier ?? null;
  const isGifted = user.subscription?.isGifted ?? false;
  const nextBillingDate = user.subscription?.currentPeriodEnd ?? null;

  const tierInfo = tier ? getTierDetails(tier) : null;
  const expectedText = 'CANCEL';

  const handleCancel = async () => {
    if (confirmText !== expectedText) {
      setError(`Please type "${expectedText}" to confirm`);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    if (isGifted) {
      // Remove gifted appreciation tier
      const { error: removeError } = await subscriptionService.removeAppreciationTierAdmin(user.id);
      if (removeError) {
        setError(removeError);
        setIsSubmitting(false);
        return;
      }
    } else {
      // Cancel via LemonSqueezy
      const { error: cancelError } = await subscriptionService.cancelSubscriptionAdmin(user.id);
      if (cancelError) {
        setError(cancelError);
        setIsSubmitting(false);
        return;
      }
    }

    onSuccess();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Icon name="ExclamationTriangleIcon" size={24} className="text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-text-primary">
                {isGifted ? 'Remove Appreciation Tier' : 'Cancel Subscription'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-secondary hover:bg-muted rounded-lg transition-colors"
              title="Close"
            >
              <Icon name="XMarkIcon" size={20} />
            </button>
          </div>

          {/* Warning */}
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon
                name="ExclamationCircleIcon"
                size={18}
                className="text-red-600 flex-shrink-0 mt-0.5"
              />
              <div className="text-sm text-red-700">
                <p className="font-medium mb-1">This action cannot be undone</p>
                {isGifted ? (
                  <p>
                    The user will immediately lose access to appreciation tier benefits. They can
                    subscribe to a paid plan if they wish to regain access.
                  </p>
                ) : (
                  <p>
                    The subscription will be cancelled in LemonSqueezy. The user may retain access
                    until end of their current billing period.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="mb-4 p-4 bg-muted rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">User:</span>
                <span className="font-medium text-text-primary">{user.fullName || user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Email:</span>
                <span className="text-text-primary">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Current Tier:</span>
                <span className="text-text-primary">
                  {tierInfo ? `${tierInfo.emoji} ${tierInfo.label}` : 'Free'}
                  {isGifted && (
                    <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                      Gifted
                    </span>
                  )}
                </span>
              </div>
              {!isGifted && nextBillingDate && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Next Billing:</span>
                  <span className="text-text-primary">{formatDate(nextBillingDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-primary mb-1">
              Type <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{expectedText}</span>{' '}
              to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="Type CANCEL"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
            />
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
              Keep Subscription
            </button>
            <button
              onClick={handleCancel}
              disabled={isSubmitting || confirmText !== expectedText}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  {isGifted ? 'Removing...' : 'Cancelling...'}
                </>
              ) : (
                <>
                  <Icon name="XCircleIcon" size={18} />
                  {isGifted ? 'Remove Tier' : 'Cancel Subscription'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
