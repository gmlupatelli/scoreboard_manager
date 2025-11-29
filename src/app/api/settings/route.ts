import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          id: 'default',
          allow_public_registration: true,
          require_email_verification: true
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'system_admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { allow_public_registration, require_email_verification } = body;

    const { data: existing } = await supabase
      .from('system_settings')
      .select('id')
      .eq('id', 'default')
      .single();

    let result;
    if (existing) {
      result = await supabase
        .from('system_settings')
        .update({
          allow_public_registration,
          require_email_verification,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'default')
        .select()
        .single();
    } else {
      result = await supabase
        .from('system_settings')
        .insert({
          id: 'default',
          allow_public_registration,
          require_email_verification
        })
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
