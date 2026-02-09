import { NextRequest, NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';
import { getSupporterStatus } from '@/lib/supabase/subscriptionHelpers';
import { Database } from '@/types/database.types';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

// Thumbnail settings
const THUMBNAIL_WIDTH = 320;
const THUMBNAIL_HEIGHT = 180;
const THUMBNAIL_QUALITY = 80;

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

    // Kiosk uploads require a Supporter subscription
    const serviceClient = getServiceRoleClient();
    const readClient = (serviceClient || supabase) as SupabaseClient<Database>;
    const isSupporter = await getSupporterStatus(readClient, user.id);

    if (!isSupporter) {
      return NextResponse.json(
        {
          error: 'limit_reached',
          message: 'Kiosk mode requires a Supporter plan.',
          upgrade_url: '/supporter-plan',
        },
        { status: 403 }
      );
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
    const baseName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const fileName = `${baseName}.${fileExt}`;
    const thumbnailName = `${baseName}_thumb.webp`;
    const filePath = `${user.id}/${scoreboardId}/${fileName}`;
    const thumbnailPath = `${user.id}/${scoreboardId}/${thumbnailName}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate thumbnail using sharp
    let thumbnailBuffer: Buffer;
    try {
      thumbnailBuffer = await sharp(buffer)
        .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: THUMBNAIL_QUALITY })
        .toBuffer();
    } catch (thumbError) {
      console.error('Thumbnail generation error:', thumbError);
      return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
    }

    // Upload original to Supabase Storage
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

    // Upload thumbnail to Supabase Storage
    const { error: thumbUploadError } = await supabase.storage
      .from('kiosk-slides')
      .upload(thumbnailPath, thumbnailBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false,
      });

    if (thumbUploadError) {
      console.error('Thumbnail upload error:', thumbUploadError);
      // Clean up the original file if thumbnail upload fails
      await supabase.storage.from('kiosk-slides').remove([filePath]);
      return NextResponse.json({ error: 'Failed to upload thumbnail' }, { status: 500 });
    }

    // Register files in the file registry for orphan tracking
    // Note: slide_id will be set when the slide is created
    await supabase.from('kiosk_file_registry').insert([
      {
        storage_path: filePath,
        file_type: 'original',
        user_id: user.id,
        scoreboard_id: scoreboardId,
        file_size: file.size,
      },
      {
        storage_path: thumbnailPath,
        file_type: 'thumbnail',
        user_id: user.id,
        scoreboard_id: scoreboardId,
        file_size: thumbnailBuffer.length,
      },
    ]);

    // Return both paths
    return NextResponse.json(
      {
        path: filePath,
        url: filePath, // Store the path for the original
        thumbnailPath: thumbnailPath,
        thumbnailUrl: thumbnailPath, // Store the thumbnail path
        fileName: file.name,
        fileSize: file.size,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
