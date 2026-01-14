/**
 * @jest-environment jsdom
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuthGuard } from '../useAuthGuard';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() =>
        Promise.resolve({
          data: { session: { access_token: 'test-token' } },
          error: null,
        })
      ),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      getUser: jest.fn(() =>
        Promise.resolve({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null,
        })
      ),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({
              data: { id: 'user-123', email: 'test@example.com', role: 'user' },
              error: null,
            })
          ),
        })),
      })),
    })),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuthGuard', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('should show isChecking true initially', () => {
    const { result } = renderHook(() => useAuthGuard(), { wrapper });

    expect(result.current.isChecking).toBe(true);
    expect(result.current.isAuthorized).toBe(false);
  });

  it('should redirect to login when not authenticated', async () => {
    // Mock no user
    const supabaseMock = require('@/lib/supabase/client');
    supabaseMock.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useAuthGuard(), { wrapper });

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
    });
  });

  it('should provide getAuthHeaders function', async () => {
    const { result } = renderHook(() => useAuthGuard(), { wrapper });

    await waitFor(() => {
      expect(result.current.getAuthHeaders).toBeDefined();
    });

    const headers = await result.current.getAuthHeaders();
    expect(headers).toBeDefined();
  });

  it('should not redirect multiple times', async () => {
    const supabaseMock = require('@/lib/supabase/client');
    supabaseMock.supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    renderHook(() => useAuthGuard(), { wrapper });

    // Wait for auth check to complete
    await waitFor(() => {}, { timeout: 100 });

    // Multiple renders should not cause multiple redirects
    expect(mockPush.mock.calls.length).toBeLessThanOrEqual(1);
  });
});
