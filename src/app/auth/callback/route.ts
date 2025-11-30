import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';

  // Get the correct origin from headers (handles Replit proxy correctly)
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || '';
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  const origin = host ? `${protocol}://${host}` : '';

  const cookieStore = await cookies();
  
  // Create a response that we can add cookies to
  let response = NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Helper to create redirect with cookies
  const redirectWithCookies = (url: string) => {
    const redirectResponse = NextResponse.redirect(url);
    // Copy all cookies from the response to the redirect
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' | undefined,
        maxAge: cookie.maxAge,
      });
    });
    return redirectResponse;
  };

  // Handle PKCE flow (login/signup with OAuth or magic link)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirectWithCookies(`${origin}${next}`);
    }
    return redirectWithCookies(`${origin}/login?error=auth_callback_error`);
  }

  // Handle token hash flow (email confirmations)
  // Note: Password recovery uses ConfirmationURL which bypasses this callback
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'email_change' | 'signup' | 'email'
    });
    
    if (!error) {
      // Redirect to confirmation page with appropriate message
      if (type === 'email_change') {
        return redirectWithCookies(`${origin}/email-confirmed?type=email_change`);
      }
      if (type === 'signup' || type === 'email') {
        return redirectWithCookies(`${origin}/email-confirmed?type=signup`);
      }
      return redirectWithCookies(`${origin}/email-confirmed?type=generic`);
    }
    
    // Handle specific error cases
    return redirectWithCookies(`${origin}/email-confirmed?type=error&error=verification_failed`);
  }

  return redirectWithCookies(`${origin}/login?error=auth_callback_error`);
}
