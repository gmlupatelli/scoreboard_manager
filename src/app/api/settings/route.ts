import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEFAULT_SETTINGS = {
  id: 'default',
  allow_public_registration: true,
  require_email_verification: true
};

function getAnonClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

function getAuthClient(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    return null;
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function GET() {
  const headers = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  try {
    const supabase = getAnonClient();
    
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error) {
      const serviceClient = getServiceRoleClient();
      if (serviceClient) {
        const { data: serviceData, error: serviceError } = await serviceClient
          .from('system_settings')
          .select('*')
          .eq('id', 'default')
          .single();
        
        if (!serviceError && serviceData) {
          return NextResponse.json(serviceData, { headers });
        }
      }
      return NextResponse.json(DEFAULT_SETTINGS, { headers });
    }

    return NextResponse.json(data, { headers });
  } catch {
    return NextResponse.json(DEFAULT_SETTINGS, { headers });
  }
}

export async function PUT(request: NextRequest) {
  const headers = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401, headers });
    }
    
    const token = authHeader.substring(7);
    const authClient = getAuthClient(token);
    
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    const serviceClient = getServiceRoleClient();
    const dbClient = serviceClient || authClient;
    
    const usingServiceRole = !!serviceClient;
    console.log('[Settings PUT] Using service role client:', usingServiceRole);

    const { data: profile } = await dbClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'system_admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403, headers });
    }

    const body = await request.json();
    const { allow_public_registration, require_email_verification } = body;
    
    console.log('[Settings PUT] Received values:', { allow_public_registration, require_email_verification });

    const { data: existing, error: existingError } = await dbClient
      .from('system_settings')
      .select('id')
      .eq('id', 'default')
      .single();
    
    console.log('[Settings PUT] Existing record:', existing, 'Error:', existingError?.message);

    let result;
    if (existing) {
      console.log('[Settings PUT] Updating existing record...');
      result = await dbClient
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
      console.log('[Settings PUT] Inserting new record...');
      result = await dbClient
        .from('system_settings')
        .insert({
          id: 'default',
          allow_public_registration,
          require_email_verification
        })
        .select()
        .single();
    }

    console.log('[Settings PUT] Result:', result.data, 'Error:', result.error?.message);

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500, headers });
    }

    // Verify the update by reading it back
    const { data: verifyData } = await dbClient
      .from('system_settings')
      .select('*')
      .eq('id', 'default')
      .single();
    
    console.log('[Settings PUT] Verification read:', verifyData);

    return NextResponse.json(result.data, { headers });
  } catch (err) {
    console.error('[Settings PUT] Exception:', err);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500, headers });
  }
}
