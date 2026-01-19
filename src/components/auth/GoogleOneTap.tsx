'use client';

import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { generateNonce } from '@/utils/auth/googleOneTap';

// Types for Google One-Tap (minimal)
type CredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (opts: {
            client_id: string;
            callback: (response: CredentialResponse) => void;
            nonce?: string;
            auto_select?: boolean;
            itp_support?: boolean;
            use_fedcm_for_prompt?: boolean;
            [key: string]: unknown;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function GoogleOneTap() {
  const router = useRouter();
  const { signInWithIdToken } = useAuth();

  // Respect the enable flag
  const enabled =
    process.env.NEXT_PUBLIC_ENABLE_GOOGLE_ONE_TAP === 'true' &&
    Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
  if (!enabled) return null;

  const initializeOneTap = async () => {
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) return;

      // Skip if already logged in
      const { data } = await supabase.auth.getSession();
      if (data?.session) return;

      // Generate nonce pair
      const [nonce, hashedNonce] = await generateNonce();

      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: CredentialResponse) => {
          try {
            if (!response?.credential) return;
            const { error } = await signInWithIdToken(response.credential, nonce);
            if (error) throw error;
            router.push('/dashboard');
          } catch (err) {
            console.error('One Tap sign-in failed', err);
          }
        },
        nonce: hashedNonce,
        auto_select: false,
        itp_support: true,
        use_fedcm_for_prompt: true,
      });

      window.google.accounts.id.prompt();
    } catch (err) {
      console.error('Error initializing Google One Tap', err);
    }
  };

  // Load Google script and initialize when ready
  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      onReady={() => {
        initializeOneTap().catch((err) => console.error(err));
      }}
    />
  );
}
