'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function GoogleSignInButton() {
  const { signInWithOAuth } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithOAuth('google', {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) {
        console.error('OAuth error:', error);
        // Simple feedback for now
        alert(error.message || 'Failed to start Google sign-in');
      }
      // On success the browser will redirect to Google and back to the app
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full px-4 py-3 rounded-md border border-border bg-white text-foreground flex items-center justify-center gap-3 hover:bg-muted/10 transition-colors"
      title="Sign in with Google"
    >
      <svg width="18" height="18" viewBox="0 0 533.5 544.3" className="flex-shrink-0" aria-hidden>
        <path
          fill="#4285F4"
          d="M533.5 278.4c0-18.2-1.5-36.8-4.8-54.4H272v102.8h146.9c-6.3 34.1-25.1 63-53.7 82.3v68.6h86.8c50.8-46.8 80.6-116 80.6-199.3z"
        />
        <path
          fill="#34A853"
          d="M272 544.3c72.8 0 134-23.9 178.6-64.8l-86.8-68.6c-24.1 16.2-55.2 25.7-91.8 25.7-70.6 0-130.4-47.3-152.1-111.2H33.1v69.9C77.2 479.1 168.6 544.3 272 544.3z"
        />
        <path
          fill="#FBBC05"
          d="M119.9 327.4c-10.7-31.8-10.7-66.1 0-97.9V159.6H33.1c-43.3 85.4-43.3 186.6 0 272l86.8-68.6z"
        />
        <path
          fill="#EA4335"
          d="M272 107.1c39.5-.6 76.2 14 104.6 40.9l78.5-78.5C403.7 24.3 344.9-0.3 272 0 168.6 0 77.2 65.2 33.1 159.6l86.8 69.9C141.6 154.4 201.4 107.1 272 107.1z"
        />
      </svg>
      <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
    </button>
  );
}
