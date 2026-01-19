import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import GoogleSignInButton from '../GoogleSignInButton';

const signInWithIdToken = vi.fn().mockResolvedValue({ error: null });
const signInWithOAuth = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signInWithIdToken,
    signInWithOAuth,
  }),
}));

// Mock router
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock nonce generator
vi.mock('@/utils/auth/googleOneTap', () => ({
  generateNonce: vi.fn().mockResolvedValue(['test-nonce', 'hashed-test-nonce']),
}));

beforeAll(() => {
  // JSDOM does not implement alert by default
  // @ts-ignore
  global.alert = vi.fn();
});

afterEach(() => {
  vi.resetAllMocks();
  // Clear any global google state
  // @ts-ignore
  delete window.google;
});

describe('GoogleSignInButton', () => {
  it('uses GSI to get an ID token and calls signInWithIdToken', async () => {
    // Ensure client id is present so the GSI path is chosen
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-client-id';

    // @ts-ignore
    window.google = {
      accounts: {
        id: {
          initialize: vi
            .fn()
            .mockImplementation((opts: { callback: (resp: { credential?: string }) => void }) => {
              // Invoke the callback synchronously as if the user completed sign-in
              opts.callback({ credential: 'fake-id-token' });
            }),
          prompt: vi.fn(),
        },
      },
    };

    const { getByText } = render(<GoogleSignInButton />);

    const btn = getByText('Sign in with Google');
    fireEvent.click(btn);

    // wait for signInWithIdToken to be called via the callback
    await waitFor(() => {
      expect(signInWithIdToken).toHaveBeenCalledWith('fake-id-token', 'test-nonce');
    });

    // ensure prompt was called
    expect(window.google.accounts.id.prompt).toHaveBeenCalled();
  });

  it('falls back to signInWithOAuth when GSI not available', async () => {
    // ensure no window.google and no client id
    // @ts-ignore
    delete window.google;
    // @ts-ignore
    delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    const { getByText } = render(<GoogleSignInButton />);

    const btn = getByText('Sign in with Google');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(signInWithOAuth).toHaveBeenCalled();
    });
  });
});
