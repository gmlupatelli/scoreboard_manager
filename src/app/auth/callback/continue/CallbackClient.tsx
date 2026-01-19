'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';

export default function CallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleFragment = async () => {
      try {
        // Parse fragment tokens (if present)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            // Set the session using the tokens from the URL hash
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (!sessionError) {
              // Clean up the URL (remove hash and query error)
              const next = searchParams.get('next') ?? '/dashboard';
              window.history.replaceState(null, '', next);
              router.push(next);
              return;
            } else {
              setMessage(sessionError.message || 'Failed to set session from OAuth response.');
            }
          }
        }

        // No fragment tokens found — check for an error query param and show it
        const error = searchParams.get('error');
        if (error) {
          setMessage('OAuth callback error. Please try again.');
        } else {
          setMessage('No authentication data found in the URL. Please try signing in again.');
        }
      } catch (_err) {
        setMessage('An unexpected error occurred while processing the OAuth callback.');
      } finally {
        setLoading(false);
      }
    };

    handleFragment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <Icon name="ArrowPathIcon" size={48} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Processing sign-in…</h1>
        <p className="text-text-secondary mb-6">
          We are finalizing your sign-in.
          <br />
          This may take a moment.
        </p>

        {loading && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        )}

        {message && (
          <div className="bg-red-500/10 border border-destructive text-destructive px-4 py-3 rounded-md">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
