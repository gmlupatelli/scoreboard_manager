import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables in middleware:', {
      url: supabaseUrl ? 'present' : 'missing',
      key: supabaseKey ? 'present' : 'missing',
    });
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refreshing the auth token
  await supabase.auth.getUser();

  // Set headers to allow iframe embedding in VS Code Simple Browser (dev mode)
  // In production, these are set via next.config.mjs headers()
  if (process.env.NODE_ENV === 'development') {
    // Permissive CSP for local development only
    // NOTE: Omit frame-ancestors entirely to allow VS Code Simple Browser
    // (Electron bug: frame-ancestors * doesn't work with vscode-webview:// scheme)
    supabaseResponse.headers.set(
      'Content-Security-Policy',
      "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:"
    );
    // Remove X-Frame-Options to allow framing
    supabaseResponse.headers.delete('X-Frame-Options');
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
