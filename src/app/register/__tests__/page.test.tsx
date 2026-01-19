import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import RegisterPage from '../page';

// Mock fetch for settings
beforeAll(() => {
  // @ts-ignore
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ allow_public_registration: true }) });
});

afterAll(() => {
  // @ts-ignore
  delete global.fetch;
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signUp: vi.fn().mockResolvedValue({ error: null }),
    loading: false,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('Register Page layout', () => {
  it('shows manual form first and Google sign-up button below', async () => {
    const { container } = render(<RegisterPage />);

    // Wait for settings fetch to finish and DOM to stabilize
    await waitFor(() => expect(container.querySelector('input#email')).toBeInTheDocument());

    const createBtn = screen.getByText('Create Account');
    const googleBtn = screen.getByText('Create account with Google');

    // Ensure both buttons exist
    expect(createBtn).toBeInTheDocument();
    expect(googleBtn).toBeInTheDocument();

    // Ensure the Create Account button is before the Google button in the document
    expect(createBtn.compareDocumentPosition(googleBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // Ensure One-Tap is not rendered on register page (script should not be auto-initialized)
    expect(screen.queryByText('Sign in with Google')).not.toBeInTheDocument();
  });
});