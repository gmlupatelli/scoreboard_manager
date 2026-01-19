import { supabase } from '@/lib/supabase/client';

export async function startOAuth(
  provider: 'google',
  options?: { redirectTo?: string; queryParams?: Record<string, string> }
) {
  return await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: options?.redirectTo, queryParams: options?.queryParams },
  });
}

export async function signInWithIdToken(token: string, nonce?: string) {
  return await supabase.auth.signInWithIdToken({ provider: 'google', token, nonce });
}
