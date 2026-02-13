'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { subscriptionService } from '@/services/subscriptionService';
import { Subscription } from '@/types/models';

const MAX_DISPLAY_NAME_LENGTH = 50;

interface SupporterSectionProps {
  onToast: (message: string, type: 'success' | 'error') => void;
}

export default function SupporterSection({ onToast }: SupporterSectionProps) {
  const { user, subscriptionTier } = useAuth();
  const { getAuthHeaders } = useAuthGuard();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [showOnSupportersPage, setShowOnSupportersPage] = useState(true);

  // Original values for cancel
  const [originalDisplayName, setOriginalDisplayName] = useState('');
  const [_originalShowOnSupportersPage, setOriginalShowOnSupportersPage] = useState(true);

  useEffect(() => {
    const loadSubscription = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      const { data } = await subscriptionService.getSubscription(user.id);

      if (data) {
        setSubscription(data);
        const name = data.supporterDisplayName || '';
        const show = data.showOnSupportersPage;
        setDisplayName(name);
        setShowOnSupportersPage(show);
        setOriginalDisplayName(name);
        setOriginalShowOnSupportersPage(show);
      }

      setIsLoading(false);
    };

    if (user?.id) {
      loadSubscription();
    }
  }, [user?.id]);

  // Don't render if not a supporter or on appreciation tier
  if (!subscriptionTier || subscriptionTier === 'appreciation') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg elevation-1 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-6 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return null;
  }

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDisplayName(originalDisplayName);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const headers = await getAuthHeaders();
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
        onToast(data.error || 'Failed to update preferences', 'error');
        return;
      }

      // Update local state with saved values
      setOriginalDisplayName(displayName.trim());
      setOriginalShowOnSupportersPage(showOnSupportersPage);
      setIsEditing(false);
      onToast('Supporter preferences updated', 'success');

      // Refresh subscription data
      if (user?.id) {
        const { data } = await subscriptionService.getSubscription(user.id);
        if (data) {
          setSubscription(data);
        }
      }
    } catch (_err) {
      onToast('An unexpected error occurred. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVisibility = async (checked: boolean) => {
    setShowOnSupportersPage(checked);
    setIsTogglingVisibility(true);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/user/supporter-preferences', {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          showOnSupportersPage: checked,
          supporterDisplayName: (subscription?.supporterDisplayName ?? displayName.trim()) || null,
        }),
      });

      if (!response.ok) {
        // Revert on failure
        setShowOnSupportersPage(!checked);
        const data = await response.json();
        onToast(data.error || 'Failed to update visibility', 'error');
        return;
      }

      setOriginalShowOnSupportersPage(checked);
      onToast(
        checked
          ? 'You are now visible on the supporters page'
          : 'You are now hidden from the supporters page',
        'success'
      );

      // Refresh subscription data
      if (user?.id) {
        const { data } = await subscriptionService.getSubscription(user.id);
        if (data) {
          setSubscription(data);
        }
      }
    } catch (_err) {
      // Revert on failure
      setShowOnSupportersPage(!checked);
      onToast('An unexpected error occurred. Please try again.', 'error');
    } finally {
      setIsTogglingVisibility(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg elevation-1 p-6">
      <h2 className="text-xl font-semibold text-text-primary mb-6">Supporter Recognition</h2>

      <div className="space-y-6">
        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Supporter Page Name
          </label>
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSaving) {
                    e.preventDefault();
                    handleSave();
                  } else if (e.key === 'Escape') {
                    handleCancel();
                  }
                }}
                className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Leave blank to use your account name"
                maxLength={MAX_DISPLAY_NAME_LENGTH}
                disabled={isSaving}
                autoFocus
              />
              <p className="text-xs text-text-secondary">
                This name will appear on the public supporters page ({displayName.length}/
                {MAX_DISPLAY_NAME_LENGTH})
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:bg-muted disabled:text-text-secondary disabled:cursor-not-allowed transition-smooth"
                  title="Save display name"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 py-2 bg-muted text-text-secondary rounded-lg hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-muted transition-smooth"
                  title="Cancel editing"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-text-primary">
                {subscription.supporterDisplayName || (
                  <span className="text-text-secondary italic">Using Display Name</span>
                )}
              </span>
              <button
                onClick={handleEdit}
                className="text-primary hover:opacity-80 font-medium transition-smooth"
                title="Edit display name"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Show on supporters page - always interactive */}
        <div>
          <label
            className={`flex items-center justify-between cursor-pointer ${isTogglingVisibility ? 'opacity-70 pointer-events-none' : ''}`}
          >
            <span className="text-text-primary">
              {showOnSupportersPage ? 'Visible on supporters page' : 'Hidden from supporters page'}
            </span>
            <div className="relative">
              <input
                type="checkbox"
                checked={showOnSupportersPage}
                onChange={(e) => handleToggleVisibility(e.target.checked)}
                disabled={isTogglingVisibility}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/30 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
