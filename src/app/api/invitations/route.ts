import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('Authorization'));
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const authClient = getAuthClient(token);
    
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = getServiceRoleClient();

    const { data: profile } = serviceClient 
      ? await serviceClient.from('user_profiles').select('role').eq('id', user.id).single()
      : await authClient.from('user_profiles').select('role').eq('id', user.id).single();

    const isSystemAdmin = profile?.role === 'system_admin';

    const { searchParams } = new URL(request.url);
    const paginated = searchParams.get('paginated') === 'true';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const ownerId = searchParams.get('ownerId') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    const dbClient = (isSystemAdmin && serviceClient) ? serviceClient : authClient;

    if (paginated) {
      let countQuery = dbClient
        .from('invitations')
        .select('id', { count: 'exact', head: true });

      let query = dbClient
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
        if (serviceClient && !isSystemAdmin) {
          const fallbackQuery = serviceClient
            .from('invitations')
            .select(`*, inviter:user_profiles!inviter_id(id, full_name, email)`)
            .eq('inviter_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
          
          const [fallbackResult, fallbackCount] = await Promise.all([
            fallbackQuery,
            serviceClient.from('invitations').select('id', { count: 'exact', head: true }).eq('inviter_id', user.id)
          ]);
          
          if (!fallbackResult.error) {
            return NextResponse.json({
              data: fallbackResult.data || [],
              totalCount: fallbackCount.count || 0,
              page,
              limit,
              totalPages: Math.ceil((fallbackCount.count || 0) / limit)
            });
          }
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

    let query = dbClient
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
      if (serviceClient && !isSystemAdmin) {
        const fallbackResult = await serviceClient
          .from('invitations')
          .select(`*, inviter:user_profiles!inviter_id(full_name, email)`)
          .eq('inviter_id', user.id)
          .order('created_at', { ascending: false });
        
        if (!fallbackResult.error) {
          return NextResponse.json(fallbackResult.data || []);
        }
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
    const token = extractBearerToken(request.headers.get('Authorization'));
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const authClient = getAuthClient(token);
    
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = getServiceRoleClient();

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const checkClient = serviceClient || authClient;
    
    const { data: existingUser } = await checkClient
      .from('user_profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const { data: existingInvite } = await checkClient
      .from('invitations')
      .select('id, status')
      .eq('invitee_email', normalizedEmail)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json({ error: 'A pending invitation already exists for this email' }, { status: 400 });
    }

    if (!serviceClient) {
      const { data: invitation, error: insertError } = await authClient
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
        message: 'Invitation created. Email sending requires SUPABASE_SECRET_KEY to be configured.',
        email_sent: false
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || '';
    
    // Redirect directly to accept-invite - the page handles hash fragment tokens from invite emails
    const { error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(
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

    const { data: invitation, error: insertError } = await serviceClient
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
  } catch {
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}
