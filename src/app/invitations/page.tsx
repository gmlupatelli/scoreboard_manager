'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Icon from '@/components/ui/AppIcon';
import InviteUserModal from '@/app/dashboard/components/InviteUserModal';

interface Invitation {
  id: string;
  inviter_id: string | null;
  invitee_email: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
}

export default function InvitationsPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchInvitations = useCallback(async () => {
    try {
      const response = await fetch('/api/invitations', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      }
    } catch (err) {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      fetchInvitations();
    }
  }, [user, authLoading, router, fetchInvitations]);

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setInvitations(prev => prev.map(inv => 
          inv.id === invitationId ? { ...inv, status: 'cancelled' as const } : inv
        ));
      }
    } catch (err) {
      // Silently handle error
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning';
      case 'accepted': return 'bg-success/10 text-success';
      case 'expired': return 'bg-muted text-text-secondary';
      case 'cancelled': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-text-secondary';
    }
  };

  const handleSignOut = async () => {
    router.push('/public-scoreboard-list');
    await signOut();
  };

  const pendingCount = invitations.filter(inv => inv.status === 'pending').length;
  const acceptedCount = invitations.filter(inv => inv.status === 'accepted').length;

  if (authLoading || loading) {
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
      <Header isAuthenticated={true} onLogout={handleSignOut} />
      
      <main className="flex-1 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
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
                <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
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
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
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
                  <Icon name="EnvelopeIcon" size={48} className="mx-auto text-text-secondary opacity-50 mb-4" />
                  <h3 className="text-lg font-medium text-text-primary mb-2">No invitations sent yet</h3>
                  <p className="text-text-secondary mb-6">Start inviting users to join the platform.</p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth font-medium"
                  >
                    <Icon name="UserPlusIcon" size={18} />
                    <span>Send Your First Invitation</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon name="UserIcon" size={24} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{invitation.invitee_email}</p>
                          <div className="flex items-center space-x-3 text-sm text-text-secondary mt-1">
                            <span>Sent {new Date(invitation.created_at).toLocaleDateString()}</span>
                            <span className="text-border">|</span>
                            <span>Expires {new Date(invitation.expires_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(invitation.status)}`}>
                          {invitation.status}
                        </span>
                        {invitation.status === 'pending' && (
                          <button
                            onClick={() => handleCancelInvitation(invitation.id)}
                            className="p-2 rounded-md text-text-secondary hover:text-destructive hover:bg-destructive/10 transition-smooth duration-150"
                            title="Cancel invitation"
                          >
                            <Icon name="XMarkIcon" size={18} />
                          </button>
                        )}
                      </div>
                    </div>
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
    </div>
  );
}
