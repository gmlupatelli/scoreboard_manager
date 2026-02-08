'use client';

import { useState } from 'react';
import { subscriptionService } from '@/services/subscriptionService';
import Icon from '@/components/ui/AppIcon';

interface UserSubscription {
  id: string;
  email: string;
  fullName: string | null;
}

interface LinkAccountModalProps {
  user: UserSubscription;
  onClose: () => void;
  onSuccess: () => void;
}

interface VerifyResult {
  subscription: {
    id: string;
    customerEmail: string;
    customerName: string;
    status: string;
    statusFormatted: string;
    tier: string;
    billingInterval: string;
    amountCents: number;
    currency: string;
    renewsAt: string | null;
    cancelled: boolean;
    testMode: boolean;
  };
  alreadyLinked: boolean;
  linkedUser: {
    userId: string;
    email: string;
    fullName: string | null;
  } | null;
}

export default function LinkAccountModal({ user, onClose, onSuccess }: LinkAccountModalProps) {
  const [subscriptionId, setSubscriptionId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overrideEmail, setOverrideEmail] = useState(false);

  const handleVerify = async () => {
    if (!subscriptionId.trim()) {
      setError('Please enter a LemonSqueezy subscription ID');
      return;
    }

    setIsVerifying(true);
    setError(null);
    setVerifyResult(null);

    const { data, error: verifyError } = await subscriptionService.verifySubscriptionLinkAdmin(
      subscriptionId.trim()
    );

    if (verifyError) {
      setError(verifyError);
      setIsVerifying(false);
      return;
    }

    setVerifyResult(data as VerifyResult);
    setIsVerifying(false);
  };

  const handleLink = async () => {
    if (!verifyResult) return;

    const emailMismatch =
      verifyResult.subscription.customerEmail.toLowerCase() !== user.email.toLowerCase();
    if (emailMismatch && !overrideEmail) {
      setError('Email mismatch. Check the override box to force link.');
      return;
    }

    setIsLinking(true);
    setError(null);

    const { error: linkError } = await subscriptionService.linkSubscriptionAdmin(
      user.id,
      subscriptionId.trim(),
      overrideEmail
    );

    if (linkError) {
      setError(linkError);
      setIsLinking(false);
      return;
    }

    onSuccess();
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(cents / 100);
  };

  const emailMatch =
    verifyResult &&
    verifyResult.subscription.customerEmail.toLowerCase() === user.email.toLowerCase();

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text-primary">Link Subscription</h2>
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
            <div className="text-sm text-text-secondary">Linking subscription to:</div>
            <div className="font-medium text-text-primary">{user.fullName || 'No name'}</div>
            <div className="text-sm text-text-secondary">{user.email}</div>
          </div>

          {/* Subscription ID Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-primary mb-1">
              LemonSqueezy Subscription ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={subscriptionId}
                onChange={(e) => setSubscriptionId(e.target.value)}
                placeholder="Enter subscription ID..."
                className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                onClick={handleVerify}
                disabled={isVerifying || !subscriptionId.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isVerifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
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

          {/* Verify Result */}
          {verifyResult && (
            <div className="mb-4 p-4 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">Subscription Details</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    verifyResult.subscription.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {verifyResult.subscription.statusFormatted}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-text-secondary">Customer Email:</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={emailMatch ? 'text-green-600' : 'text-red-600'}>
                    {verifyResult.subscription.customerEmail}
                  </span>
                  {emailMatch ? (
                    <Icon name="CheckCircleIcon" size={16} className="text-green-600" />
                  ) : (
                    <Icon name="ExclamationTriangleIcon" size={16} className="text-red-600" />
                  )}
                </div>

                <div>
                  <span className="text-text-secondary">Tier:</span>
                </div>
                <div className="capitalize">{verifyResult.subscription.tier.replace('_', ' ')}</div>

                <div>
                  <span className="text-text-secondary">Billing:</span>
                </div>
                <div>
                  {formatPrice(
                    verifyResult.subscription.amountCents,
                    verifyResult.subscription.currency
                  )}
                  <span className="text-text-secondary">
                    {' '}
                    / {verifyResult.subscription.billingInterval}
                  </span>
                </div>
              </div>

              {/* Already Linked Warning */}
              {verifyResult.alreadyLinked && verifyResult.linkedUser && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Icon
                      name="ExclamationTriangleIcon"
                      size={18}
                      className="text-yellow-600 flex-shrink-0 mt-0.5"
                    />
                    <div className="text-sm">
                      <div className="font-medium text-yellow-700">Already Linked</div>
                      <div className="text-yellow-600">
                        This subscription is linked to: {verifyResult.linkedUser.email}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Mismatch Warning & Override */}
              {!emailMatch && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Icon
                      name="ExclamationTriangleIcon"
                      size={18}
                      className="text-yellow-600 flex-shrink-0 mt-0.5"
                    />
                    <div className="text-sm">
                      <div className="font-medium text-yellow-700">Email Mismatch</div>
                      <div className="text-yellow-600 mb-2">
                        The subscription email doesn&apos;t match the user&apos;s email.
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={overrideEmail}
                          onChange={(e) => setOverrideEmail(e.target.checked)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-yellow-700">Override and link anyway</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
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
              onClick={handleLink}
              disabled={
                !verifyResult ||
                isLinking ||
                (verifyResult.alreadyLinked && verifyResult.linkedUser?.userId !== user.id)
              }
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLinking ? 'Linking...' : 'Link Subscription'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
