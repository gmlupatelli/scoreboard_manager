'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useAuthGuard } from '@/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { convertPdfToImages, isPdfFile, PdfProcessingProgress } from '@/utils/pdfToImages';
import { supabase } from '@/lib/supabase/client';

// Signed URLs expire after 1 hour, refetch after 30 minutes to ensure fresh URLs
const STALE_THRESHOLD_MS = 30 * 60 * 1000;

interface KioskConfig {
  id: string;
  slide_duration_seconds: number;
  scoreboard_position: number;
  enabled: boolean;
  pin_code: string | null;
}

interface KioskSlide {
  id: string;
  position: number;
  slide_type: 'image' | 'scoreboard';
  image_url: string | null;
  thumbnail_url: string | null;
  file_name: string | null;
  file_size: number | null;
  duration_override_seconds: number | null;
}

interface KioskSettingsSectionProps {
  scoreboardId: string;
  scoreboardTitle: string;
  isExpanded: boolean;
  onToggle: () => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function KioskSettingsSection({
  scoreboardId,
  scoreboardTitle: _scoreboardTitle,
  isExpanded,
  onToggle,
  onShowToast,
}: KioskSettingsSectionProps) {
  const { getAuthHeaders } = useAuthGuard();
  const { subscriptionTier } = useAuth();
  const isSupporter = Boolean(subscriptionTier);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // LocalStorage key for caching slide order (handles read replica lag)
  const slideOrderCacheKey = `kiosk-slide-order-${scoreboardId}`;

  // Get cached slide order from localStorage
  const getCachedSlideOrder = useCallback((): {
    positions: Record<string, number>;
    timestamp: number;
  } | null => {
    try {
      const cached = localStorage.getItem(slideOrderCacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Cache valid for 5 minutes
        if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          return parsed;
        }
        localStorage.removeItem(slideOrderCacheKey);
      }
    } catch {
      // Ignore localStorage errors
    }
    return null;
  }, [slideOrderCacheKey]);

  // Save slide order to localStorage
  const cacheSlideOrder = (slides: KioskSlide[]) => {
    try {
      const positions: Record<string, number> = {};
      slides.forEach((s) => {
        positions[s.id] = s.position;
      });
      localStorage.setItem(
        slideOrderCacheKey,
        JSON.stringify({ positions, timestamp: Date.now() })
      );
    } catch {
      // Ignore localStorage errors
    }
  };

