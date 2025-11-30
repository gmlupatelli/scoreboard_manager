import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

  const debugInfo: string[] = [];

  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401, headers });
    }
    
    const token = authHeader.substring(7);
    const authClient = getAuthClient(token);
    
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        debug: authError?.message || 'No user found'
      }, { status: 401, headers });
    }

    debugInfo.push(`User authenticated: ${user.id}`);

    const serviceClient = getServiceRoleClient();
    const hasServiceRole = !!serviceClient;
    debugInfo.push(`Service role available: ${hasServiceRole}`);
    
    const dbClient = serviceClient || authClient;

    const { data: profile, error: profileError } = await dbClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      debugInfo.push(`Profile fetch error: ${profileError.message}`);
    }

    if (!profile || profile.role !== 'system_admin') {
      return NextResponse.json({ 
        error: 'Forbidden - Admin access required',
        debug: debugInfo.join('; '),
        profileFound: !!profile,
        role: profile?.role
      }, { status: 403, headers });
    }

    debugInfo.push(`Profile role: ${profile.role}`);

    const body = await request.json();
    const { allow_public_registration, require_email_verification } = body;

    debugInfo.push(`Updating: public_reg=${allow_public_registration}, email_verify=${require_email_verification}`);

    const { data: existing, error: existingError } = await dbClient
      .from('system_settings')
      .select('id')
      .eq('id', 'default')
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      debugInfo.push(`Existing check error: ${existingError.message}`);
    }

    let result;
    if (existing) {
      debugInfo.push('Updating existing settings');
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
      debugInfo.push('Inserting new settings');
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

    if (result.error) {
      return NextResponse.json({ 
        error: result.error.message,
        debug: debugInfo.join('; '),
        errorCode: result.error.code
      }, { status: 500, headers });
    }

    return NextResponse.json(result.data, { headers });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Failed to update settings', 
      debug: debugInfo.join('; '),
      exception: errorMessage
    }, { status: 500, headers });
  }
}
