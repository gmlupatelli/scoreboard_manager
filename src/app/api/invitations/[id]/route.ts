import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = extractBearerToken(request.headers.get('Authorization'));

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authClient = getAuthClient(token);

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = getServiceRoleClient();
    const dbClient = serviceClient || authClient;

    const { data: profile } = await dbClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isSystemAdmin = profile?.role === 'system_admin';

    const { data: invitation, error: fetchError } = await dbClient
      .from('invitations')
      .select('inviter_id, status, invitee_email')
      .eq('id', id)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    const isOwner = invitation.inviter_id === user.id;
    if (!isOwner && !isSystemAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Can only cancel pending invitations' }, { status: 400 });
    }

    // Delete the Supabase Auth user that was created when the invitation was sent
    if (serviceClient && invitation.invitee_email) {
      try {
        // Find the auth user by email
        const { data: authUsers } = await serviceClient.auth.admin.listUsers();
        const invitedUser = authUsers?.users?.find(
          (u) => u.email?.toLowerCase() === invitation.invitee_email.toLowerCase()
        );

        if (invitedUser) {
          // Delete the auth user
          await serviceClient.auth.admin.deleteUser(invitedUser.id);
        }
      } catch {
        // Continue even if auth user deletion fails - the invitation will still be cancelled
      }
    }

    const { error: updateError } = await dbClient
      .from('invitations')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, authUserDeleted: !!serviceClient });
  } catch {
    return NextResponse.json({ error: 'Failed to cancel invitation' }, { status: 500 });
  }
}
