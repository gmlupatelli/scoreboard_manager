import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getSupabaseClient(authHeader?: string | null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = getSupabaseClient(authHeader);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isSystemAdmin = profile?.role === 'system_admin';

    const { searchParams } = new URL(request.url);
    const paginated = searchParams.get('paginated') === 'true';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const ownerId = searchParams.get('ownerId') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    if (paginated) {
      let countQuery = supabase
        .from('invitations')
        .select('id', { count: 'exact', head: true });

      let query = supabase
        .from('invitations')
        .select(`
          *,
          inviter:user_profiles!inviter_id(id, full_name, email)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!isSystemAdmin) {
        query = query.eq('inviter_id', user.id);
        countQuery = countQuery.eq('inviter_id', user.id);
      } else {
        if (ownerId) {
          query = query.eq('inviter_id', ownerId);
          countQuery = countQuery.eq('inviter_id', ownerId);
        }
      }

      if (search) {
        query = query.ilike('invitee_email', `%${search}%`);
        countQuery = countQuery.ilike('invitee_email', `%${search}%`);
      }

      if (status) {
        query = query.eq('status', status);
        countQuery = countQuery.eq('status', status);
      }

      const [{ data, error }, { count }] = await Promise.all([
        query,
        countQuery
      ]);

      if (error) {
        if (error.code === '42P01') {
          return NextResponse.json({ data: [], totalCount: 0, page, limit, totalPages: 0 });
        }
        return NextResponse.json({ data: [], totalCount: 0, page, limit, totalPages: 0 });
      }

      return NextResponse.json({
        data: data || [],
        totalCount: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      });
    }

    let query = supabase
      .from('invitations')
      .select(`
        *,
        inviter:user_profiles!inviter_id(full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (!isSystemAdmin) {
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
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = getSupabaseClient(authHeader);
    
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
        })
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

    const adminClient = createClient(
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
      })
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
