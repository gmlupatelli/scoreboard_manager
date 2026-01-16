'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
    return {};
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        credentials: 'include',
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send invitation');
        return;
      }

      setEmail('');
      onSuccess();
      onClose();
    } catch (_err) {
      setError('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = useCallback(() => {
    setEmail('');
    setError('');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !isHydrated) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isHydrated, handleClose]);

  if (!isHydrated || !isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 z-[1010]" onClick={handleClose} />
      <div className="fixed inset-0 flex items-center justify-center z-[1011] p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-modal-title"
          className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-[calc(100vw-2rem)] sm:max-w-md elevation-3 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 sm:p-6 landscape-mobile:p-3 border-b border-border">
            <h2
              id="invite-modal-title"
              className="text-xl font-semibold text-text-primary flex items-center"
            >
              <Icon name="EnvelopeIcon" size={24} className="mr-2 text-primary" />
              Invite User
            </h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-md hover:bg-muted transition-smooth duration-150 min-w-[44px] min-h-[44px]"
              aria-label="Close modal"
              title="Close modal"
            >
              <Icon name="XMarkIcon" size={20} className="text-text-secondary" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 landscape-mobile:p-3">
            {error && (
              <div className="mb-4 bg-red-500/10 border border-destructive text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label
                htmlFor="invite-email"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Email Address
              </label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address..."
                required
                className="min-w-0 w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-text-primary"
              />
              <p className="mt-2 text-sm text-text-secondary">
                The user will receive an email invitation to join the platform.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-muted transition-smooth duration-150 min-w-[44px] min-h-[44px]"
                title="Cancel and close"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !email}
                className="flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-smooth duration-150 disabled:opacity-50 min-w-[44px] min-h-[44px]"
                title="Send invitation email"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Icon name="PaperAirplaneIcon" size={18} />
                    <span>Send Invitation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
