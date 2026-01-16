import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

type KioskSlideRow = Database['public']['Tables']['kiosk_slides']['Row'];
type KioskConfigRow = Database['public']['Tables']['kiosk_configs']['Row'];

export interface KioskSlide {
  id: string;
  kioskConfigId: string;
  slideType: 'image' | 'scoreboard';
  position: number;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  durationOverrideSeconds: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface KioskConfig {
  id: string;
  scoreboardId: string;
  enabled: boolean;
  slideDurationSeconds: number;
  scoreboardPosition: number;
  pinCode: string | null;
  createdAt: string;
  updatedAt: string;
}

const SIGNED_URL_EXPIRY_SECONDS = 3600;

// Transform database row to application model
const rowToSlide = (row: KioskSlideRow): KioskSlide => ({
  id: row.id,
  kioskConfigId: row.kiosk_config_id,
  slideType: row.slide_type as 'image' | 'scoreboard',
  position: row.position,
  imageUrl: row.image_url,
  thumbnailUrl: row.thumbnail_url,
  durationOverrideSeconds: row.duration_override_seconds,
  createdAt: row.created_at,
  updatedAt: row.created_at, // kiosk_slides doesn't have updated_at
});

const rowToConfig = (row: KioskConfigRow): KioskConfig => ({
  id: row.id,
  scoreboardId: row.scoreboard_id,
  enabled: row.enabled,
  slideDurationSeconds: row.slide_duration_seconds,
  scoreboardPosition: row.scoreboard_position,
  pinCode: row.pin_code,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Get signed URL for a storage path
 */
async function getSignedUrl(path: string): Promise<string | null> {
  if (!path || path.startsWith('http')) {
    return path;
  }

  const { data, error } = await supabase.storage
    .from('kiosk-slides')
    .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);

  if (error) {
    console.error('Failed to get signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

export const kioskService = {
  /**
   * Get kiosk config for a scoreboard
   */
  async getConfig(scoreboardId: string): Promise<{ data: KioskConfig | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('kiosk_configs')
        .select('*')
        .eq('scoreboard_id', scoreboardId)
        .maybeSingle();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data ? rowToConfig(data) : null, error: null };
    } catch (_error) {
      return { data: null, error: 'Failed to load kiosk config' };
    }
  },

  /**
   * Create or update kiosk config
   */
  async upsertConfig(
    scoreboardId: string,
    config: Partial<{
      enabled: boolean;
      slideDurationSeconds: number;
      scoreboardPosition: number;
      pinCode: string | null;
    }>
  ): Promise<{ data: KioskConfig | null; error: string | null }> {
    try {
      // Check if config exists
      const { data: existing } = await supabase
        .from('kiosk_configs')
        .select('id')
        .eq('scoreboard_id', scoreboardId)
        .maybeSingle();

      const updateData: Record<string, unknown> = {};
      if (config.enabled !== undefined) updateData.enabled = config.enabled;
      if (config.slideDurationSeconds !== undefined) updateData.slide_duration_seconds = config.slideDurationSeconds;
      if (config.scoreboardPosition !== undefined) updateData.scoreboard_position = config.scoreboardPosition;
      if (config.pinCode !== undefined) updateData.pin_code = config.pinCode;

      let result;
      if (existing) {
        result = await supabase
          .from('kiosk_configs')
          .update(updateData)
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('kiosk_configs')
          .insert({
            scoreboard_id: scoreboardId,
            enabled: config.enabled ?? false,
            slide_duration_seconds: config.slideDurationSeconds ?? 10,
            scoreboard_position: config.scoreboardPosition ?? 0,
            pin_code: config.pinCode ?? null,
          })
          .select()
          .single();
      }

      if (result.error) {
        return { data: null, error: result.error.message };
      }

      return { data: rowToConfig(result.data), error: null };
    } catch (_error) {
      return { data: null, error: 'Failed to save kiosk config' };
    }
  },

  /**
   * Get slides for a scoreboard's kiosk config
   */
  async getSlides(scoreboardId: string): Promise<{ data: KioskSlide[] | null; error: string | null }> {
    try {
      // First get the kiosk config
      const { data: config } = await supabase
        .from('kiosk_configs')
        .select('id')
        .eq('scoreboard_id', scoreboardId)
        .maybeSingle();

      if (!config) {
        return { data: [], error: null };
      }

      const { data, error } = await supabase
        .from('kiosk_slides')
        .select('*')
        .eq('kiosk_config_id', config.id)
        .order('position', { ascending: true });

      if (error) {
        return { data: null, error: error.message };
      }

      // Transform and add signed URLs
      const slides = await Promise.all(
        (data || []).map(async (row) => {
          const slide = rowToSlide(row);
          if (slide.slideType === 'image') {
            slide.thumbnailUrl = await getSignedUrl(slide.thumbnailUrl || '');
            slide.imageUrl = await getSignedUrl(slide.imageUrl || '');
          }
          return slide;
        })
      );

      return { data: slides, error: null };
    } catch (_error) {
      return { data: null, error: 'Failed to load slides' };
    }
  },

  /**
   * Create a new slide
   */
  async createSlide(
    scoreboardId: string,
    slide: {
      slideType: 'image' | 'scoreboard';
      imageUrl?: string;
      thumbnailUrl?: string;
    }
  ): Promise<{ data: KioskSlide | null; error: string | null }> {
    try {
      // Get or create kiosk config
      let { data: config } = await supabase
        .from('kiosk_configs')
        .select('id')
        .eq('scoreboard_id', scoreboardId)
        .maybeSingle();

      if (!config) {
        const { data: newConfig, error: createError } = await supabase
          .from('kiosk_configs')
          .insert({
            scoreboard_id: scoreboardId,
            enabled: false,
            slide_duration_seconds: 10,
            scoreboard_position: 0,
          })
          .select('id')
          .single();

        if (createError) {
          return { data: null, error: createError.message };
        }
        config = newConfig;
      }

      // Get next position
      const { data: maxSlide } = await supabase
        .from('kiosk_slides')
        .select('position')
        .eq('kiosk_config_id', config.id)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextPosition = (maxSlide?.position ?? -1) + 1;

      const { data, error } = await supabase
        .from('kiosk_slides')
        .insert({
          kiosk_config_id: config.id,
          slide_type: slide.slideType,
          position: nextPosition,
          image_url: slide.imageUrl || null,
          thumbnail_url: slide.thumbnailUrl || null,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      const newSlide = rowToSlide(data);
      if (newSlide.slideType === 'image') {
        newSlide.thumbnailUrl = await getSignedUrl(newSlide.thumbnailUrl || '');
        newSlide.imageUrl = await getSignedUrl(newSlide.imageUrl || '');
      }

      return { data: newSlide, error: null };
    } catch (_error) {
      return { data: null, error: 'Failed to create slide' };
    }
  },

  /**
   * Delete a slide
   */
  async deleteSlide(slideId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get slide info first (for storage cleanup)
      const { data: slide } = await supabase
        .from('kiosk_slides')
        .select('image_url, thumbnail_url')
        .eq('id', slideId)
        .maybeSingle();

      // Delete the slide
      const { error } = await supabase
        .from('kiosk_slides')
        .delete()
        .eq('id', slideId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Clean up storage files
      if (slide) {
        const filesToDelete: string[] = [];
        if (slide.image_url && !slide.image_url.startsWith('http')) {
          filesToDelete.push(slide.image_url);
        }
        if (slide.thumbnail_url && !slide.thumbnail_url.startsWith('http')) {
          filesToDelete.push(slide.thumbnail_url);
        }
        if (filesToDelete.length > 0) {
          await supabase.storage.from('kiosk-slides').remove(filesToDelete);
        }
      }

      return { success: true, error: null };
    } catch (_error) {
      return { success: false, error: 'Failed to delete slide' };
    }
  },

  /**
   * Reorder slides
   */
  async reorderSlides(
    slides: Array<{ id: string; position: number }>
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Two-phase update to avoid unique constraint violation
      // Phase 1: Set all to high temp values
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        await supabase
          .from('kiosk_slides')
          .update({ position: 1000 + i })
          .eq('id', slide.id);
      }

      // Phase 2: Set final positions
      for (const slide of slides) {
        await supabase
          .from('kiosk_slides')
          .update({ position: slide.position })
          .eq('id', slide.id);
      }

      return { success: true, error: null };
    } catch (_error) {
      return { success: false, error: 'Failed to reorder slides' };
    }
  },

  /**
   * Upload an image and create a slide
   */
  async uploadImage(
    scoreboardId: string,
    file: File
  ): Promise<{ data: KioskSlide | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${timestamp}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = `${user.id}/${scoreboardId}/${fileName}`;

      // Upload original
      const { error: uploadError } = await supabase.storage
        .from('kiosk-slides')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
        });

      if (uploadError) {
        return { data: null, error: uploadError.message };
      }

      // Create slide with the uploaded image
      const result = await this.createSlide(scoreboardId, {
        slideType: 'image',
        imageUrl: filePath,
        thumbnailUrl: filePath, // Use same file as thumbnail for now
      });

      return result;
    } catch (_error) {
      return { data: null, error: 'Failed to upload image' };
    }
  },
};
