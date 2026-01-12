'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Icon from '@/components/ui/AppIcon';
import SearchableSelect from '@/components/ui/SearchableSelect';
import InviteUserModal from '@/app/dashboard/components/InviteUserModal';

interface Invitation {
  id: string;
  inviter_id: string | null;
  invitee_email: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
  inviter?: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface Inviter {
  id: string;
  email: string;
  full_name: string | null;
}

interface PaginatedResponse {
  data: Invitation[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export default function SystemAdminInvitationsPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [inviters, setInviters] = useState<Inviter[]>([]);
  const [loadingInviters, setLoadingInviters] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
    return {};
  };

  const fetchInviters = useCallback(async () => {
    setLoadingInviters(true);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch('/api/invitations/inviters', {
        credentials: 'include',
        headers: authHeaders,
      });
      if (response.ok) {
        const data = await response.json();
        setInviters(data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingInviters(false);
    }
  }, []);

  const fetchInvitations = useCallback(
    async (page: number) => {
      setLoading(true);
      setError('');

      try {
        const authHeaders = await getAuthHeaders();
        const params = new URLSearchParams({
          paginated: 'true',
          page: page.toString(),
          limit: PAGE_SIZE.toString(),
        });

        if (debouncedSearch) params.append('search', debouncedSearch);
        if (statusFilter) params.append('status', statusFilter);
        if (ownerFilter) params.append('ownerId', ownerFilter);

        const response = await fetch(`/api/invitations?${params.toString()}`, {
          credentials: 'include',
          headers: authHeaders,
        });

        if (response.ok) {
          const result: PaginatedResponse = await response.json();
          setInvitations(result.data);
          setTotalPages(result.totalPages);
          setTotalCount(result.totalCount);
          setCurrentPage(result.page);
        } else {
          setError('Failed to load invitations');
        }
      } catch {
        setError('Failed to load invitations');
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, statusFilter, ownerFilter]
  );

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (userProfile?.role !== 'system_admin') {
        router.push('/dashboard');
        return;
      }

      fetchInviters();
    }
  }, [user, userProfile, authLoading, router, fetchInviters]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    if (user && userProfile?.role === 'system_admin') {
      setCurrentPage(1);
      fetchInvitations(1);
    }
  }, [debouncedSearch, statusFilter, ownerFilter, user, userProfile?.role, fetchInvitations]);

  useEffect(() => {
    if (user && userProfile?.role === 'system_admin' && currentPage > 1) {
      fetchInvitations(currentPage);
    }
  }, [currentPage, user, userProfile?.role, fetchInvitations]);

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: authHeaders,
      });

      if (response.ok) {
        setInvitations((prev) =>
          prev.map((inv) =>
            inv.id === invitationId ? { ...inv, status: 'cancelled' as const } : inv
          )
        );
        setSuccess('Invitation cancelled');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to cancel invitation');
        setTimeout(() => setError(''), 3000);
      }
    } catch {
      setError('Failed to cancel invitation');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'accepted':
        return 'bg-success/10 text-success';
      case 'expired':
        return 'bg-muted text-text-secondary';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-text-secondary';
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchInvitations(page);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-md border border-border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-smooth"
        >
          <Icon name="ChevronLeftIcon" size={16} />
        </button>

        {pages.map((page, index) =>
          typeof page === 'number' ? (
            <button
              key={index}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                page === currentPage
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border hover:bg-muted'
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={index} className="px-2 text-text-secondary">
              {page}
            </span>
          )
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-md border border-border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-smooth"
        >
          <Icon name="ChevronRightIcon" size={16} />
        </button>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={true} />

      <main className="flex-1 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">All Invitations</h1>
              <p className="text-text-secondary mt-1">
                Manage all user invitations across the platform
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150"
              >
                <Icon name="ArrowLeftIcon" size={18} />
                <span>Back to Dashboard</span>
              </Link>
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-smooth duration-150"
              >
                <Icon name="PlusIcon" size={18} />
                <span>Invite User</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md flex items-center">
              <Icon name="ExclamationCircleIcon" size={20} className="mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-success/10 border border-success text-success px-4 py-3 rounded-md flex items-center">
              <Icon name="CheckCircleIcon" size={20} className="mr-2" />
              {success}
            </div>
          )}

          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="relative w-full lg:w-80">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Icon name="MagnifyingGlassIcon" size={20} className="text-muted-foreground" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by invitee email..."
                  className="w-full pl-10 pr-10 py-2 border border-input rounded-md bg-surface text-text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-smooth duration-150"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-text-primary transition-smooth duration-150"
                    aria-label="Clear search"
                  >
                    <Icon name="XMarkIcon" size={20} />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <label htmlFor="ownerFilter" className="text-sm font-medium text-text-secondary">
                    Invited by:
                  </label>
                  <SearchableSelect
                    id="ownerFilter"
                    ariaLabel="Filter invitations by inviter"
                    options={[
                      { value: '', label: `All Inviters (${inviters.length})` },
                      ...inviters.map((inviter) => ({
                        value: inviter.id,
                        label: inviter.full_name || inviter.email,
                      })),
                    ]}
                    value={ownerFilter}
                    onChange={setOwnerFilter}
                    placeholder={loadingInviters ? 'Loading...' : 'Filter by inviter...'}
                    emptyMessage="No inviters found"
                    className="min-w-[200px]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <label htmlFor="statusFilter" className="text-sm font-medium text-text-secondary">
                    Status:
                  </label>
                  <select
                    id="statusFilter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-surface text-text-primary"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg elevation-1">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary flex items-center">
                <Icon name="EnvelopeIcon" size={24} className="mr-2 text-primary" />
                Invitations
              </h2>
              <span className="text-sm text-text-secondary">
                {totalCount} total invitation{totalCount !== 1 ? 's' : ''}
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-text-secondary">Loading invitations...</p>
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-12">
                <Icon
                  name="EnvelopeIcon"
                  size={48}
                  className="mx-auto text-text-secondary opacity-50 mb-4"
                />
                <p className="text-text-secondary">
                  {debouncedSearch || statusFilter || ownerFilter
                    ? 'No invitations match your filters.'
                    : 'No invitations have been sent yet.'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                          Invitee Email
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                          Invited By
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                          Created
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                          Expires
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invitations.map((invitation) => (
                        <tr
                          key={invitation.id}
                          className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-smooth"
                        >
                          <td className="py-3 px-4 text-sm text-text-primary font-medium">
                            {invitation.invitee_email}
                          </td>
                          <td className="py-3 px-4 text-sm text-text-secondary">
                            {invitation.inviter?.full_name ||
                              invitation.inviter?.email ||
                              'Unknown'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(invitation.status)}`}
                            >
                              {invitation.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-text-secondary">
                            {new Date(invitation.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-text-secondary">
                            {new Date(invitation.expires_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {invitation.status === 'pending' && (
                              <button
                                onClick={() => handleCancelInvitation(invitation.id)}
                                className="text-destructive hover:text-destructive/80 text-sm font-medium transition-smooth"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {renderPagination()}
              </>
            )}
          </div>

          <div className="mt-4 text-center text-sm text-text-secondary">
            Showing {invitations.length} of {totalCount} invitations
            {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
          </div>
        </div>
      </main>

      <Footer />

      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => {
          setSuccess('Invitation sent successfully');
          setTimeout(() => setSuccess(''), 3000);
          fetchInvitations(1);
          fetchInviters();
        }}
      />
    </div>
  );
}
