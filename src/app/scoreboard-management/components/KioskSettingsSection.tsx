'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useAuthGuard } from '@/hooks';

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
  scoreboardTitle,
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

  // Form state
  const [enabled, setEnabled] = useState(false);
  const [slideDuration, setSlideDuration] = useState(10);
  const [scoreboardPosition, setScoreboardPosition] = useState(0);
  const [pinCode, setPinCode] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Drag state
  const [draggedSlide, setDraggedSlide] = useState<string | null>(null);

  // Load kiosk data
  const loadKioskData = useCallback(async () => {
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
          setSlideDuration(data.config.slide_duration_seconds);
          setScoreboardPosition(data.config.scoreboard_position);
          setPinCode(data.config.pin_code || '');
        }
        setSlides(data.slides || []);
      }
    } catch (_error) {
      onShowToast('Failed to load kiosk settings', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [scoreboardId, getAuthHeaders, onShowToast]);

  useEffect(() => {
    if (isExpanded && !config) {
      loadKioskData();
    }
  }, [isExpanded, config, loadKioskData]);

  // Save config
  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/kiosk/${scoreboardId}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled,
          slideDurationSeconds: slideDuration,
          scoreboardPosition,
          pinCode: pinCode || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
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
  const handleAddScoreboardSlide = async () => {
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

    setSlides(reorderedSlides);
    setDraggedSlide(null);

    // Save new order to server
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/kiosk/${scoreboardId}/slides`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slides: reorderedSlides.map((s) => ({ id: s.id, position: s.position })),
        }),
      });
    } catch (_error) {
      onShowToast('Failed to save slide order', 'error');
      loadKioskData(); // Reload to restore original order
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
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon name="TvIcon" size={20} className="text-primary" />
          <span className="font-medium text-text-primary">Kiosk / TV Mode</span>
          {enabled && (
            <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-500 rounded-full">
              Enabled
            </span>
          )}
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
                    <span className="font-medium text-text-primary">Enable Kiosk Mode</span>
                    <p className="text-sm text-text-secondary">
                      Allow this scoreboard to be displayed in full-screen TV mode
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => {
                        setEnabled(e.target.checked);
                        setHasChanges(true);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </div>
                </label>
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
                      setSlideDuration(parseInt(e.target.value) || 10);
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-text-primary focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Scoreboard position */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Scoreboard Position in Carousel
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={scoreboardPosition}
                    onChange={(e) => {
                      setScoreboardPosition(parseInt(e.target.value) || 0);
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-text-primary focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <p className="mt-1 text-xs text-text-secondary">Position 0 = first slide</p>
                </div>
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
                  >
                    <Icon name={showPin ? 'EyeSlashIcon' : 'EyeIcon'} size={18} />
                  </button>
                </div>
                <p className="mt-1 text-xs text-text-secondary">Leave empty for public access</p>
              </div>

              {/* Slides */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-text-primary">
                    Slides ({slides.length}/20)
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddScoreboardSlide}
                      className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                    >
                      + Scoreboard
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                    >
                      + Image
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
                  <div className="text-center py-8 bg-muted rounded-lg text-text-secondary">
                    <Icon name="PhotoIcon" size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No slides yet. Add images or the scoreboard slide.</p>
                  </div>
                ) : (
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
                            : 'border-transparent hover:border-primary/50'
                        }`}
                      >
                        {slide.slide_type === 'scoreboard' ? (
                          <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                            <Icon name="ChartBarIcon" size={24} className="text-primary mb-1" />
                            <span className="text-xs font-medium text-text-primary">
                              Scoreboard
                            </span>
                          </div>
                        ) : slide.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={slide.image_url}
                            alt={slide.file_name || 'Slide'}
                            className="w-full h-full object-cover"
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

                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteSlide(slide.id)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <Icon name="XMarkIcon" size={14} />
                        </button>

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
                )}
                <p className="mt-2 text-xs text-text-secondary">
                  Drag slides to reorder. Maximum 20 slides.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                <button
                  onClick={handleSaveConfig}
                  disabled={!hasChanges || isSaving}
                  className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
                <button
                  onClick={handlePreviewKiosk}
                  disabled={!enabled}
                  className="px-4 py-2 border border-input text-text-primary rounded-md font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon name="EyeIcon" size={16} className="inline mr-2" />
                  Preview Kiosk
                </button>
                <button
                  onClick={handleCopyKioskUrl}
                  className="px-4 py-2 border border-input text-text-primary rounded-md font-medium hover:bg-muted transition-colors"
                >
                  <Icon name="LinkIcon" size={16} className="inline mr-2" />
                  Copy Kiosk URL
                </button>
              </div>

              {/* Info box */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-600 dark:text-blue-400">
                <div className="flex items-start gap-2">
                  <Icon name="InformationCircleIcon" size={18} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Kiosk Mode Tips</p>
                    <ul className="mt-1 space-y-1 text-blue-500/80">
                      <li>
                        • Press <kbd className="px-1 py-0.5 bg-blue-500/10 rounded">F</kbd> to
                        toggle fullscreen
                      </li>
                      <li>
                        • Press <kbd className="px-1 py-0.5 bg-blue-500/10 rounded">Space</kbd> to
                        pause/resume
                      </li>
                      <li>
                        • Use <kbd className="px-1 py-0.5 bg-blue-500/10 rounded">←</kbd>{' '}
                        <kbd className="px-1 py-0.5 bg-blue-500/10 rounded">→</kbd> to navigate
                        manually
                      </li>
                      <li>
                        • Press <kbd className="px-1 py-0.5 bg-blue-500/10 rounded">ESC</kbd> to
                        exit fullscreen
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
