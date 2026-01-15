import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/orphan-files
 * List orphan files (files in registry without a linked slide)
 * Admin only
 */
export async function GET(request: NextRequest) {
  try {
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

    // Check if user is admin
    const { data: profile } = await authClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'system_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const olderThanMinutes = parseInt(searchParams.get('older_than_minutes') || '60', 10);

    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 });
    }

    // Find orphan files using the helper function
    const { data: orphans, error } = await serviceClient.rpc('find_orphan_kiosk_files', {
      older_than_minutes: olderThanMinutes,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate total size
    const totalSize = (orphans || []).reduce(
      (acc: number, file: { file_size: number | null }) => acc + (file.file_size || 0),
      0
    );

    return NextResponse.json({
      orphans: orphans || [],
      count: orphans?.length || 0,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/orphan-files
 * Delete orphan files from storage and registry
 * Admin only
 */
export async function DELETE(request: NextRequest) {
  try {
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

    // Check if user is admin
    const { data: profile } = await authClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'system_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const olderThanMinutes = parseInt(searchParams.get('older_than_minutes') || '60', 10);
    const dryRun = searchParams.get('dry_run') === 'true';

    // Find orphan files
    const { data: orphans, error } = await serviceClient.rpc('find_orphan_kiosk_files', {
      older_than_minutes: olderThanMinutes,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!orphans || orphans.length === 0) {
      return NextResponse.json({
        message: 'No orphan files found',
        deleted: 0,
        dryRun,
      });
    }

    if (dryRun) {
      return NextResponse.json({
        message: 'Dry run - files that would be deleted',
        wouldDelete: orphans.length,
        files: orphans.map((f: { storage_path: string }) => f.storage_path),
        dryRun: true,
      });
    }

    // Delete files from storage
    const storagePaths = orphans.map((f: { storage_path: string }) => f.storage_path);
    const { error: storageError } = await serviceClient.storage
      .from('kiosk-slides')
      .remove(storagePaths);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue to delete registry entries even if storage deletion fails
    }

    // Delete registry entries
    const orphanIds = orphans.map((f: { id: string }) => f.id);
    const { error: registryError } = await serviceClient
      .from('kiosk_file_registry')
      .delete()
      .in('id', orphanIds);

    if (registryError) {
      return NextResponse.json({ error: registryError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Orphan files deleted successfully',
      deleted: orphans.length,
      storagePaths,
      dryRun: false,
    });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
