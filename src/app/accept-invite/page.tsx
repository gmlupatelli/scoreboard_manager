'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useTimeoutRef } from '@/hooks';
import Icon from '@/components/ui/AppIcon';
import Logo from '@/components/ui/Logo';

function AcceptInviteContent() {
  const router = useRouter();
  const { set: setTimeoutSafe, isMounted } = useTimeoutRef();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  // Track if invite flow has been processed to prevent re-runs
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    const handleInviteFlow = async () => {
      try {
        // Check if we have tokens in the URL hash (from Supabase invite email)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const type = hashParams.get('type');

          if (accessToken && refreshToken && type === 'invite') {
            // Set the session using the tokens from the invite link
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (!sessionError) {
              // Clear the hash from URL for cleaner appearance
              window.history.replaceState(null, '', window.location.pathname);
              if (isMounted()) {
                setHasSession(true);
                setCheckingSession(false);
              }
              return;
            }
          }
        }

        // Fallback: check for existing session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (isMounted()) {
          if (session) {
            setHasSession(true);
          }
          setCheckingSession(false);
        }
      } catch (_err) {
        // No session, user needs to set password
        if (isMounted()) {
          setCheckingSession(false);
        }
      }
    };

    handleInviteFlow();
  }, [isMounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: {
          full_name: fullName,
        },
      });

      if (updateError) {
        if (isMounted()) {
          setError(updateError.message);
        }
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        await fetch('/api/invitations/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, fullName: fullName.trim() }),
        });
      }

      if (isMounted()) {
        setSuccess(true);
        setTimeoutSafe(
          () => {
            router.push('/dashboard');
          },
          2000,
          'redirect'
        );
      }
    } catch (_err) {
      if (isMounted()) {
        setError('Failed to set password. Please try again.');
      }
    } finally {
      if (isMounted()) {
        setLoading(false);
      }
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <Logo size={60} />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Invalid Invitation</h1>
            <p className="text-text-secondary">This invitation link is invalid or has expired.</p>
          </div>

          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Icon name="ExclamationTriangleIcon" size={20} className="text-warning mr-2 mt-0.5" />
              <div className="text-sm text-text-secondary">
                <p className="font-medium text-warning">Invitation not found</p>
                <p className="mt-1">
                  Please ask the person who invited you to send a new invitation.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="block w-full text-center px-4 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-smooth"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="CheckCircleIcon" size={40} className="text-success" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Account Created!</h1>
          <p className="text-text-secondary mb-4">
            Your account has been set up successfully. Redirecting to dashboard...
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Logo size={60} />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Complete Your Account</h1>
          <p className="text-text-secondary">
            Set your password to finish setting up your account.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-text-primary mb-2">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-text-primary"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-text-primary"
              placeholder="Create a password"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-text-primary"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-smooth disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                <span>Setting up...</span>
              </>
            ) : (
              <>
                <Icon name="CheckIcon" size={20} />
                <span>Complete Setup</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-text-secondary">Loading...</p>
          </div>
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
