import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fullName } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Service configuration error' }, { status: 500 });
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const normalizedEmail = email.toLowerCase().trim();

    // Update invitation status
    const { error: invitationError } = await adminClient
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('invitee_email', normalizedEmail)
      .eq('status', 'pending');

    if (invitationError) {
      return NextResponse.json({ error: invitationError.message }, { status: 500 });
    }

    // Update user_profiles with full_name if provided
    if (fullName) {
      const { error: profileError } = await adminClient
        .from('user_profiles')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString()
        })
        .eq('email', normalizedEmail);

      if (profileError) {
        // Log but don't fail - the invitation was already accepted
        console.error('Failed to update user profile:', profileError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}
