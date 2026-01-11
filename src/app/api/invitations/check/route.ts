import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getAnonClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = getAnonClient();
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
      invitation_id: invitation ? (invitation as { id: string }).id : null
    });
  } catch {
    return NextResponse.json({ 
      has_valid_invitation: false,
      invitation_id: null
    });
  }
}