  // Apply cached order to slides (if cache is newer than server data)
  const applyCachedOrder = useCallback(
    (slidesToOrder: KioskSlide[]): KioskSlide[] => {
      const cached = getCachedSlideOrder();
      if (!cached) return slidesToOrder;

      // Apply cached positions
      const reordered = slidesToOrder.map((s) => ({
        ...s,
        position: cached.positions[s.id] ?? s.position,
      }));
      reordered.sort((a, b) => a.position - b.position);
      return reordered;
    },
    [getCachedSlideOrder]
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<KioskConfig | null>(null);
  const [slides, setSlides] = useState<KioskSlide[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

  // Form state
  const [enabled, setEnabled] = useState(false);
  const [slideDuration, setSlideDuration] = useState<string>('10');
  const [scoreboardPosition, setScoreboardPosition] = useState(0);
  const [pinCode, setPinCode] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Drag state
  const [draggedSlide, setDraggedSlide] = useState<string | null>(null);

  // Track slides with failed images
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Upload processing state (for both images and PDFs)
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<PdfProcessingProgress | null>(null);

  // Ref to prevent double loading
  const isLoadingRef = useRef(false);

  // Ref to track if initial fetch has completed
  const hasFetchedRef = useRef(false);

  // Ref to store stable loadKioskData function
  const loadKioskDataRef = useRef<((options?: { showLoader?: boolean }) => Promise<void>) | null>(
    null
  );

  // Track latest kiosk fetch to avoid stale updates
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Add initial scoreboard slide (called when no slides exist)
  const addInitialScoreboardSlide = useCallback(
    async (authHeaders: Record<string, string>) => {
      try {
        const response = await fetch(`/api/kiosk/${scoreboardId}/slides`, {
          method: 'POST',
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            slideType: 'scoreboard',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setSlides([data.slide]);
        }
      } catch (_error) {
        // Silent fail - user can add slides manually
      }
    },
    [scoreboardId]
  );

  // Load kiosk data from API
  const loadKioskData = useCallback(
    async (options: { showLoader?: boolean } = {}) => {
      if (!scoreboardId) return;

      // Prevent concurrent loading
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;

      requestIdRef.current += 1;
      const requestId = requestIdRef.current;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (options.showLoader !== false) {
        setIsLoading(true);
      }
      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`/api/kiosk/${scoreboardId}`, {
          headers: authHeaders,
          signal: controller.signal,
        });
        const data = await response.json();

        if (response.ok && requestIdRef.current === requestId) {
          if (data.config) {
            setConfig(data.config);
            setEnabled(data.config.enabled);
            setSlideDuration(String(data.config.slide_duration_seconds));
            setScoreboardPosition(data.config.scoreboard_position);
            setPinCode(data.config.pin_code || '');
          }
          const loadedSlides = (data.slides || []) as KioskSlide[];

          // Sort by position, then apply cached order if available (handles read replica lag)
          loadedSlides.sort((a, b) => a.position - b.position);
          const orderedSlides = applyCachedOrder(loadedSlides);

          setSlides(orderedSlides);
          setLastFetchTime(Date.now());
          setFailedImages(new Set()); // Clear failed images on fresh data
          hasFetchedRef.current = true;

          // Auto-add scoreboard slide if no slides exist
          if (loadedSlides.length === 0) {
            addInitialScoreboardSlide(authHeaders);
          }
        }
      } catch (_error) {
        if (!controller.signal.aborted) {
          onShowToast('Failed to load kiosk settings', 'error');
        }
      } finally {
        if (options.showLoader !== false && requestIdRef.current === requestId) {
          setIsLoading(false);
        }
        if (requestIdRef.current === requestId) {
          isLoadingRef.current = false;
        }
      }
    },
    [scoreboardId, getAuthHeaders, onShowToast, addInitialScoreboardSlide, applyCachedOrder]
  );

  // Keep the ref updated with latest loadKioskData
  useEffect(() => {
    loadKioskDataRef.current = loadKioskData;
  }, [loadKioskData]);

  // Keep getAuthHeaders ref updated for stable reference in realtime callbacks
  const getAuthHeadersRef = useRef(getAuthHeaders);
  useEffect(() => {
    getAuthHeadersRef.current = getAuthHeaders;
  }, [getAuthHeaders]);

  // Ref to batch realtime UPDATE events and sort once
  const pendingUpdatesRef = useRef<Map<string, number>>(new Map());
  const updateDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to realtime changes for kiosk_slides
  // Apply changes directly from the realtime payload instead of re-fetching
  useEffect(() => {
    if (!scoreboardId || !config?.id) return;

    const channel = supabase
      .channel(`kiosk-slides-${scoreboardId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'kiosk_slides',
          filter: `kiosk_config_id=eq.${config.id}`,
        },
        async (payload) => {
          const newSlide = payload.new as KioskSlide;

          // If image slide, sign URLs before adding to state
          let slideToAdd = newSlide;
          if (newSlide.slide_type === 'image' && (newSlide.image_url || newSlide.thumbnail_url)) {
            try {
              const headers = await getAuthHeadersRef.current();
              const pathsToSign: string[] = [];

              if (newSlide.image_url) pathsToSign.push(newSlide.image_url);
              if (newSlide.thumbnail_url) pathsToSign.push(newSlide.thumbnail_url);

              const response = await fetch(`/api/kiosk/${scoreboardId}/sign-urls`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ paths: pathsToSign }),
              });

              if (response.ok) {
                const { signedUrls } = await response.json();
                slideToAdd = {
                  ...newSlide,
                  image_url:
                    (newSlide.image_url && signedUrls[newSlide.image_url]) || newSlide.image_url,
                  thumbnail_url:
                    (newSlide.thumbnail_url && signedUrls[newSlide.thumbnail_url]) ||
                    newSlide.thumbnail_url,
                };
              }
            } catch (error) {
              // Log but continue with unsigned URLs
              console.error('Failed to sign slide URLs:', error);
              // Keep original slide with unsigned paths; periodic refresh will update them
            }
          }

          setSlides((prev) => {
            // Check if slide already exists (avoid duplicates from optimistic UI)
            if (prev.some((s) => s.id === slideToAdd.id)) {
              return prev;
            }
            const updated = [...prev, slideToAdd];
            updated.sort((a, b) => a.position - b.position);
            return updated;
          });
          // Update lastFetchTime to prevent stale-check from triggering a GET
          setLastFetchTime(Date.now());
          // Clear failed images to allow retry if signed URLs were obtained
          setFailedImages((prev) => {
            const updated = new Set(prev);
            if (slideToAdd.thumbnail_url && slideToAdd.thumbnail_url.includes('token=')) {
              updated.delete(slideToAdd.id);
            }
            return updated;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'kiosk_slides',
          filter: `kiosk_config_id=eq.${config.id}`,
        },
        (payload) => {
          const updatedSlide = payload.new as KioskSlide;

          // Batch UPDATE events to prevent "dancing" during reorder
          // Multiple UPDATE events arrive rapidly during reorder operations
          // We batch them and sort once at the end
          pendingUpdatesRef.current.set(updatedSlide.id, updatedSlide.position);

          // Clear any pending debounce timer
          if (updateDebounceRef.current) {
            clearTimeout(updateDebounceRef.current);
          }

          // After 150ms of no new UPDATE events, apply all batched updates
          updateDebounceRef.current = setTimeout(() => {
            const pendingUpdates = pendingUpdatesRef.current;
            if (pendingUpdates.size === 0) return;

            // Capture the updates BEFORE calling setSlides to avoid closure issues
            const updatesSnapshot = new Map(pendingUpdates);
            const updatesArray = Array.from(updatesSnapshot.entries());

            // Check if any positions are temporary (1000+) - if so, wait for final positions
            const hasTempPositions = updatesArray.some(([, pos]) => pos >= 1000);
            if (hasTempPositions) {
              // Don't clear - keep accumulating until we get final positions
              return;
            }

            // Clear immediately so new updates go to a fresh map
            pendingUpdatesRef.current.clear();

            setSlides((prev) => {
              // Check if any positions actually differ from our current state
              let hasChanges = false;
              for (const [id, newPosition] of updatesArray) {
                const existingSlide = prev.find((s) => s.id === id);
                if (existingSlide && existingSlide.position !== newPosition) {
                  hasChanges = true;
                  break;
                }
              }

              if (!hasChanges) {
                // All positions match - our optimistic update was correct
                return prev;
              }

              // Apply all position updates
              const updated = prev.map((s) => {
                const newPosition = updatesSnapshot.get(s.id);
                if (newPosition !== undefined) {
                  return {
                    ...s,
                    position: newPosition,
                  };
                }
                return s;
              });

              // Sort once after all updates are applied
              updated.sort((a, b) => a.position - b.position);
              return updated;
            });

            // Update lastFetchTime to prevent stale-check from triggering a GET
            setLastFetchTime(Date.now());
          }, 150);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'kiosk_slides',
          filter: `kiosk_config_id=eq.${config.id}`,
        },
        (payload) => {
          const deletedSlide = payload.old as KioskSlide;
          setSlides((prev) => prev.filter((s) => s.id !== deletedSlide.id));
          // Update lastFetchTime to prevent stale-check from triggering a GET
          setLastFetchTime(Date.now());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      // Clear any pending debounce timer
      if (updateDebounceRef.current) {
        clearTimeout(updateDebounceRef.current);
      }
    };
  }, [scoreboardId, config?.id]);

  // Load data when expanded - only on initial expand or after stale threshold
  // Use ref for lastFetchTime to avoid triggering effect on realtime updates
  const lastFetchTimeRef = useRef<number | null>(null);
  useEffect(() => {
    lastFetchTimeRef.current = lastFetchTime;
  }, [lastFetchTime]);

  useEffect(() => {
    if (!isExpanded || isLoadingRef.current) {
      return;
    }

    const shouldRefresh =
      !hasFetchedRef.current ||
      lastFetchTimeRef.current === null ||
      Date.now() - lastFetchTimeRef.current > STALE_THRESHOLD_MS;

    if (shouldRefresh && loadKioskDataRef.current) {
      loadKioskDataRef.current();
      // Revalidation to overcome read replica lag is now handled in the
      // realtime subscription callback after SUBSCRIBED status is confirmed
    }
  }, [isExpanded, scoreboardId]);

  // Reset refs when scoreboardId changes (switching between scoreboards)
  useEffect(() => {
    hasFetchedRef.current = false;
    isLoadingRef.current = false;
    setSlides([]);
    setConfig(null);
  }, [scoreboardId]);

  // Track if initial enabled status has been loaded
  const hasLoadedEnabledRef = useRef(false);

  // Load enabled status on mount (for header badge) without full data load
  // Only runs once per scoreboardId to avoid reloading on window focus
  useEffect(() => {
    // Reset the flag when scoreboardId changes
    hasLoadedEnabledRef.current = false;
  }, [scoreboardId]);

  useEffect(() => {
    if (!scoreboardId || hasLoadedEnabledRef.current) return;

    const loadEnabledStatus = async () => {
      try {
        const authHeaders = await getAuthHeadersRef.current();
        const response = await fetch(`/api/kiosk/${scoreboardId}`, {
          headers: authHeaders,
        });
        if (response.ok) {
          const data = await response.json();
          if (data.config) {
            setEnabled(data.config.enabled);
            setConfig(data.config);
            hasLoadedEnabledRef.current = true;
          }
        }
      } catch {
        // Silent fail - badge just won't show until section is expanded
      }
    };
    loadEnabledStatus();
  }, [scoreboardId]);

  // Subscribe to realtime changes for kiosk_configs (enabled status)
  useEffect(() => {
    if (!scoreboardId) return;

    const channel = supabase
      .channel(`kiosk-config-${scoreboardId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'kiosk_configs',
          filter: `scoreboard_id=eq.${scoreboardId}`,
        },
        (payload) => {
          const updatedConfig = payload.new as KioskConfig;
          setEnabled(updatedConfig.enabled);
          setConfig((prev) => (prev ? { ...prev, ...updatedConfig } : updatedConfig));
          setSlideDuration(String(updatedConfig.slide_duration_seconds));
          setScoreboardPosition(updatedConfig.scoreboard_position);
          setPinCode(updatedConfig.pin_code || '');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [scoreboardId]);

  // Save config
  const handleSaveConfig = async () => {
    // Validate slide duration
    const durationValue = parseInt(slideDuration, 10);
    if (isNaN(durationValue) || durationValue < 3 || durationValue > 300) {
      onShowToast('Slide duration must be between 3 and 300 seconds', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const authHeaders = await getAuthHeaders();

      // Save config settings
      const response = await fetch(`/api/kiosk/${scoreboardId}`, {
        method: 'PUT',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled,
          slideDurationSeconds: durationValue,
          scoreboardPosition,
          pinCode: pinCode || null,
        }),
      });

      if (response.ok) {
        setHasChanges(false);
        onShowToast('Kiosk settings saved', 'success');
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle enabled state immediately
  const handleToggleEnabled = async (newEnabled: boolean) => {
    setEnabled(newEnabled);

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`/api/kiosk/${scoreboardId}`, {
        method: 'PUT',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: newEnabled,
          slideDurationSeconds: parseInt(slideDuration, 10) || 10,
          scoreboardPosition,
          pinCode: pinCode || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        onShowToast(newEnabled ? 'Kiosk mode enabled' : 'Kiosk mode disabled', 'success');
      } else {
        // Revert on error
        setEnabled(!newEnabled);
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      setEnabled(!newEnabled);
      onShowToast(error instanceof Error ? error.message : 'Failed to update', 'error');
    }
  };

  // Upload a single image file and create a slide
  // Returns the created slide with signed URLs, or null on failure
  const uploadImageFile = async (
    file: File,
    authHeaders: Record<string, string>
  ): Promise<KioskSlide | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(`/api/kiosk/${scoreboardId}/upload`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error);
      }

      const uploadData = await uploadResponse.json();

      // Create slide with uploaded image
      const slideResponse = await fetch(`/api/kiosk/${scoreboardId}/slides`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slideType: 'image',
          imageUrl: uploadData.url,
          thumbnailUrl: uploadData.thumbnailUrl,
          fileName: uploadData.fileName,
          fileSize: uploadData.fileSize,
        }),
      });

      if (!slideResponse.ok) {
        const error = await slideResponse.json();
        throw new Error(error.error);
      }

      const slideData = await slideResponse.json();
      // Return the slide with signed URLs from the API response
      return slideData.slide as KioskSlide;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  // Handle PDF file upload
  const handlePdfUpload = async (file: File) => {
    // Check slide limit
    const remainingSlots = 20 - slides.length;
    if (remainingSlots <= 0) {
      onShowToast('Maximum 20 slides reached', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: 0, status: 'loading', message: 'Loading PDF...' });

    try {
      const headers = await getAuthHeaders();

      // Convert PDF pages to images
      const { images, error } = await convertPdfToImages(file, (progress) => {
        setUploadProgress(progress);
      });

      if (error) {
        onShowToast(error, 'error');
        return;
      }

      if (images.length === 0) {
        onShowToast('No pages found in PDF', 'error');
        return;
      }

      // Check if we have enough slots
      const pagesToUpload = Math.min(images.length, remainingSlots);
      if (pagesToUpload < images.length) {
        onShowToast(
          `Only uploading ${pagesToUpload} of ${images.length} pages (slide limit)`,
          'info'
        );
      }

      // Upload each page image
      setUploadProgress({
        current: 0,
        total: pagesToUpload,
        status: 'processing',
        message: 'Uploading slides...',
      });

      let successCount = 0;
      const uploadedSlides: KioskSlide[] = [];
      for (let i = 0; i < pagesToUpload; i++) {
        const image = images[i];
        const imageFile = new File([image.blob], image.fileName, { type: 'image/png' });

        const slide = await uploadImageFile(imageFile, headers);
        if (slide) {
          successCount++;
          uploadedSlides.push(slide);
        }

        setUploadProgress({
          current: i + 1,
          total: pagesToUpload,
          status: 'processing',
          message: `Uploaded ${i + 1} of ${pagesToUpload} slides`,
        });
      }

      // Add all uploaded slides to state (with signed URLs)
      if (uploadedSlides.length > 0) {
        setSlides((prev) => {
          // Filter out any that might have been added by realtime
          const newSlideIds = new Set(uploadedSlides.map((s) => s.id));
          const filtered = prev.filter((s) => !newSlideIds.has(s.id));
          const updated = [...filtered, ...uploadedSlides];
          updated.sort((a, b) => a.position - b.position);
          return updated;
        });
        setLastFetchTime(Date.now());
      }

      setUploadProgress({
        current: pagesToUpload,
        total: pagesToUpload,
        status: 'complete',
        message: 'Complete!',
      });

      if (successCount > 0) {
        onShowToast(`Successfully uploaded ${successCount} slides from PDF`, 'success');
      } else {
        onShowToast('Failed to upload slides from PDF', 'error');
      }
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Failed to process PDF', 'error');
    } finally {
      setIsUploading(false);
      // Keep progress visible briefly before clearing
      setTimeout(() => setUploadProgress(null), 2000);
    }
  };

  // Handle file upload (images or PDF)
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Check if it's a PDF
    if (isPdfFile(file)) {
      // Validate PDF size (50MB max for PDFs)
      if (file.size > 50 * 1024 * 1024) {
        onShowToast('PDF file size must be less than 50MB', 'error');
        return;
      }
      await handlePdfUpload(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Handle regular image upload
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      onShowToast('Invalid file type. Allowed: PNG, JPG, WebP, PDF', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onShowToast('Image file size must be less than 10MB', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress({
      current: 0,
      total: 1,
      status: 'processing',
      message: `Uploading ${file.name}...`,
    });

    try {
      const headers = await getAuthHeaders();
      const slide = await uploadImageFile(file, headers);

      if (slide) {
        // Add slide to state with signed URLs from API response
        setSlides((prev) => {
          // Filter out if already added by realtime
          const filtered = prev.filter((s) => s.id !== slide.id);
          const updated = [...filtered, slide];
          updated.sort((a, b) => a.position - b.position);
          return updated;
        });
        setLastFetchTime(Date.now());

        setUploadProgress({
          current: 1,
          total: 1,
          status: 'complete',
          message: 'Upload complete!',
        });
        onShowToast('Slide uploaded successfully', 'success');
      } else {
        setUploadProgress({
          current: 0,
          total: 1,
          status: 'error',
          message: 'Upload failed',
        });
        onShowToast('Failed to upload slide', 'error');
      }
    } catch (error) {
      setUploadProgress({
        current: 0,
        total: 1,
        status: 'error',
        message: 'Upload failed',
      });
      onShowToast(error instanceof Error ? error.message : 'Failed to upload slide', 'error');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(null), 2000);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add scoreboard slide
  const _handleAddScoreboardSlide = async () => {
    // Check if scoreboard slide already exists
    if (slides.some((s) => s.slide_type === 'scoreboard')) {
      onShowToast('Scoreboard slide already exists', 'info');
      return;
    }

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`/api/kiosk/${scoreboardId}/slides`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slideType: 'scoreboard',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      // Realtime subscription will update the UI
      onShowToast('Scoreboard slide added', 'success');
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Failed to add slide', 'error');
    }
  };

  // Delete slide
  const handleDeleteSlide = async (slideId: string) => {
    // Optimistic update
    setSlides((prev) => prev.filter((s) => s.id !== slideId));

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`/api/kiosk/${scoreboardId}/slides/${slideId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      // Realtime subscription will confirm the update
      onShowToast('Slide deleted', 'success');
    } catch (error) {
      // Revert on error - reload from server
      loadKioskData({ showLoader: false });
      onShowToast(error instanceof Error ? error.message : 'Failed to delete slide', 'error');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (slideId: string) => {
    setDraggedSlide(slideId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetSlideId: string) => {
    if (!draggedSlide || draggedSlide === targetSlideId) {
      setDraggedSlide(null);
      return;
    }

    const draggedIndex = slides.findIndex((s) => s.id === draggedSlide);
    const targetIndex = slides.findIndex((s) => s.id === targetSlideId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedSlide(null);
      return;
    }

    // Reorder slides locally
    const newSlides = [...slides];
    const [removed] = newSlides.splice(draggedIndex, 1);
    newSlides.splice(targetIndex, 0, removed);

    // Update positions
    const reorderedSlides = newSlides.map((slide, index) => ({
      ...slide,
      position: index,
    }));

    // Optimistic update
    setSlides(reorderedSlides);
    setDraggedSlide(null);

    // Save reordering to server
    try {
      const authHeaders = await getAuthHeaders();
      const orderResponse = await fetch(`/api/kiosk/${scoreboardId}/slides`, {
        method: 'PUT',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slides: reorderedSlides.map((s) => ({ id: s.id, position: s.position })),
        }),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        throw new Error(error.error || 'Failed to save slide order');
      }
      // Cache the order to handle read replica lag on reload
      cacheSlideOrder(reorderedSlides);
      // Realtime subscription will confirm the update
      onShowToast('Slide order updated', 'success');
    } catch (error) {
      // Revert on error - reload from server
      loadKioskData({ showLoader: false });
      onShowToast(error instanceof Error ? error.message : 'Failed to save order', 'error');
    }
  };

  // Copy kiosk URL
  const handleCopyKioskUrl = async () => {
    const url = `${window.location.origin}/kiosk/${scoreboardId}`;
    try {
      await navigator.clipboard.writeText(url);
      onShowToast('Kiosk URL copied to clipboard', 'success');
    } catch (_err) {
      // Clipboard API blocked (e.g., VS Code Simple Browser)
      onShowToast('Copy failed - try a different browser', 'error');
    }
  };

  // Preview kiosk
  const handlePreviewKiosk = () => {
    window.open(`/kiosk/${scoreboardId}`, '_blank');
  };

  // Format file size
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-card border border-border rounded-lg elevation-1 mb-6">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-3">
          <Icon name="TvIcon" size={20} className="text-secondary" />
          <div>
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              Kiosk / Presentation Mode
              {enabled && (
                <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-500 rounded-full">
                  Enabled
                </span>
              )}
              {!isSupporter && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-text-secondary rounded-full">
                  <Icon name="LockClosedIcon" size={12} />
                  Supporter
                </span>
              )}
            </h3>
            <p className="text-sm text-text-secondary">
              Allow this scoreboard to be displayed with custom slides in full-screen mode
            </p>
          </div>
        </div>
        <Icon
          name={isExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'}
          size={20}
          className="text-text-secondary"
        />
      </button>

      {/* Content */}
      {isExpanded && !isSupporter && (
        <div className="px-6 pb-6 border-t border-border pt-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Icon
                name="LockClosedIcon"
                size={20}
                className="text-gray-600 flex-shrink-0 mt-0.5"
              />
              <div className="flex-1 text-sm text-gray-700">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium">Supporter Feature</p>
                  <Link
                    href="/supporter-plan"
                    className="inline-flex items-center text-orange-900 hover:bg-orange-900/10 px-2 py-1 rounded-md font-medium text-sm whitespace-nowrap transition-colors duration-150"
                    title="Become a Supporter to unlock Kiosk / TV Mode"
                  >
                    Become a Supporter
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isExpanded && isSupporter && (
        <div className="px-4 pb-4 space-y-6 border-t border-border">
          {isLoading ? (
            <div className="py-8 text-center text-text-secondary">Loading kiosk settings...</div>
          ) : (
            <>
              {/* Enable toggle */}
              <div className="pt-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-medium text-text-primary">
                      Enable Kiosk / Presentation Mode
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => handleToggleEnabled(e.target.checked)}
                      className="sr-only peer"
                      data-testid="kiosk-enable-toggle"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </div>
                </label>
              </div>

              {/* Kiosk URL */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Kiosk URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/kiosk/${scoreboardId}`}
                    readOnly
                    disabled={!enabled}
                    className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-muted text-text-primary font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="kiosk-url-input"
                  />
                  <button
                    onClick={handlePreviewKiosk}
                    disabled={!enabled}
                    className="px-4 py-2 text-primary rounded-md font-medium text-sm hover:bg-red-600/10 transition-colors duration-150 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    title="Open kiosk preview in new tab"
                  >
                    <Icon name="ArrowTopRightOnSquareIcon" size={16} />
                    <span className="hidden sm:inline">Preview</span>
                  </button>
                  <button
                    onClick={handleCopyKioskUrl}
                    disabled={!enabled}
                    className="px-4 py-2 text-orange-900 rounded-md font-medium text-sm hover:bg-orange-900/10 transition-colors duration-150 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    title="Copy kiosk URL to clipboard"
                  >
                    <Icon name="ClipboardDocumentIcon" size={16} />
                    <span className="hidden sm:inline">Copy URL</span>
                  </button>
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Slide duration */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Slide Duration (seconds)
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={300}
                    value={slideDuration}
                    onChange={(e) => {
                      setSlideDuration(e.target.value);
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-text-primary focus:border-primary focus:ring-1 focus:ring-primary"
                    data-testid="kiosk-slide-duration"
                  />
                  <p className="text-xs text-text-secondary mt-1">Min: 3, Max: 300</p>
                </div>

                {/* PIN protection */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    PIN Protection (optional)
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={pinCode}
                      onChange={(e) => {
                        setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setHasChanges(true);
                      }}
                      placeholder="Enter 4-6 digit PIN"
                      autoComplete="off"
                      className="w-full px-3 py-2 pr-10 bg-background border border-input rounded-md text-text-primary focus:border-primary focus:ring-1 focus:ring-primary"
                      data-testid="kiosk-pin-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                      title={showPin ? 'Hide PIN' : 'Show PIN'}
                    >
                      <Icon name={showPin ? 'EyeSlashIcon' : 'EyeIcon'} size={18} />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">
                    Leave empty for unrestricted access
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-border">
                <button
                  onClick={handleSaveConfig}
                  disabled={!hasChanges || isSaving}
                  className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-red-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                  title="Save kiosk settings"
                  data-testid="kiosk-save-settings"
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>

              {/* Slides */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-text-primary">
                    Slides ({slides.length}/20)
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || slides.length >= 20}
                      className="px-3 py-1.5 rounded-md font-medium text-sm flex items-center gap-2 transition-colors bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Add image or PDF slide"
                    >
                      <Icon name="PlusIcon" size={16} />
                      Add Slide
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf,.pdf"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Upload Progress */}
                {uploadProgress && (
                  <div
                    className={`rounded-lg p-4 mb-3 ${
                      uploadProgress.status === 'error'
                        ? 'bg-red-50 border border-red-200'
                        : uploadProgress.status === 'complete'
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-blue-50 border border-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {uploadProgress.status === 'complete' ? (
                        <Icon name="CheckCircleIcon" size={20} className="text-green-600" />
                      ) : uploadProgress.status === 'error' ? (
                        <Icon name="ExclamationCircleIcon" size={20} className="text-red-600" />
                      ) : (
                        <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                      )}
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            uploadProgress.status === 'error'
                              ? 'text-red-800'
                              : uploadProgress.status === 'complete'
                                ? 'text-green-800'
                                : 'text-blue-800'
                          }`}
                        >
                          {uploadProgress.status === 'loading' && 'Loading...'}
                          {uploadProgress.status === 'processing' && 'Uploading...'}
                          {uploadProgress.status === 'complete' && 'Complete!'}
                          {uploadProgress.status === 'error' && 'Error'}
                        </p>
                        <p
                          className={`text-sm ${
                            uploadProgress.status === 'error'
                              ? 'text-red-600'
                              : uploadProgress.status === 'complete'
                                ? 'text-green-600'
                                : 'text-blue-600'
                          }`}
                        >
                          {uploadProgress.message}
                        </p>
                      </div>
                    </div>
                    {uploadProgress.total > 0 &&
                      uploadProgress.status !== 'complete' &&
                      uploadProgress.status !== 'error' && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-blue-600 mb-1">
                            <span>
                              {uploadProgress.current} of {uploadProgress.total}
                            </span>
                            <span>
                              {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                            </span>
                          </div>
                          <div className="bg-blue-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {slides.length === 0 ? (
                  <div className="text-center py-8 bg-muted/50 border-2 border-dashed border-border rounded-lg text-text-secondary">
                    <Icon name="PhotoIcon" size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No slides yet. Add images, PDFs, or use the scoreboard slide.</p>
                    <p className="text-xs mt-1 opacity-70">
                      Supports PNG, JPG, WebP, and PDF files
                    </p>
                  </div>
                ) : (
                  <div
                    className="p-3 bg-muted/30 border border-border rounded-lg"
                    data-testid="kiosk-slides-list"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {slides.map((slide, index) => (
                        <div
                          key={slide.id}
                          draggable
                          onDragStart={() => handleDragStart(slide.id)}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(slide.id)}
                          data-testid="kiosk-slide-item"
                          className={`relative group aspect-video bg-muted rounded-lg overflow-hidden border-2 transition-all cursor-move ${
                            draggedSlide === slide.id
                              ? 'border-primary opacity-50'
                              : 'border-transparent hover:border-red-600/50'
                          }`}
                        >
                          {slide.slide_type === 'scoreboard' ? (
                            <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-600/20 to-red-600/5">
                              <Icon name="ChartBarIcon" size={24} className="text-primary mb-1" />
                              <span className="text-xs font-medium text-text-primary">
                                Scoreboard
                              </span>
                            </div>
                          ) : (slide.thumbnail_url || slide.image_url) &&
                            !failedImages.has(slide.id) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={slide.thumbnail_url ?? slide.image_url ?? undefined}
                              alt={slide.file_name || 'Slide'}
                              className="w-full h-full object-cover"
                              onError={() => {
                                setFailedImages((prev) => new Set(prev).add(slide.id));
                              }}
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <Icon name="PhotoIcon" size={24} className="text-text-secondary" />
                            </div>
                          )}

                          {/* Position indicator */}
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-xs rounded">
                            {index + 1}
                          </div>

                          {/* Delete button - not shown for scoreboard slide */}
                          {slide.slide_type !== 'scoreboard' && (
                            <button
                              onClick={() => handleDeleteSlide(slide.id)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                              title="Delete slide"
                            >
                              <Icon name="XMarkIcon" size={14} />
                            </button>
                          )}

                          {/* File info tooltip */}
                          {slide.file_name && (
                            <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/60 text-white text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">
                              {slide.file_name}
                              {slide.file_size && ` (${formatFileSize(slide.file_size)})`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="mt-2 text-xs text-text-secondary">
                  Drag slides to reorder. Maximum 20 slides. Upload PDFs to automatically convert
                  each page to a slide.
                </p>
              </div>

              {/* Info box */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Icon
                    name="InformationCircleIcon"
                    size={20}
                    className="text-gray-600 flex-shrink-0 mt-0.5"
                  />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">Tips for Kiosk Mode</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>
                        Press <kbd className="px-1 py-0.5 bg-gray-200 rounded">F</kbd> to toggle
                        fullscreen
                      </li>
                      <li>
                        Press <kbd className="px-1 py-0.5 bg-gray-200 rounded">Space</kbd> to
                        pause/resume
                      </li>
                      <li>
                        Use <kbd className="px-1 py-0.5 bg-gray-200 rounded">←</kbd>{' '}
                        <kbd className="px-1 py-0.5 bg-gray-200 rounded">→</kbd> to navigate
                        manually
                      </li>
                      <li>
                        Press <kbd className="px-1 py-0.5 bg-gray-200 rounded">ESC</kbd> to exit
                        fullscreen
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
