import { createClient } from '../../../lib/supabase/server';
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

  const supabase = await createClient();

  // Handle PKCE flow (login/signup with OAuth or magic link)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
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
        return NextResponse.redirect(`${origin}/email-confirmed?type=email_change`);
      }
      if (type === 'signup' || type === 'email') {
        return NextResponse.redirect(`${origin}/email-confirmed?type=signup`);
      }
      return NextResponse.redirect(`${origin}/email-confirmed?type=generic`);
    }
    
    // Handle specific error cases
    return NextResponse.redirect(`${origin}/email-confirmed?type=error&error=verification_failed`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
