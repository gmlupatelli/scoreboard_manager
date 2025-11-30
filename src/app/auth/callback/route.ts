import { createServerClient } from '@supabase/ssr';
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

  // Determine redirect URL first
  let redirectUrl = `${origin}/login?error=auth_callback_error`;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );

  // Handle PKCE flow (login/signup with OAuth or magic link)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirectUrl = `${origin}${next}`;
    }
  }

  // Handle token hash flow (email confirmations)
  // Pass the token to a client-side page that will verify it
  if (token_hash && type) {
    redirectUrl = `${origin}/verify-email?token_hash=${token_hash}&type=${type}`;
  }

  return NextResponse.redirect(redirectUrl);
}
