'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTimeoutRef } from '@/hooks';
import Header from '@/components/common/Header';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import GoogleOneTap from '@/components/auth/GoogleOneTap';
import Icon from '@/components/ui/AppIcon';

interface SystemSettings {
  allow_public_registration: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, loading: authLoading } = useAuth();
  const { set: setTimeoutSafe, isMounted } = useTimeoutRef();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSettings, setCheckingSettings] = useState(true);
  const [isPublicRegistrationAllowed, setIsPublicRegistrationAllowed] = useState(true);
  const [hasValidInvitation, setHasValidInvitation] = useState(false);
  const [checkingInvitation, setCheckingInvitation] = useState(false);

  useEffect(() => {
    const checkSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settings: SystemSettings = await response.json();
          setIsPublicRegistrationAllowed(settings.allow_public_registration);
        }
      } catch (_err) {
        setIsPublicRegistrationAllowed(true);
      } finally {
        setCheckingSettings(false);
      }
    };

    checkSettings();
  }, []);

  const checkInvitation = async (emailToCheck: string) => {
    if (!emailToCheck) return;

    setCheckingInvitation(true);
    try {
      const response = await fetch(
        `/api/invitations/check?email=${encodeURIComponent(emailToCheck)}`
      );
      if (response.ok) {
        const data = await response.json();
        setHasValidInvitation(data.has_valid_invitation);
        if (data.has_valid_invitation) {
          setError('');
        }
      }
    } catch (_err) {
      // Silently fail
    } finally {
      setCheckingInvitation(false);
    }
  };

  useEffect(() => {
    if (!isPublicRegistrationAllowed && email) {
      const timeoutId = setTimeout(() => {
        checkInvitation(email);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [email, isPublicRegistrationAllowed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPublicRegistrationAllowed && !hasValidInvitation) {
      setError('Registration is currently by invitation only. Please use a valid invitation link.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setError(error.message);
      } else {
        if (hasValidInvitation) {
          await fetch('/api/invitations/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.toLowerCase().trim() }),
          });
        }
        setSuccess(true);
        setTimeoutSafe(
          () => {
            router.push('/login');
          },
          2000,
          'redirect'
        );
      }
    } catch (_err) {
      if (isMounted()) {
        setError('An unexpected error occurred');
      }
    } finally {
      if (isMounted()) {
        setLoading(false);
      }
    }
  };

  if (authLoading || checkingSettings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <>
        <Header isAuthenticated={false} />
        <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-20">
          <div className="w-full max-w-md">
            <div className="bg-card border border-border rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Account Created!</h2>
              <p className="text-muted-foreground">Redirecting you to login...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header isAuthenticated={false} />
      {process.env.NEXT_PUBLIC_ENABLE_GOOGLE_ONE_TAP === 'true' &&
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && <GoogleOneTap />}
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-center mb-2 text-foreground">Create Account</h1>
            <p className="text-center text-muted-foreground mb-8">
              Start managing your scoreboards today
            </p>

            {(isPublicRegistrationAllowed || hasValidInvitation) && (
              <>
                <div className="mb-4">
                  <div className="flex items-center gap-3">
                    <hr className="flex-1 border-border" />
                    <div className="text-sm text-muted-foreground">or</div>
                    <hr className="flex-1 border-border" />
                  </div>
                  <div className="mt-4">
                    <GoogleSignInButton />
                  </div>
                </div>
              </>
            )}

            {!isPublicRegistrationAllowed && !hasValidInvitation && (
              <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start">
                  <Icon
                    name="InformationCircleIcon"
                    size={20}
                    className="text-warning mr-2 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-warning">Invite-Only Registration</p>
                    <p className="text-sm text-text-secondary mt-1">
                      Registration is currently restricted to invited users. Please use the
                      invitation link sent to your email.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-destructive text-destructive px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            {!isPublicRegistrationAllowed && hasValidInvitation && (
              <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-start">
                  <Icon name="CheckCircleIcon" size={20} className="text-success mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-success">Valid Invitation Found</p>
                    <p className="text-sm text-text-secondary mt-1">
                      You have a pending invitation. Complete the form below to create your account.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Show all fields only if public registration is allowed OR user has valid invitation */}
              {(isPublicRegistrationAllowed || hasValidInvitation) && (
                <>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                        placeholder="you@example.com"
                      />
                      {checkingInvitation && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || (!isPublicRegistrationAllowed && !hasValidInvitation)}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    title="Create your account"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </>
              )}
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
