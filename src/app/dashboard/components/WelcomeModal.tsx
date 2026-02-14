'use client';

import { useState, useEffect, useCallback } from 'react';
import FocusTrap from 'focus-trap-react';
import Icon from '@/components/ui/AppIcon';
import TierBadge from '@/components/ui/TierBadge';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { type AppreciationTier } from '@/lib/subscription/tiers';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: AppreciationTier | null;
  defaultDisplayName: string;
}

const MAX_DISPLAY_NAME_LENGTH = 50;

export default function WelcomeModal({
  isOpen,
  onClose,
  tier,
  defaultDisplayName,
}: WelcomeModalProps) {
  const { getAuthHeaders } = useAuthGuard();
  const [isHydrated, setIsHydrated] = useState(false);
  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [showOnSupportersPage, setShowOnSupportersPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setDisplayName(defaultDisplayName);
      setShowOnSupportersPage(true);
      setError(null);
      setIsSaved(false);
    }
  }, [isOpen, defaultDisplayName]);

  const handleSave = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/user/supporter-preferences', {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          showOnSupportersPage,
          supporterDisplayName: displayName.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to save preferences');
        return;
      }

      setIsSaved(true);
      // Auto-close after a brief success display
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (_err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [getAuthHeaders, showOnSupportersPage, displayName, onClose]);

  const handleSkip = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't allow ESC to close - must use buttons
      if (event.key === 'Escape') {
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isHydrated || !isOpen) {
    return null;
  }

  return (
    <FocusTrap>
      <div>
        {/* Overlay - no click to close */}
        <div className="fixed inset-0 bg-black/80 z-[1010]" />
        <div className="fixed inset-0 flex items-center justify-center z-[1011] p-4 pointer-events-none">
          <div
            className="relative bg-card border border-border rounded-lg p-6 sm:p-8 max-w-[calc(100vw-2rem)] sm:max-w-[600px] w-full elevation-3 max-h-[90vh] overflow-y-auto pointer-events-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-modal-title"
            data-testid="welcome-modal"
          >
            {isSaved ? (
              /* Success state */
              <div className="text-center py-4">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">You&apos;re all set!</h2>
                <p className="text-text-secondary">Your supporter preferences have been saved.</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="text-5xl mb-4">🎉</div>
                  <h2
                    id="welcome-modal-title"
                    className="text-2xl font-bold text-text-primary mb-2"
                    data-testid="welcome-modal-title"
                  >
                    Welcome, Supporter!
                  </h2>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {tier && <TierBadge tier={tier} size="md" />}
                  </div>
                  <p className="text-text-secondary text-sm">
                    Thank you for supporting Scoreboard Manager! Set your preferences below.
                  </p>
                </div>

                {/* Form */}
                <div className="space-y-5">
                  {/* Display Name */}
                  <div>
                    <label
                      htmlFor="supporter-display-name"
                      className="block text-sm font-medium text-text-primary mb-2"
                    >
                      Public Display Name
                    </label>
                    <input
                      id="supporter-display-name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Leave blank to use your account name"
                      maxLength={MAX_DISPLAY_NAME_LENGTH}
                      disabled={isSubmitting}
                      data-testid="welcome-modal-display-name"
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-text-secondary">
                        This name will appear on the public supporters page
                      </p>
                      <span className="text-xs text-text-secondary">
                        {displayName.length}/{MAX_DISPLAY_NAME_LENGTH}
                      </span>
                    </div>
                  </div>

                  {/* Show on supporters page toggle */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-sm font-medium text-text-primary">
                        Show me on supporters page
                      </span>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Your support will be visible to all users
                      </p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={showOnSupportersPage}
                        onChange={(e) => setShowOnSupportersPage(e.target.checked)}
                        disabled={isSubmitting}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                    </div>
                  </label>

                  {/* Error message */}
                  {error && (
                    <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                      <Icon name="ExclamationTriangleIcon" size={20} className="text-destructive" />
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-8">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-150 underline-offset-2 hover:underline"
                    disabled={isSubmitting}
                    title="Skip for now and use defaults"
                    data-testid="welcome-modal-skip"
                  >
                    Skip for now
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-primary text-white rounded-md font-medium text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary transition-colors duration-150"
                    title="Save preferences and continue to dashboard"
                    data-testid="welcome-modal-save"
                  >
                    {isSubmitting ? 'Saving...' : 'Continue to Dashboard'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </FocusTrap>
  );
}
