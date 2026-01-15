'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useAuthGuard } from '@/hooks';

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
  _scoreboardTitle: string;
  isExpanded: boolean;
  onToggle: () => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function KioskSettingsSection({
  scoreboardId,
  _scoreboardTitle,
  isExpanded,
  onToggle,
  onShowToast,
}: KioskSettingsSectionProps) {
  const { getAuthHeaders } = useAuthGuard();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<KioskConfig | null>(null);
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

  // Track if slide order has been changed (pending save)
  const [hasSlideOrderChanges, setHasSlideOrderChanges] = useState(false);

  // Track slides with failed images
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Add initial scoreboard slide (called when no slides exist)
  const addInitialScoreboardSlide = useCallback(
    async (headers: Record<string, string>) => {
      try {
        const response = await fetch(`/api/kiosk/${scoreboardId}/slides`, {
          method: 'POST',
          headers: {
            ...headers,
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

  // Load kiosk data
  const loadKioskData = useCallback(
    async (forceRefresh = false) => {
      if (!scoreboardId) return;

      setIsLoading(true);
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/kiosk/${scoreboardId}`, { headers });
        const data = await response.json();

        if (response.ok) {
          if (data.config) {
            setConfig(data.config);
            setEnabled(data.config.enabled);
            setSlideDuration(String(data.config.slide_duration_seconds));
            setScoreboardPosition(data.config.scoreboard_position);
            setPinCode(data.config.pin_code || '');
          }
          const loadedSlides = data.slides || [];
          // Always update slides if forceRefresh, otherwise only if no pending changes
          if (forceRefresh || !hasSlideOrderChanges) {
            setSlides(loadedSlides);
            setHasSlideOrderChanges(false);
          }
          setLastFetchTime(Date.now());
          setFailedImages(new Set()); // Clear failed images on fresh data

          // Auto-add scoreboard slide if no slides exist
          if (loadedSlides.length === 0) {
            addInitialScoreboardSlide(headers);
          }
        }
      } catch (_error) {
        onShowToast('Failed to load kiosk settings', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [scoreboardId, getAuthHeaders, onShowToast, addInitialScoreboardSlide, hasSlideOrderChanges]
  );

  useEffect(() => {
    if (isExpanded && !config && !isLoading) {
      // Only fetch if we have no config and aren't already loading
      loadKioskData();
    }
  }, [isExpanded, config, isLoading, loadKioskData]);

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
      const headers = await getAuthHeaders();

      // Save slide order if changed
      if (hasSlideOrderChanges) {
        const orderResponse = await fetch(`/api/kiosk/${scoreboardId}/slides`, {
          method: 'PUT',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            slides: slides.map((s) => ({ id: s.id, position: s.position })),
          }),
        });

        if (!orderResponse.ok) {
          const error = await orderResponse.json();
          throw new Error(error.error || 'Failed to save slide order');
        }
        setHasSlideOrderChanges(false);
      }

      // Save config settings
      const response = await fetch(`/api/kiosk/${scoreboardId}`, {
        method: 'PUT',
        headers: {
          ...headers,
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
        // Refresh data from server to get accurate state (forceRefresh=true to always update slides)
        await loadKioskData(true);
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
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/kiosk/${scoreboardId}`, {
        method: 'PUT',
        headers: {
          ...headers,
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

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      onShowToast('Invalid file type. Allowed: PNG, JPG, WebP', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onShowToast('File size must be less than 10MB', 'error');
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(`/api/kiosk/${scoreboardId}/upload`, {
        method: 'POST',
        headers,
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
          ...headers,
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
      setSlides((prev) => [...prev, slideData.slide]);
      onShowToast('Slide uploaded successfully', 'success');
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Failed to upload slide', 'error');
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
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/kiosk/${scoreboardId}/slides`, {
        method: 'POST',
        headers: {
          ...headers,
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
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/kiosk/${scoreboardId}/slides/${slideId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      setSlides((prev) => prev.filter((s) => s.id !== slideId));
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

  const handleDrop = (targetSlideId: string) => {
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

    setSlides(reorderedSlides);
    setDraggedSlide(null);
    setHasSlideOrderChanges(true);
    setHasChanges(true);
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
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-md font-medium text-sm flex items-center gap-2 transition-colors bg-primary text-primary-foreground hover:opacity-90"
                      title="Add image slide"
                    >
                      <Icon name="PlusIcon" size={16} />
                      Slide
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                    />
                  </div>
                </div>

                {slides.length === 0 ? (
                  <div className="text-center py-8 bg-muted/50 border-2 border-dashed border-border rounded-lg text-text-secondary">
                    <Icon name="PhotoIcon" size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No slides yet. Add images or the scoreboard slide.</p>
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
                  Drag slides to reorder. Maximum 20 slides.
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
