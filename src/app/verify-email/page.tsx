'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Logo from '@/components/ui/Logo';
import Icon from '@/components/ui/AppIcon';
import { profileService } from '@/services/profileService';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [isEmailChange, setIsEmailChange] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      setIsEmailChange(type === 'email_change');

      if (!token_hash || !type) {
        setStatus('error');
        setErrorMessage('Invalid verification link');
        return;
      }

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as 'email_change' | 'signup' | 'email'
      });

      if (error) {
        setStatus('error');
        // Provide more helpful error messages
        if (error.message.includes('expired')) {
          setErrorMessage('This verification link has expired. Please request a new one.');
        } else if (error.message.includes('invalid') || error.message.includes('Invalid')) {
          setErrorMessage('This verification link is invalid or has already been used.');
        } else {
          setErrorMessage(error.message || 'Verification failed. Please try again.');
        }
        return;
      }

      // Get the verified user
      const { data: userData } = await supabase.auth.getUser();

      if (type === 'email_change') {
        // Sync the new email to user_profiles
        if (userData?.user?.id && userData?.user?.email) {
          await profileService.syncProfileEmail(userData.user.id, userData.user.email);
        }
      } else if (type === 'signup' || type === 'email') {
        // Ensure user profile exists after signup verification
        if (userData?.user) {
          await profileService.ensureProfileExists(userData.user);
        }
      }

      // Refresh the session to get fresh tokens with updated user data
      await supabase.auth.refreshSession();

      setStatus('success');

      // Redirect after a brief delay
      setTimeout(() => {
        if (type === 'email_change') {
          router.push('/user-profile-management');
        } else {
          router.push('/dashboard');
        }
      }, 2000);
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-lg p-8 text-center shadow-sm">
        <div className="flex justify-center mb-6">
          <Logo size={60} />
        </div>

        {status === 'verifying' && (
          <>
            <div className="mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-4">
              Verifying your email...
            </h1>
            <p className="text-text-secondary">
              Please wait while we confirm your email address.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-6">
              <Icon name="CheckCircleIcon" size={64} className="mx-auto text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-4">
              Email Verified!
            </h1>
            <p className="text-text-secondary mb-4">
              Your email has been confirmed successfully.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-6">
              <Icon name="ExclamationCircleIcon" size={64} className="mx-auto text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-4">
              Verification Failed
            </h1>
            <p className="text-text-secondary mb-6">
              {errorMessage || 'The verification link may have expired or already been used.'}
            </p>
            {isEmailChange ? (
              <div className="space-y-3">
                <p className="text-sm text-text-secondary">
                  You can request a new verification email from your profile settings.
                </p>
                <button
                  onClick={() => router.push('/user-profile-management')}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth"
                >
                  Go to Profile Settings
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth"
              >
                Go to Login
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
