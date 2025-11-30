import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Try to get user from Authorization header first (client-side token)
    const authHeader = request.headers.get('Authorization');
    let user: any = null;
    let supabase: any = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      supabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
    } else {
      // Fallback to server-side session cookie
      supabase = await createClient();
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (!authError) {
        user = authUser;
      }
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { error: rpcError } = await supabase.rpc('delete_user_account');
    
    if (rpcError) {
      return NextResponse.json(
        { error: `Failed to delete account data: ${rpcError.message}` },
        { status: 500 }
      );
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
      return NextResponse.json(
        { 
          success: true, 
          warning: 'Account data deleted, but auth user removal requires service role key configuration',
          authDeleted: false 
        },
        { status: 200 }
      );
    }

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteAuthError) {
      return NextResponse.json(
        { 
          success: true, 
          warning: `Account data deleted, but failed to remove auth user: ${deleteAuthError.message}`,
          authDeleted: false 
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account completely deleted',
      authDeleted: true
    });

  } catch {
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
