'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';
import InviteUserModal from './InviteUserModal';

interface Invitation {
  id: string;
  inviter_id: string | null;
  invitee_email: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
}

export default function InvitationsSection() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { 'Authorization': `Bearer ${session.access_token}` };
    }
    return {};
  };

  const fetchInvitations = useCallback(async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch('/api/invitations', {
        credentials: 'include',
        headers: authHeaders
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
    fetchInvitations();
  }, [fetchInvitations]);

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: authHeaders
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

  const pendingCount = invitations.filter(inv => inv.status === 'pending').length;
  const acceptedCount = invitations.filter(inv => inv.status === 'accepted').length;

  return (
    <div className="bg-card border border-border rounded-lg elevation-1">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary flex items-center">
              <Icon name="UserPlusIcon" size={24} className="mr-2 text-primary" />
              Invitations
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {pendingCount} pending, {acceptedCount} accepted
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-smooth duration-150 font-medium"
          >
            <Icon name="PlusIcon" size={18} />
            <span>Invite User</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-text-secondary">Loading invitations...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="EnvelopeIcon" size={48} className="mx-auto text-text-secondary opacity-50 mb-4" />
            <p className="text-text-secondary">No invitations sent yet.</p>
            <p className="text-sm text-text-secondary mt-1">Click "Invite User" to invite someone to join.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.slice(0, 5).map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name="UserIcon" size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{invitation.invitee_email}</p>
                    <p className="text-sm text-text-secondary">
                      Sent {new Date(invitation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(invitation.status)}`}>
                    {invitation.status}
                  </span>
                  {invitation.status === 'pending' && (
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="p-1.5 rounded-md text-text-secondary hover:text-destructive hover:bg-destructive/10 transition-smooth duration-150"
                      title="Cancel invitation"
                    >
                      <Icon name="XMarkIcon" size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {invitations.length > 5 && (
              <p className="text-sm text-text-secondary text-center mt-4">
                And {invitations.length - 5} more invitations...
              </p>
            )}
          </div>
        )}
      </div>

      <InviteUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchInvitations}
      />
    </div>
  );
}
