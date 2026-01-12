'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

type UserRole = 'system_admin' | 'user';

interface UseAuthGuardOptions {
  /** Required role to access the page. If not specified, any authenticated user is allowed. */
  requiredRole?: UserRole;
  /** Path to redirect to if user is not authenticated. Defaults to '/login'. */
  redirectTo?: string;
  /** Path to redirect to if user lacks required role. Defaults to '/dashboard'. */
  unauthorizedRedirectTo?: string;
}

interface UseAuthGuardResult {
  /** Whether the user is authorized to access the page */
  isAuthorized: boolean;
  /** Whether auth check is still in progress */
  isChecking: boolean;
  /** The authenticated user (null if not authenticated) */
  user: ReturnType<typeof useAuth>['user'];
  /** The user's profile with role information */
  userProfile: ReturnType<typeof useAuth>['userProfile'];
  /** Helper to get authorization headers for API calls */
  getAuthHeaders: () => Promise<Record<string, string>>;
}

/**
 * Hook for guarding pages that require authentication and/or specific roles.
 * Handles auth state race conditions and prevents redirect loops.
 *
 * @example
 * // Basic auth guard (any authenticated user)
 * const { isAuthorized, isChecking } = useAuthGuard();
 *
 * @example
 * // Admin-only page
 * const { isAuthorized, isChecking } = useAuthGuard({ requiredRole: 'system_admin' });
 *
 * @example
 * // Custom redirect paths
 * const { isAuthorized, isChecking } = useAuthGuard({
 *   redirectTo: '/login',
 *   unauthorizedRedirectTo: '/dashboard'
 * });
 */
export function useAuthGuard(options: UseAuthGuardOptions = {}): UseAuthGuardResult {
  const { requiredRole, redirectTo = '/login', unauthorizedRedirectTo = '/dashboard' } = options;

  const router = useRouter();
  const { user, userProfile, loading: authLoading, session } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Prevent multiple redirects
  const hasRedirectedRef = useRef(false);
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Helper to get auth headers for API calls
  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
    return {};
  }, [session?.access_token]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // Prevent multiple redirects
    if (hasRedirectedRef.current) {
      return;
    }

    // Not authenticated - redirect to login
    if (!user) {
      hasRedirectedRef.current = true;
      router.push(redirectTo);
      return;
    }

    // Check role if required
    if (requiredRole) {
      // Wait for profile to load if we need role check
      if (!userProfile) {
        // Profile still loading, don't make a decision yet
        return;
      }

      if (userProfile.role !== requiredRole) {
        hasRedirectedRef.current = true;
        router.push(unauthorizedRedirectTo);
        return;
      }
    }

    // User is authorized
    if (isMountedRef.current) {
      setIsAuthorized(true);
      setIsChecking(false);
    }
  }, [user, userProfile, authLoading, router, redirectTo, unauthorizedRedirectTo, requiredRole]);

  return {
    isAuthorized,
    isChecking: authLoading || isChecking,
    user,
    userProfile,
    getAuthHeaders,
  };
}
