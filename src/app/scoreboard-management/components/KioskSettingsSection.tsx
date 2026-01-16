'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useAuthGuard } from '@/hooks';
import { convertPdfToImages, isPdfFile, PdfProcessingProgress } from '@/utils/pdfToImages';

// Signed URLs expire after 1 hour, refetch after 30 minutes to ensure fresh URLs
const _STALE_THRESHOLD_MS = 30 * 60 * 1000;

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [_config, setConfig] = useState<KioskConfig | null>(null);
  const [slides, setSlides] = useState<KioskSlide[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [_lastFetchTime, setLastFetchTime] = useState<number | null>(null);

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

  // Track latest kiosk fetch to avoid stale updates
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Pending sync guard to avoid stale GETs overwriting optimistic updates
  const pendingSyncRef = useRef<{
    addedIds: Set<string>;
    addedSlides: Map<string, KioskSlide>;
    deletedIds: Set<string>;
    pendingPositions: Map<string, number>; // Track reordered positions
    expiresAt: number;
  } | null>(null);

  const registerPendingSync = (update: { addedSlide?: KioskSlide; deletedId?: string; positions?: Array<{ id: string; position: number }> }) => {
    const now = Date.now();
    // 5 minute expiry to handle Supabase read replica lag (can be very slow)
    const PENDING_SYNC_EXPIRY_MS = 5 * 60 * 1000;
    if (!pendingSyncRef.current || pendingSyncRef.current.expiresAt < now) {
      pendingSyncRef.current = {
        addedIds: new Set<string>(),
        addedSlides: new Map<string, KioskSlide>(),
        deletedIds: new Set<string>(),
        pendingPositions: new Map<string, number>(),
        expiresAt: now + PENDING_SYNC_EXPIRY_MS,
      };
    }

    if (update.addedSlide) {
      pendingSyncRef.current.deletedIds.delete(update.addedSlide.id);
      pendingSyncRef.current.addedIds.add(update.addedSlide.id);
      pendingSyncRef.current.addedSlides.set(update.addedSlide.id, update.addedSlide);
    }
    if (update.deletedId) {
      pendingSyncRef.current.addedIds.delete(update.deletedId);
      pendingSyncRef.current.addedSlides.delete(update.deletedId);
      pendingSyncRef.current.deletedIds.add(update.deletedId);
    }
    if (update.positions) {
      for (const pos of update.positions) {
        pendingSyncRef.current.pendingPositions.set(pos.id, pos.position);
      }
    }
  };

  // Add initial scoreboard slide (called when no slides exist)
  const addInitialScoreboardSlide = useCallback(
    async (authHeaders: Record<string, string>) => {
      try {
        const response = await fetch(`/api/kiosk/${scoreboardId}/slides`, {
          method: 'POST',
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store',
            Pragma: 'no-cache',
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

  // Load kiosk data
  const loadKioskData = useCallback(
    async (forceRefresh = false, options: { showLoader?: boolean } = {}) => {
      if (!scoreboardId) return;

      // Prevent concurrent loading
      if (isLoadingRef.current && !forceRefresh) return;
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
        const response = await fetch(`/api/kiosk/${scoreboardId}?ts=${Date.now()}`, {
          headers: {
            ...authHeaders,
            'Cache-Control': 'no-cache, no-store',
            Pragma: 'no-cache',
          },
          cache: 'no-store',
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
          const loadedSlides = data.slides || [];

          const pendingSync = pendingSyncRef.current;
          let mergedSlides = loadedSlides as KioskSlide[];
          if (pendingSync && pendingSync.expiresAt > Date.now()) {
            const serverIds = new Set(loadedSlides.map((slide: KioskSlide) => slide.id));

            pendingSync.addedIds.forEach((id) => {
              if (serverIds.has(id)) {
                pendingSync.addedIds.delete(id);
                pendingSync.addedSlides.delete(id);
              }
            });

            pendingSync.deletedIds.forEach((id) => {
              if (!serverIds.has(id)) {
                pendingSync.deletedIds.delete(id);
              }
            });

            // Apply pending positions (from reorder) before other merges
            if (pendingSync.pendingPositions.size > 0) {
              console.log('[KioskSettings] Applying pending positions:', Object.fromEntries(pendingSync.pendingPositions));
              console.log('[KioskSettings] Server positions:', loadedSlides.map((s: KioskSlide) => ({ id: s.id.slice(0, 8), pos: s.position })));
              mergedSlides = mergedSlides.map((slide) => {
                const pendingPos = pendingSync.pendingPositions.get(slide.id);
                if (pendingPos !== undefined) {
                  return { ...slide, position: pendingPos };
                }
                return slide;
              });
              console.log('[KioskSettings] Merged positions:', mergedSlides.map((s) => ({ id: s.id.slice(0, 8), pos: s.position })));
              // Clear positions that now match server
              pendingSync.pendingPositions.forEach((pos, id) => {
                const serverSlide = loadedSlides.find((s: KioskSlide) => s.id === id);
                if (serverSlide && serverSlide.position === pos) {
                  pendingSync.pendingPositions.delete(id);
                }
              });
            }

            mergedSlides = mergedSlides.filter((slide) => !pendingSync.deletedIds.has(slide.id));
            pendingSync.addedIds.forEach((id) => {
              if (!serverIds.has(id)) {
                const pendingSlide = pendingSync.addedSlides.get(id);
                if (pendingSlide) {
                  mergedSlides = [...mergedSlides, pendingSlide];
                }
              }
            });

            // Sort by position after applying pending positions
            mergedSlides.sort((a, b) => a.position - b.position);

            if (pendingSync.addedIds.size === 0 && pendingSync.deletedIds.size === 0 && pendingSync.pendingPositions.size === 0) {
              pendingSyncRef.current = null;
            }
          } else if (pendingSync && pendingSync.expiresAt <= Date.now()) {
            pendingSyncRef.current = null;
          }

          setSlides(mergedSlides);
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
    [scoreboardId, getAuthHeaders, onShowToast, addInitialScoreboardSlide]
  );

  // Fetch just the enabled status on mount (lightweight check for badge display)
  useEffect(() => {
    const fetchEnabledStatus = async () => {
      if (!scoreboardId) return;
      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`/api/kiosk/${scoreboardId}?ts=${Date.now()}`, {
          headers: {
            ...authHeaders,
            'Cache-Control': 'no-cache, no-store',
            Pragma: 'no-cache',
          },
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.config) {
            setEnabled(data.config.enabled);
          }
        }
      } catch (_error) {
        // Silent fail - badge just won't show
      }
    };
    fetchEnabledStatus();
  }, [scoreboardId, getAuthHeaders]);

  useEffect(() => {
    if (!isExpanded || isLoadingRef.current) {
      return;
    }

    const shouldRefresh =
      !hasFetchedRef.current ||
      _lastFetchTime === null ||
      Date.now() - _lastFetchTime > _STALE_THRESHOLD_MS;

    if (shouldRefresh) {
      loadKioskData();
    }
  }, [isExpanded, scoreboardId, _lastFetchTime, loadKioskData]);

  // Reset refs when scoreboardId changes (switching between scoreboards)
  useEffect(() => {
    hasFetchedRef.current = false;
    isLoadingRef.current = false;
    setSlides([]);
    setConfig(null);
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
          'Cache-Control': 'no-cache, no-store',
          Pragma: 'no-cache',
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
        // Don't refresh - Supabase read replicas can return stale slide data
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
          'Cache-Control': 'no-cache, no-store',
          Pragma: 'no-cache',
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
  const uploadImageFile = async (file: File, authHeaders: Record<string, string>): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(`/api/kiosk/${scoreboardId}/upload`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Cache-Control': 'no-cache, no-store',
          Pragma: 'no-cache',
        },
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
          'Cache-Control': 'no-cache, no-store',
          Pragma: 'no-cache',
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
      setSlides((prev) => [...prev, slideData.slide]);
      registerPendingSync({ addedSlide: slideData.slide });
      // Don't auto-refresh - Supabase read replicas can return stale data
      return true;
    } catch (error) {
      console.error('Upload error:', error);
      return false;
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
      for (let i = 0; i < pagesToUpload; i++) {
        const image = images[i];
        const imageFile = new File([image.blob], image.fileName, { type: 'image/png' });

        const success = await uploadImageFile(imageFile, headers);
        if (success) {
          successCount++;
        }

        setUploadProgress({
          current: i + 1,
          total: pagesToUpload,
          status: 'processing',
          message: `Uploaded ${i + 1} of ${pagesToUpload} slides`,
        });
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
      const success = await uploadImageFile(file, headers);

      if (success) {
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
          'Cache-Control': 'no-cache, no-store',
          Pragma: 'no-cache',
        },
        body: JSON.stringify({
          slideType: 'scoreboard',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const data = await response.json();
      setSlides((prev) => [...prev, data.slide]);
      onShowToast('Scoreboard slide added', 'success');
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Failed to add slide', 'error');
    }
  };

  // Delete slide
  const handleDeleteSlide = async (slideId: string) => {
    try {
      registerPendingSync({ deletedId: slideId });
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`/api/kiosk/${scoreboardId}/slides/${slideId}`, {
        method: 'DELETE',
        headers: {
          ...authHeaders,
          'Cache-Control': 'no-cache, no-store',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const result = await response.json();
      if (result.deletedCount === 0) {
        onShowToast('Slide could not be deleted on server. Please refresh.', 'error');
        await loadKioskData(true, { showLoader: false });
        return;
      }

      setSlides((prev) => prev.filter((s) => s.id !== slideId));
      // Don't auto-refresh - Supabase read replicas can have lag
      // User can click Sync if needed
      onShowToast('Slide deleted', 'success');
    } catch (error) {
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

    // Register pending positions to protect from stale server data
    registerPendingSync({
      positions: reorderedSlides.map((s) => ({ id: s.id, position: s.position })),
    });

    // Update UI immediately
    setSlides(reorderedSlides);
    setDraggedSlide(null);

    // Save reordering to server immediately (consistent with add/delete)
    try {
      const authHeaders = await getAuthHeaders();
      const orderResponse = await fetch(`/api/kiosk/${scoreboardId}/slides`, {
        method: 'PUT',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          Pragma: 'no-cache',
        },
        body: JSON.stringify({
          slides: reorderedSlides.map((s) => ({ id: s.id, position: s.position })),
        }),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        throw new Error(error.error || 'Failed to save slide order');
      }
      onShowToast('Slide order updated', 'success');
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Failed to save order', 'error');
      // Revert on error by reloading
      loadKioskData(true);
    }
  };

  // Copy kiosk URL
  const handleCopyKioskUrl = () => {
    const url = `${window.location.origin}/kiosk/${scoreboardId}`;
    navigator.clipboard.writeText(url);
    onShowToast('Kiosk URL copied to clipboard', 'success');
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
      {isExpanded && (
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
                      className="w-full px-3 py-2 pr-10 bg-background border border-input rounded-md text-text-primary focus:border-primary focus:ring-1 focus:ring-primary"
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

              {/* Slides */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-text-primary">
                    Slides ({slides.length}/20)
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadKioskData(true, { showLoader: false })}
                      disabled={isLoading}
                      className="px-3 py-1.5 text-orange-900 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-orange-900/10 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      title="Sync slides with server"
                    >
                      <Icon name="ArrowPathIcon" size={16} />
                      Sync
                    </button>
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
                  <div className="p-3 bg-muted/30 border border-border rounded-lg">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {slides.map((slide, index) => (
                        <div
                          key={slide.id}
                          draggable
                          onDragStart={() => handleDragStart(slide.id)}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(slide.id)}
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

              {/* Actions */}
              <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-border">
                <button
                  onClick={handleSaveConfig}
                  disabled={!hasChanges || isSaving}
                  className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-red-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                  title="Save kiosk settings"
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
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
