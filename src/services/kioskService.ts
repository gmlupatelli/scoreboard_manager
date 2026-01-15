import { supabase } from '../lib/supabase/client';
import { KioskConfig, KioskSlide, KioskConfigUpdate, CarouselSlide } from '../types/models';
import { Database } from '../types/database.types';

type KioskConfigRow = Database['public']['Tables']['kiosk_configs']['Row'];
type KioskConfigInsertRow = Database['public']['Tables']['kiosk_configs']['Insert'];
type KioskSlideRow = Database['public']['Tables']['kiosk_slides']['Row'];
type KioskSlideInsertRow = Database['public']['Tables']['kiosk_slides']['Insert'];

// ============================================================================
// ROW TO MODEL CONVERTERS
// ============================================================================

const rowToKioskConfig = (row: KioskConfigRow): KioskConfig => ({
  id: row.id,
  scoreboardId: row.scoreboard_id,
  slideDurationSeconds: row.slide_duration_seconds,
  scoreboardPosition: row.scoreboard_position,
  enabled: row.enabled,
  pinCode: row.pin_code,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const rowToKioskSlide = (row: KioskSlideRow): KioskSlide => ({
  id: row.id,
  kioskConfigId: row.kiosk_config_id,
  position: row.position,
  slideType: row.slide_type,
  imageUrl: row.image_url,
  thumbnailUrl: row.thumbnail_url,
  durationOverrideSeconds: row.duration_override_seconds,
  fileName: row.file_name,
  fileSize: row.file_size,
  createdAt: row.created_at,
});

// ============================================================================
// KIOSK SERVICE
// ============================================================================

export const kioskService = {
  // -------------------------------------------------------------------------
  // KIOSK CONFIG OPERATIONS
  // -------------------------------------------------------------------------

  /**
   * Get kiosk config for a scoreboard
   */
  async getKioskConfig(scoreboardId: string): Promise<{
    data: KioskConfig | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('kiosk_configs')
        .select('*')
        .eq('scoreboard_id', scoreboardId)
        .single();

      if (error) {
        // PGRST116 = no rows found, which is not an error for us
        if (error.code === 'PGRST116') {
          return { data: null, error: null };
        }
        return { data: null, error: error.message };
      }

      return { data: data ? rowToKioskConfig(data) : null, error: null };
    } catch (_error) {
      return { data: null, error: 'Failed to fetch kiosk configuration' };
    }
  },

  /**
   * Get kiosk config by ID (for public kiosk view)
   */
  async getKioskConfigById(configId: string): Promise<{
    data: KioskConfig | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('kiosk_configs')
        .select('*')
        .eq('id', configId)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data ? rowToKioskConfig(data) : null, error: null };
    } catch (_error) {
      return { data: null, error: 'Failed to fetch kiosk configuration' };
    }
  },

  /**
   * Create or update kiosk config for a scoreboard
   */
  async upsertKioskConfig(
    scoreboardId: string,
    config: KioskConfigUpdate
  ): Promise<{
    data: KioskConfig | null;
    error: string | null;
  }> {
    try {
      // Check if config exists
      const { data: existing } = (await supabase
        .from('kiosk_configs')
        .select('id')
        .eq('scoreboard_id', scoreboardId)
        .single()) as { data: { id: string } | null; error: unknown };

      if (existing) {
        // Update existing config
        const { data, error } = (await supabase
          .from('kiosk_configs')
          .update({
            slide_duration_seconds: config.slideDurationSeconds,
            scoreboard_position: config.scoreboardPosition,
            enabled: config.enabled,
            pin_code: config.pinCode,
          } as never)
          .eq('id', existing.id)
          .select()
          .single()) as { data: KioskConfigRow | null; error: { message: string } | null };

        if (error) {
          return { data: null, error: error.message };
        }

        return { data: data ? rowToKioskConfig(data) : null, error: null };
      } else {
        // Create new config
        const insertData: KioskConfigInsertRow = {
          scoreboard_id: scoreboardId,
          slide_duration_seconds: config.slideDurationSeconds ?? 10,
          scoreboard_position: config.scoreboardPosition ?? 0,
          enabled: config.enabled ?? false,
          pin_code: config.pinCode ?? null,
        };

        const { data, error } = await supabase
          .from('kiosk_configs')
          .insert(insertData as never)
          .select()
          .single();

        if (error) {
          return { data: null, error: error.message };
        }

        return { data: data ? rowToKioskConfig(data) : null, error: null };
      }
    } catch (_error) {
      return { data: null, error: 'Failed to save kiosk configuration' };
    }
  },

  /**
   * Enable/disable kiosk mode
   */
  async setKioskEnabled(
    scoreboardId: string,
    enabled: boolean
  ): Promise<{
    data: KioskConfig | null;
    error: string | null;
  }> {
    return this.upsertKioskConfig(scoreboardId, { enabled });
  },

  // -------------------------------------------------------------------------
  // KIOSK SLIDES OPERATIONS
  // -------------------------------------------------------------------------

  /**
   * Get all slides for a kiosk config
   */
  async getKioskSlides(kioskConfigId: string): Promise<{
    data: KioskSlide[] | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('kiosk_slides')
        .select('*')
        .eq('kiosk_config_id', kioskConfigId)
        .order('position', { ascending: true });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data?.map(rowToKioskSlide) ?? [], error: null };
    } catch (_error) {
      return { data: null, error: 'Failed to fetch kiosk slides' };
    }
  },

  /**
   * Get slides for a scoreboard (convenience method)
   */
  async getSlidesByScoreboardId(scoreboardId: string): Promise<{
    data: KioskSlide[] | null;
    error: string | null;
  }> {
    try {
      const { data: config } = await this.getKioskConfig(scoreboardId);
      if (!config) {
        return { data: [], error: null };
      }

      return this.getKioskSlides(config.id);
    } catch (_error) {
      return { data: null, error: 'Failed to fetch kiosk slides' };
    }
  },

  /**
   * Add a new slide
   */
  async addSlide(slide: {
    kioskConfigId: string;
    slideType: 'image' | 'scoreboard';
    imageUrl?: string | null;
    thumbnailUrl?: string | null;
    durationOverrideSeconds?: number | null;
    fileName?: string | null;
    fileSize?: number | null;
  }): Promise<{
    data: KioskSlide | null;
    error: string | null;
  }> {
    try {
      // Get the next position
      const { data: existingSlides } = (await supabase
        .from('kiosk_slides')
        .select('position')
        .eq('kiosk_config_id', slide.kioskConfigId)
        .order('position', { ascending: false })
        .limit(1)) as { data: { position: number }[] | null };

      const nextPosition =
        existingSlides && existingSlides.length > 0 ? existingSlides[0].position + 1 : 0;

      const insertData: KioskSlideInsertRow = {
        kiosk_config_id: slide.kioskConfigId,
        position: nextPosition,
        slide_type: slide.slideType,
        image_url: slide.imageUrl ?? null,
        thumbnail_url: slide.thumbnailUrl ?? null,
        duration_override_seconds: slide.durationOverrideSeconds ?? null,
        file_name: slide.fileName ?? null,
        file_size: slide.fileSize ?? null,
      };

      const { data, error } = await supabase
        .from('kiosk_slides')
        .insert(insertData as never)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data ? rowToKioskSlide(data) : null, error: null };
    } catch (_error) {
      return { data: null, error: 'Failed to add slide' };
    }
  },

  /**
   * Update slide position (for reordering)
   */
  async updateSlidePosition(
    slideId: string,
    newPosition: number
  ): Promise<{
    data: KioskSlide | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('kiosk_slides')
        .update({ position: newPosition } as never)
        .eq('id', slideId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data ? rowToKioskSlide(data) : null, error: null };
    } catch (_error) {
      return { data: null, error: 'Failed to update slide position' };
    }
  },

  /**
   * Update slide duration override
   */
  async updateSlideDuration(
    slideId: string,
    durationOverrideSeconds: number | null
  ): Promise<{
    data: KioskSlide | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('kiosk_slides')
        .update({ duration_override_seconds: durationOverrideSeconds } as never)
        .eq('id', slideId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data ? rowToKioskSlide(data) : null, error: null };
    } catch (_error) {
      return { data: null, error: 'Failed to update slide duration' };
    }
  },

  /**
   * Delete a slide
   */
  async deleteSlide(slideId: string): Promise<{
    error: string | null;
  }> {
    try {
      const { error } = await supabase.from('kiosk_slides').delete().eq('id', slideId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (_error) {
      return { error: 'Failed to delete slide' };
    }
  },

  /**
   * Reorder slides (update all positions)
   */
  async reorderSlides(slides: { id: string; position: number }[]): Promise<{
    error: string | null;
  }> {
    try {
      // Update each slide's position
      for (const slide of slides) {
        const { error } = await supabase
          .from('kiosk_slides')
          .update({ position: slide.position } as never)
          .eq('id', slide.id);

        if (error) {
          return { error: error.message };
        }
      }

      return { error: null };
    } catch (_error) {
      return { error: 'Failed to reorder slides' };
    }
  },

  // -------------------------------------------------------------------------
  // CAROUSEL DATA (FOR KIOSK VIEW)
  // -------------------------------------------------------------------------

  /**
   * Get carousel data for kiosk display
   */
  async getCarouselData(scoreboardId: string): Promise<{
    data: {
      config: KioskConfig;
      slides: CarouselSlide[];
    } | null;
    error: string | null;
  }> {
    try {
      const { data: config, error: configError } = await this.getKioskConfig(scoreboardId);

      if (configError || !config) {
        return { data: null, error: configError || 'Kiosk not configured' };
      }

      if (!config.enabled) {
        return { data: null, error: 'Kiosk mode is not enabled' };
      }

      const { data: slides, error: slidesError } = await this.getKioskSlides(config.id);

      if (slidesError) {
        return { data: null, error: slidesError };
      }

      // Convert to carousel slides with effective durations
      const carouselSlides: CarouselSlide[] = (slides || []).map((slide) => ({
        id: slide.id,
        type: slide.slideType,
        imageUrl: slide.imageUrl ?? undefined,
        duration: slide.durationOverrideSeconds ?? config.slideDurationSeconds,
        position: slide.position,
      }));

      // If no slides exist, add just the scoreboard
      if (carouselSlides.length === 0) {
        carouselSlides.push({
          id: 'scoreboard-default',
          type: 'scoreboard',
          duration: config.slideDurationSeconds,
          position: 0,
        });
      }

      // Sort by position
      carouselSlides.sort((a, b) => a.position - b.position);

      return {
        data: {
          config,
          slides: carouselSlides,
        },
        error: null,
      };
    } catch (_error) {
      return { data: null, error: 'Failed to fetch carousel data' };
    }
  },

  // -------------------------------------------------------------------------
  // STORAGE OPERATIONS
  // -------------------------------------------------------------------------

  /**
   * Upload a slide image to Supabase Storage
   */
  async uploadSlideImage(
    userId: string,
    scoreboardId: string,
    file: File
  ): Promise<{
    data: { path: string; url: string } | null;
    error: string | null;
  }> {
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const allowedExts = ['png', 'jpg', 'jpeg', 'webp'];

      if (!fileExt || !allowedExts.includes(fileExt)) {
        return { data: null, error: 'Invalid file type. Allowed: PNG, JPG, WebP' };
      }

      // Max file size: 10MB
      if (file.size > 10 * 1024 * 1024) {
        return { data: null, error: 'File size must be less than 10MB' };
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${userId}/${scoreboardId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('kiosk-slides')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        return { data: null, error: uploadError.message };
      }

      // Return the storage path (signed URLs are generated server-side when needed)
      return {
        data: {
          path: filePath,
          url: filePath, // Store path, not public URL (bucket is private)
        },
        error: null,
      };
    } catch (_error) {
      return { data: null, error: 'Failed to upload image' };
    }
  },

  /**
   * Delete a slide image from Supabase Storage
   * @param filePath - The storage path (e.g., userId/scoreboardId/filename.jpg)
   */
  async deleteSlideImage(filePath: string): Promise<{
    error: string | null;
  }> {
    try {
      // filePath should be the raw storage path, not a URL
      if (filePath.startsWith('http')) {
        return { error: 'Invalid file path - expected storage path, not URL' };
      }

      const { error } = await supabase.storage.from('kiosk-slides').remove([filePath]);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (_error) {
      return { error: 'Failed to delete image' };
    }
  },
};
