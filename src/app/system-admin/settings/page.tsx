'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
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

export default function SystemAdminSettingsPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { 'Authorization': `Bearer ${session.access_token}` };
    }
    return {};
  };

  const fetchSettings = useCallback(async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch('/api/settings', {
        credentials: 'include',
        headers: authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (err) {
      setError('Failed to load settings');
    }
  }, []);

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
      
      fetchSettings().finally(() => {
        setLoading(false);
      });
    }
  }, [user, userProfile, authLoading, router, fetchSettings]);

  const handleToggle = async (field: 'allow_public_registration' | 'require_email_verification') => {
    if (!settings) return;
    
    setSaving(true);
    setError('');
    setSuccess('');

    const newValue = !settings[field];

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...authHeaders
        },
        credentials: 'include',
        body: JSON.stringify({
          ...settings,
          [field]: newValue
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setSuccess('Settings updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update settings');
      }
    } catch (err) {
      setError('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
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
              <p className="text-text-secondary mt-1">Manage application-wide configuration</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/invitations"
                className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150"
              >
                <Icon name="EnvelopeIcon" size={18} />
                <span>Invitations</span>
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth duration-150"
              >
                <Icon name="ArrowLeftIcon" size={18} />
                <span>Back to Dashboard</span>
              </Link>
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

          <div className="bg-card border border-border rounded-lg p-6 mb-6 elevation-1">
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
              <div className="mt-6 p-4 bg-warning/10 border border-warning/30 rounded-lg">
                <div className="flex items-start">
                  <Icon name="InformationCircleIcon" size={20} className="text-warning mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-warning font-medium">Invite-Only Mode Active</p>
                    <p className="text-sm text-text-secondary mt-1">
                      New users can only register if they have received an invitation from an existing user.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
