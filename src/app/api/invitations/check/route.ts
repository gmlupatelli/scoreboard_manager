import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createClient();
    const normalizedEmail = email.toLowerCase().trim();

    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('id, expires_at')
      .eq('invitee_email', normalizedEmail)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) {
      return NextResponse.json({ 
        has_valid_invitation: false,
        invitation_id: null
      });
    }

    return NextResponse.json({ 
      has_valid_invitation: !!invitation,
      invitation_id: invitation?.id || null
    });
  } catch {
    return NextResponse.json({ 
      has_valid_invitation: false,
      invitation_id: null
    });
  }
}
