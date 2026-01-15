'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuthGuard, useAbortableFetch, useUndoQueue } from '@/hooks';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Icon from '@/components/ui/AppIcon';
import UndoToast from '@/components/common/UndoToast';
import InviteUserModal from '@/app/dashboard/components/InviteUserModal';
import InvitationCard from './components/InvitationCard';

interface Invitation {
  id: string;
  inviter_id: string | null;
  invitee_email: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
}

export default function InvitationsPage() {
  const { isAuthorized, isChecking, getAuthHeaders } = useAuthGuard();
  const { execute } = useAbortableFetch();
  const { toasts, addUndoAction, executeUndo, removeToast } = useUndoQueue();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pendingCancelsRef = useRef<
    Map<string, { originalStatus: Invitation['status']; timerId: NodeJS.Timeout }>
  >(new Map());

  // Execute all pending cancels on unmount
  useEffect(() => {
    const pendingCancels = pendingCancelsRef.current;
    return () => {
      pendingCancels.forEach(async ({ timerId }) => {
        clearTimeout(timerId);
        // The API call would have been made in the timeout, so nothing to do here
      });
      pendingCancels.clear();
    };
  }, []);

  const fetchInvitations = useCallback(async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await execute(
        '/api/invitations',
        {
          credentials: 'include',
          headers: authHeaders,
        },
        'invitations'
      );

      if (response && response.ok) {
        const data = await response.json();
        setInvitations(data);
      }
    } catch (_err) {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, execute]);

  useEffect(() => {
    if (isAuthorized) {
      fetchInvitations();
    }
  }, [isAuthorized, fetchInvitations]);

  const handleCancelInvitation = async (invitationId: string) => {
    const invitation = invitations.find((inv) => inv.id === invitationId);
    if (!invitation || invitation.status !== 'pending') return;

    const cancelId = `cancel-${invitationId}`;
    const originalStatus = invitation.status;

    // Optimistically update UI
    setInvitations((prev) =>
      prev.map((inv) => (inv.id === invitationId ? { ...inv, status: 'cancelled' as const } : inv))
    );

    // Set up delayed API call (5 seconds)
    const timerId = setTimeout(async () => {
      pendingCancelsRef.current.delete(cancelId);
      try {
        const authHeaders = await getAuthHeaders();
        const response = await execute(
          `/api/invitations/${invitationId}`,
          {
            method: 'DELETE',
            credentials: 'include',
            headers: authHeaders,
          },
          cancelId
        );

        if (!response || !response.ok) {
          // Restore on error
          setInvitations((prev) =>
            prev.map((inv) => (inv.id === invitationId ? { ...inv, status: originalStatus } : inv))
          );
        }
      } catch {
        // Restore on error
        setInvitations((prev) =>
          prev.map((inv) => (inv.id === invitationId ? { ...inv, status: originalStatus } : inv))
        );
      }
    }, 5000);

    // Track pending cancel
    pendingCancelsRef.current.set(cancelId, { originalStatus, timerId });

    // Add undo action
    addUndoAction({
      id: cancelId,
      message: `Cancelled invitation to ${invitation.invitee_email}`,
      timestamp: Date.now(),
      undo: async () => {
        // Cancel the pending API call
        const pending = pendingCancelsRef.current.get(cancelId);
        if (pending) {
          clearTimeout(pending.timerId);
          pendingCancelsRef.current.delete(cancelId);
        }
        // Restore to original status
        setInvitations((prev) =>
          prev.map((inv) => (inv.id === invitationId ? { ...inv, status: originalStatus } : inv))
        );
      },
    });
  };

  const _getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-warning';
      case 'accepted':
        return 'bg-green-500/10 text-success';
      case 'expired':
        return 'bg-muted text-text-secondary';
      case 'cancelled':
        return 'bg-red-500/10 text-destructive';
      default:
        return 'bg-muted text-text-secondary';
    }
  };

  const pendingCount = invitations.filter((inv) => inv.status === 'pending').length;
  const acceptedCount = invitations.filter((inv) => inv.status === 'accepted').length;

  if (isChecking || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading invitations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={true} />

      <main className="flex-1 pt-20 landscape-mobile:pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 landscape-mobile:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">Invitations</h1>
              <p className="text-text-secondary">
                Invite users to join the platform and track your sent invitations.
              </p>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150"
              >
                <Icon name="ArrowLeftIcon" size={18} />
                <span>Back to Dashboard</span>
              </Link>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth hover-lift font-medium"
                title="Send invitation to a new user"
              >
                <Icon name="UserPlusIcon" size={20} />
                <span>Invite User</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Sent</p>
                  <p className="text-2xl font-bold text-text-primary">{invitations.length}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-red-600/10 flex items-center justify-center">
                  <Icon name="EnvelopeIcon" size={20} className="text-primary" />
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Pending</p>
                  <p className="text-2xl font-bold text-warning">{pendingCount}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-yellow-600/10 flex items-center justify-center">
                  <Icon name="ClockIcon" size={20} className="text-warning" />
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Accepted</p>
                  <p className="text-2xl font-bold text-success">{acceptedCount}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Icon name="CheckCircleIcon" size={20} className="text-success" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg elevation-1">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-text-primary">All Invitations</h2>
            </div>

            <div className="p-6">
              {invitations.length === 0 ? (
                <div className="text-center py-12">
                  <Icon
                    name="EnvelopeIcon"
                    size={48}
                    className="mx-auto text-text-secondary opacity-50 mb-4"
                  />
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    No invitations sent yet
                  </h3>
                  <p className="text-text-secondary mb-6">
                    Start inviting users to join the platform.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth font-medium"
                    title="Send invitation to a new user"
                  >
                    <Icon name="UserPlusIcon" size={18} />
                    <span>Send Your First Invitation</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {invitations.map((invitation) => (
                    <InvitationCard
                      key={invitation.id}
                      id={invitation.id}
                      email={invitation.invitee_email}
                      status={invitation.status}
                      createdAt={invitation.created_at}
                      expiresAt={invitation.expires_at}
                      onCancel={() => handleCancelInvitation(invitation.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <InviteUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchInvitations}
      />

      {/* Undo toasts for cancel operations */}
      {toasts.map((undoToast, index) => (
        <UndoToast
          key={undoToast.id}
          toast={undoToast}
          onUndo={() => executeUndo(undoToast.id)}
          onDismiss={() => removeToast(undoToast.id)}
          index={index}
        />
      ))}
    </div>
  );
}
