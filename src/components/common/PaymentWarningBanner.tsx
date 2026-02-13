'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/AppIcon';

const SESSION_STORAGE_KEY = 'payment-warning-dismissed';

/**
 * Global banner shown when subscription is past_due.
 * Warns the user their payment failed and provides a link to update payment method.
 * Dismissible per session via sessionStorage.
 */
export default function PaymentWarningBanner() {
  const { subscriptionStatus, updatePaymentMethodUrl, loading: authLoading } = useAuth();
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
  });

  if (authLoading || subscriptionStatus !== 'past_due' || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
  };

  return (
    <div className="bg-orange-50 border-b border-orange-200" role="alert">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Icon
              name="ExclamationTriangleIcon"
              size={20}
              className="text-orange-600 flex-shrink-0"
            />
            <p className="text-sm text-orange-800">
              <span className="font-medium">Payment issue detected.</span> Your last payment failed.
              Please update your payment method to avoid losing access to your supporter features.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {updatePaymentMethodUrl && (
              <a
                href={updatePaymentMethodUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors duration-150"
                title="Update your payment method on LemonSqueezy"
              >
                Update Payment
              </a>
            )}
            <button
              onClick={handleDismiss}
              className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors duration-150"
              title="Dismiss this warning for this session"
            >
              <Icon name="XMarkIcon" size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
