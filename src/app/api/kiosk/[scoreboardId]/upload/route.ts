import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, extractBearerToken } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

/**
 * POST /api/kiosk/[scoreboardId]/upload
 * Upload an image file for kiosk slides
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scoreboardId: string }> }
) {
  try {
    const { scoreboardId } = await params;
    const token = extractBearerToken(request.headers.get('Authorization'));

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getAuthClient(token);

    // Verify user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check scoreboard ownership
    const { data: scoreboard, error: scoreboardError } = await supabase
      .from('scoreboards')
      .select('id, owner_id')
      .eq('id', scoreboardId)
      .single();

    if (scoreboardError || !scoreboard) {
      return NextResponse.json({ error: 'Scoreboard not found' }, { status: 404 });
    }

    if (scoreboard.owner_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PNG, JPG, WebP' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${scoreboardId}/${fileName}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('kiosk-slides')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get the public URL
    const { data: urlData } = supabase.storage.from('kiosk-slides').getPublicUrl(filePath);

    return NextResponse.json({
      path: filePath,
      url: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
