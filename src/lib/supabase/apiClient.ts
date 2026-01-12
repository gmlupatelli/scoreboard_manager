import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client authenticated with a user's JWT token.
 * Use this in API routes when you need to perform actions on behalf of a user.
 * 
 * @param token - The JWT token from the Authorization header
 * @returns A Supabase client configured with the user's token
 */
export function getAuthClient(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

/**
 * Creates a Supabase client with the service role key for admin operations.
 * Use this for operations that need to bypass RLS policies.
 * 
 * @returns A Supabase client with service role privileges, or null if key is not configured
 */
export function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
  
  if (!serviceRoleKey) {
    return null;
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Extracts the JWT token from an Authorization header.
 * 
 * @param authHeader - The Authorization header value
 * @returns The token if valid Bearer format, null otherwise
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
