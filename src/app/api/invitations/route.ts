import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    let query = supabase
      .from('invitations')
      .select(`
        *,
        inviter:user_profiles!inviter_id(full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (profile?.role !== 'system_admin') {
      query = query.eq('inviter_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json([]);
      }
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const { data: existingInvite } = await supabase
      .from('invitations')
      .select('id, status')
      .eq('invitee_email', normalizedEmail)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json({ error: 'A pending invitation already exists for this email' }, { status: 400 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      const { data: invitation, error: insertError } = await supabase
        .from('invitations')
        .insert({
          inviter_id: user.id,
          invitee_email: normalizedEmail,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        } as any)
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({
        ...invitation,
        message: 'Invitation created. Email sending requires SUPABASE_SERVICE_ROLE_KEY to be configured.',
        email_sent: false
      });
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || '';
    
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      normalizedEmail,
      {
        redirectTo: `${baseUrl}/accept-invite`,
        data: {
          invited_by: user.id
        }
      }
    );

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    const { data: invitation, error: insertError } = await supabase
      .from('invitations')
      .insert({
        inviter_id: user.id,
        invitee_email: normalizedEmail,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      } as any)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      ...invitation,
      message: 'Invitation sent successfully',
      email_sent: true
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}
