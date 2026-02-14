'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuthGuard, useAbortableFetch, useTimeoutRef } from '@/hooks';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Icon from '@/components/ui/AppIcon';

interface SystemSettings {
  id: string;
  allow_public_registration: boolean;
  require_email_verification: boolean;
  created_at: string;
  updated_at: string;
}

interface OrphanFilesInfo {
  count: number;
  totalSizeBytes: number;
  totalSizeMB: string;
  orphans: Array<{
    id: string;
    storage_path: string;
    file_type: string;
    file_size: number | null;
    created_at: string;
  }>;
}

export default function SystemAdminSettingsPage() {
  const { isAuthorized, isChecking, getAuthHeaders } = useAuthGuard({
    requiredRole: 'system_admin',
  });
  const { execute } = useAbortableFetch();
  const { set: setTimeoutSafe, isMounted } = useTimeoutRef();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Orphan files state
  const [orphanInfo, setOrphanInfo] = useState<OrphanFilesInfo | null>(null);
  const [loadingOrphans, setLoadingOrphans] = useState(false);
  const [cleaningOrphans, setCleaningOrphans] = useState(false);
  const [orphanMinutes, setOrphanMinutes] = useState(60);

  const fetchSettings = useCallback(async () => {
    try {
      const authHeaders = getAuthHeaders();
      const response = await execute(
        '/api/settings',
        {
          credentials: 'include',
          cache: 'no-store',
          headers: {
            ...authHeaders,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        },
        'settings'
      );
      if (response && response.ok) {
        const data = await response.json();
        if (isMounted()) {
          setSettings(data);
        }
      }
    } catch (_err) {
      if (isMounted()) {
        setError('Failed to load settings');
      }
    }
  }, [getAuthHeaders, execute, isMounted]);

  const fetchOrphanFiles = useCallback(async () => {
    setLoadingOrphans(true);
    setError('');
    try {
      const authHeaders = getAuthHeaders();
      const response = await execute(
        `/api/admin/orphan-files?older_than_minutes=${orphanMinutes}`,
        {
          credentials: 'include',
          headers: authHeaders,
        },
        'orphan-files'
      );
      if (response && response.ok) {
        const data = await response.json();
        if (isMounted()) {
          setOrphanInfo(data);
        }
      } else if (response) {
        const data = await response.json();
        if (isMounted()) {
          setError(data.error || 'Failed to fetch orphan files');
        }
      }
    } catch (_err) {
      if (isMounted()) {
        setError('Failed to fetch orphan files');
      }
    } finally {
      if (isMounted()) {
        setLoadingOrphans(false);
      }
    }
  }, [getAuthHeaders, execute, isMounted, orphanMinutes]);

  const cleanOrphanFiles = async () => {
    if (!orphanInfo || orphanInfo.count === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${orphanInfo.count} orphan file(s)? This action cannot be undone.`
    );
    if (!confirmed) return;

    setCleaningOrphans(true);
    setError('');
    try {
      const authHeaders = getAuthHeaders();
      const response = await fetch(`/api/admin/orphan-files?older_than_minutes=${orphanMinutes}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: authHeaders,
      });

      if (response.ok) {
        const data = await response.json();
        if (isMounted()) {
          setSuccess(`Successfully deleted ${data.deleted} orphan file(s)`);
          setOrphanInfo(null);
          setTimeoutSafe(() => setSuccess(''), 5000, 'orphan-success-clear');
        }
      } else {
        const data = await response.json();
        if (isMounted()) {
          setError(data.error || 'Failed to delete orphan files');
        }
      }
    } catch (_err) {
      if (isMounted()) {
        setError('Failed to delete orphan files');
      }
    } finally {
      if (isMounted()) {
        setCleaningOrphans(false);
      }
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      void fetchSettings().finally(() => {
        if (isMounted()) {
          setLoading(false);
        }
      });
    }
  }, [isAuthorized, fetchSettings, isMounted]);

  const handleToggle = async (
    field: 'allow_public_registration' | 'require_email_verification'
  ) => {
    if (!settings) return;

    setSaving(true);
    setError('');
    setSuccess('');

    const newValue = !settings[field];

    try {
      const authHeaders = getAuthHeaders();
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        credentials: 'include',
        body: JSON.stringify({
          ...settings,
          [field]: newValue,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (isMounted()) {
          setSettings(data);
          setSuccess('Settings updated successfully');
          setTimeoutSafe(() => setSuccess(''), 3000, 'success-clear');
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update settings');
      }
    } catch {
      setError('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading settings...</p>
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
              <h1 className="text-3xl font-bold text-text-primary">System Settings</h1>
              <p className="text-text-secondary mt-1">
                Manage application-wide configuration and maintenance
              </p>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150"
            >
              <Icon name="ArrowLeftIcon" size={18} />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-destructive text-destructive px-4 py-3 rounded-md flex items-center">
              <Icon name="ExclamationCircleIcon" size={20} className="mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-500/10 border border-success text-success px-4 py-3 rounded-md flex items-center">
              <Icon name="CheckCircleIcon" size={20} className="mr-2" />
              {success}
            </div>
          )}

          <div
            className="bg-card border border-border rounded-lg p-6 mb-6 elevation-1"
            data-testid="registration-settings-card"
          >
            <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center">
              <Icon name="Cog6ToothIcon" size={24} className="mr-2 text-primary" />
              Registration Settings
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
                <div className="flex-1">
                  <h3 className="font-medium text-text-primary">Allow Public Registration</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    When disabled, only users with a valid invitation can create an account.
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('allow_public_registration')}
                  disabled={saving}
                  role="switch"
                  aria-checked={settings?.allow_public_registration ?? false}
                  aria-label="Allow Public Registration"
                  data-testid="setting-public-registration"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    settings?.allow_public_registration ? 'bg-primary' : 'bg-muted'
                  } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings?.allow_public_registration ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
                <div className="flex-1">
                  <h3 className="font-medium text-text-primary">Require Email Verification</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Users must verify their email address before accessing the platform.
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('require_email_verification')}
                  disabled={saving}
                  role="switch"
                  aria-checked={settings?.require_email_verification ?? false}
                  aria-label="Require Email Verification"
                  data-testid="setting-email-verification"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    settings?.require_email_verification ? 'bg-primary' : 'bg-muted'
                  } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings?.require_email_verification ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {!settings?.allow_public_registration && (
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start">
                  <Icon
                    name="InformationCircleIcon"
                    size={20}
                    className="text-warning mr-2 mt-0.5"
                  />
                  <div>
                    <p className="text-sm text-warning font-medium">Invite-Only Mode Active</p>
                    <p className="text-sm text-text-secondary mt-1">
                      New users can only register if they have received an invitation from an
                      existing user.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Storage Maintenance Section */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6 elevation-1">
            <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center">
              <Icon name="ServerStackIcon" size={24} className="mr-2 text-primary" />
              Storage Maintenance
            </h2>

            <div className="space-y-6">
              {/* Orphan Files Scanner */}
              <div className="p-4 bg-surface rounded-lg border border-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-text-primary">Orphan Files Cleanup</h3>
                    <p className="text-sm text-text-secondary mt-1">
                      Find and remove kiosk slide files that are no longer linked to any slide.
                      These can occur when uploads are interrupted or slides are deleted.
                    </p>
                  </div>
                </div>

                {/* Time threshold selector */}
                <div className="flex items-center gap-4 mb-4">
                  <label className="text-sm text-text-secondary">
                    Find files orphaned for at least:
                  </label>
                  <select
                    value={orphanMinutes}
                    onChange={(e) => setOrphanMinutes(Number(e.target.value))}
                    className="px-3 py-1.5 text-sm border border-border rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={1440}>24 hours</option>
                    <option value={10080}>7 days</option>
                  </select>
                </div>

                {/* Scan button */}
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={fetchOrphanFiles}
                    disabled={loadingOrphans}
                    className="px-4 py-2 bg-primary text-white rounded-md font-medium text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary transition-colors duration-150 flex items-center gap-2"
                    title="Scan for orphan files"
                  >
                    {loadingOrphans ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Scanning...</span>
                      </>
                    ) : (
                      <>
                        <Icon name="MagnifyingGlassIcon" size={16} />
                        <span>Scan for Orphans</span>
                      </>
                    )}
                  </button>

                  {orphanInfo && orphanInfo.count > 0 && (
                    <button
                      onClick={cleanOrphanFiles}
                      disabled={cleaningOrphans}
                      className="px-4 py-2 bg-red-600 text-white rounded-md font-medium text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600 transition-colors duration-150 flex items-center gap-2"
                      title="Delete all orphan files"
                    >
                      {cleaningOrphans ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Icon name="TrashIcon" size={16} />
                          <span>Delete All Orphans</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Results display */}
                {orphanInfo && (
                  <div className="mt-4">
                    {orphanInfo.count === 0 ? (
                      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center">
                        <Icon name="CheckCircleIcon" size={20} className="text-success mr-2" />
                        <span className="text-sm text-success font-medium">
                          No orphan files found. Storage is clean!
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <div className="flex items-center mb-2">
                            <Icon
                              name="ExclamationTriangleIcon"
                              size={20}
                              className="text-warning mr-2"
                            />
                            <span className="text-sm text-warning font-medium">
                              Found {orphanInfo.count} orphan file(s)
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary">
                            Total size: {orphanInfo.totalSizeMB} MB (
                            {orphanInfo.totalSizeBytes.toLocaleString()} bytes)
                          </p>
                        </div>

                        {/* File list */}
                        <div className="max-h-48 overflow-y-auto border border-border rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-muted sticky top-0">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                  File Path
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                  Type
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                                  Size
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                  Uploaded
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-surface divide-y divide-border">
                              {orphanInfo.orphans.map((file) => (
                                <tr key={file.id} className="hover:bg-muted/50 transition-colors">
                                  <td
                                    className="px-4 py-3 text-text-primary font-mono text-xs truncate max-w-xs"
                                    title={file.storage_path}
                                  >
                                    {file.storage_path}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-text-secondary capitalize">
                                    {file.file_type}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-text-secondary text-right">
                                    {file.file_size
                                      ? `${(file.file_size / 1024).toFixed(1)} KB`
                                      : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-text-secondary">
                                    {new Date(file.created_at).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Info box */}
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex gap-2">
                    <Icon
                      name="InformationCircleIcon"
                      size={18}
                      className="text-gray-600 flex-shrink-0 mt-0.5"
                    />
                    <div className="text-xs text-gray-600">
                      <p className="font-medium mb-1">Tips</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>
                          Orphan files occur when uploads are interrupted before a slide is created
                        </li>
                        <li>
                          Use a longer time threshold to avoid deleting files from in-progress
                          uploads
                        </li>
                        <li>This only affects kiosk slide images, not other storage</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
