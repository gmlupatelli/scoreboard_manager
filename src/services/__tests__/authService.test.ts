import * as authService from '../authService';
import type { Mock } from 'vitest';

vi.mock('@/lib/supabase/client', () => {
  return {
    supabase: {
      auth: {
        signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
        signInWithIdToken: vi.fn().mockResolvedValue({ error: null }),
      },
    },
  };
});

import { supabase } from '@/lib/supabase/client';

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls supabase.auth.signInWithOAuth with provider and options', async () => {
    const opts: { redirectTo: string; queryParams: Record<string, string> } = {
      redirectTo: 'https://example.com/auth/callback',
      queryParams: { access_type: 'offline' },
    };
    await authService.startOAuth('google', opts);
    expect(supabase.auth.signInWithOAuth as Mock).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: opts.redirectTo, queryParams: opts.queryParams },
    });
  });

  it('calls supabase.auth.signInWithIdToken with token and nonce', async () => {
    const token = 'fake-token';
    const nonce = 'nonce';
    await authService.signInWithIdToken(token, nonce);
    expect(supabase.auth.signInWithIdToken as Mock).toHaveBeenCalledWith({
      provider: 'google',
      token,
      nonce,
    });
  });
});
