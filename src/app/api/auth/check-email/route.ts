import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Check if an email address is already registered.
 * Uses service role client to query user_profiles table.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      // If no service client, we can't check - allow signup to proceed
      // Supabase will handle duplicate email error
      return NextResponse.json({ exists: false });
    }

    // Check if email exists in user_profiles
    const { data, error } = await serviceClient
      .from('user_profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error('Error checking email:', error);
      // If there's an error, allow signup to proceed
      // Supabase will handle duplicate email error
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({ exists: !!data });
  } catch (error) {
    console.error('Check email error:', error);
    return NextResponse.json({ exists: false });
  }
}
