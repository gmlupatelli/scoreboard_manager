import * as authService from '../authService';

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
    const opts = {
      redirectTo: 'https://example.com/auth/callback',
      queryParams: { access_type: 'offline' },
    };
    await authService.startOAuth('google', opts as any);
    expect(supabase.auth.signInWithOAuth as any).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: opts.redirectTo, queryParams: opts.queryParams },
    });
  });

  it('calls supabase.auth.signInWithIdToken with token and nonce', async () => {
    const token = 'fake-token';
    const nonce = 'nonce';
    await authService.signInWithIdToken(token, nonce);
    expect(supabase.auth.signInWithIdToken as any).toHaveBeenCalledWith({
      provider: 'google',
      token,
      nonce,
    });
  });
});
