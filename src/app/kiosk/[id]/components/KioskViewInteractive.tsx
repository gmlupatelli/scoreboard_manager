'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';
import KioskScoreboard from './KioskScoreboard';
import KioskImageSlide from './KioskImageSlide';
import PinEntryModal from './PinEntryModal';
import SlideContainer from './SlideContainer';

interface SlideData {
  id: string;
  position: number;
  slide_type: 'image' | 'scoreboard';
  image_url: string | null;
  duration_override_seconds: number | null;
}

interface ScoreboardData {
  id: string;
  title: string;
  description: string | null;
  score_type: 'number' | 'time';
  sort_order: 'asc' | 'desc';
  time_format: string | null;
  custom_styles: Record<string, unknown> | null;
}

interface EntryData {
  id: string;
  name: string;
  score: number;
  details: string | null;
}

interface StaticKioskData {
  scoreboard: ScoreboardData;
  config: {
    id: string;
    slideDurationSeconds: number;
    scoreboardPosition: number;
    hasPinProtection: boolean;
    signedUrlExpirySeconds?: number;
  };
  slides: SlideData[];
}

export default function KioskViewInteractive() {
  const params = useParams();
  const scoreboardId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Split state: static data (fetched once, cached) vs dynamic entries (fetched frequently)
  const [staticData, setStaticData] = useState<StaticKioskData | null>(null);
  const [entries, setEntries] = useState<EntryData[]>([]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const cursorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const slideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Build carousel slides array from database order
  const carouselSlides = useCallback(() => {
    if (!staticData) return [];

    const defaultDuration = staticData.config.slideDurationSeconds;
    const slides = staticData.slides.map((slide) => ({
      id: slide.slide_type === 'scoreboard' ? 'scoreboard' : slide.id,
      type: slide.slide_type,
      imageUrl: slide.image_url ?? undefined,
      duration: slide.duration_override_seconds ?? defaultDuration,
    }));

    // If no slides at all, just show scoreboard
    if (slides.length === 0) {
      slides.push({
        id: 'scoreboard',
        type: 'scoreboard' as const,
        imageUrl: undefined,
        duration: defaultDuration,
      });
    }

    return slides;
  }, [staticData]);

  // Fetch static kiosk data (scoreboard, config, slides)
  const fetchStaticData = useCallback(async () => {
    if (!scoreboardId) return;

    try {
      const response = await fetch(`/api/kiosk/public/${scoreboardId}/static`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load kiosk');
      }

      setStaticData(data);

      // Check if PIN protection is enabled
      if (data.config.hasPinProtection && !isPinVerified) {
        setShowPinModal(true);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load kiosk');
    } finally {
      setIsLoading(false);
    }
  }, [scoreboardId, isPinVerified]);

  // Fetch entries data only
  const fetchEntries = useCallback(async () => {
    if (!scoreboardId) return;

    try {
      const response = await fetch(`/api/kiosk/public/${scoreboardId}/entries`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load entries');
      }

      setEntries(data.entries || []);
    } catch (err) {
      console.error('Failed to fetch entries:', err);
    }
  }, [scoreboardId]);

  // Debounced entries refresh
  const debouncedRefreshEntries = useCallback(() => {
    if (refreshDebounceRef.current) {
      clearTimeout(refreshDebounceRef.current);
    }

    refreshDebounceRef.current = setTimeout(() => {
      void fetchEntries();
    }, 2000); // Debounce rapid changes to 2 seconds
  }, [fetchEntries]);

  // Initial load: fetch static data and initial entries
  useEffect(() => {
    void fetchStaticData();
    void fetchEntries();
  }, [fetchStaticData, fetchEntries]);

  // Refresh static data only when signed URLs expire (80% of expiry time)
  useEffect(() => {
    if (!staticData?.config.signedUrlExpirySeconds) return;

    const expirySeconds = staticData.config.signedUrlExpirySeconds;
    const refreshInterval = expirySeconds * 0.8 * 1000;

    const intervalId = setInterval(() => {
      void fetchStaticData();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [staticData?.config.signedUrlExpirySeconds, fetchStaticData]);

  // Auto-advance slides
  useEffect(() => {
    if (!staticData || isPaused || (staticData.config.hasPinProtection && !isPinVerified)) {
      return;
    }

    const slides = carouselSlides();
    if (slides.length <= 1) return;

    const currentSlide = slides[currentSlideIndex];
    const duration = (currentSlide?.duration ?? 10) * 1000;

    slideTimeoutRef.current = setTimeout(() => {
      // Check if next slide is a scoreboard - if so, fetch fresh entries first
      const nextIndex = (currentSlideIndex + 1) % slides.length;
      const nextSlide = slides[nextIndex];

      const advance = () => {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
          setIsTransitioning(false);
        }, 500); // Transition duration
      };

      if (nextSlide?.type === 'scoreboard') {
        // Fetch fresh entries before showing scoreboard
        void fetchEntries().then(advance);
      } else {
        advance();
      }
    }, duration);

    return () => {
      if (slideTimeoutRef.current) {
        clearTimeout(slideTimeoutRef.current);
      }
    };
  }, [staticData, currentSlideIndex, isPaused, isPinVerified, carouselSlides, fetchEntries]);

  // Subscribe to realtime scoreboard entry changes
  useEffect(() => {
    if (!scoreboardId) return;

    const channel = supabase
      .channel(`kiosk-entries-${scoreboardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scoreboard_entries',
          filter: `scoreboard_id=eq.${scoreboardId}`,
        },
        () => {
          // Immediately fetch entries when changes detected (debounced)
          debouncedRefreshEntries();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [scoreboardId, debouncedRefreshEntries]);

  // Auto-hide cursor and controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      document.body.style.cursor = 'default';

      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }

      cursorTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        document.body.style.cursor = 'none';
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
      document.body.style.cursor = 'default';
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          if (document.fullscreenElement) {
            void document.exitFullscreen();
            setIsFullscreen(false);
          }
          break;
        case ' ':
          e.preventDefault();
          setIsPaused((prev) => !prev);
          break;
        case 'ArrowRight':
          setCurrentSlideIndex((prev) => (prev + 1) % carouselSlides().length);
          break;
        case 'ArrowLeft':
          setCurrentSlideIndex(
            (prev) => (prev - 1 + carouselSlides().length) % carouselSlides().length
          );
          break;
        case 'f':
        case 'F':
          void toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carouselSlides]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const handlePinVerified = () => {
    setIsPinVerified(true);
    setShowPinModal(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Loading kiosk...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !staticData) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center max-w-md px-8">
          <Icon name="ExclamationTriangleIcon" size={64} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-white text-2xl font-bold mb-2">Unable to Load Kiosk</h1>
          <p className="text-gray-400">{error || 'Kiosk data not available'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors"
            title="Retry loading kiosk"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // PIN verification modal
  if (showPinModal) {
    return (
      <PinEntryModal
        scoreboardId={scoreboardId}
        onVerified={handlePinVerified}
        onCancel={() => window.history.back()}
      />
    );
  }

  const slides = carouselSlides();
  const _currentSlide = slides[currentSlideIndex];
  const nextSlide = slides[(currentSlideIndex + 1) % slides.length];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden"
      data-testid="kiosk-container"
    >
      {/* Slide rendering - show only active slide with transition */}
      {slides.map((slide, index) => (
        <SlideContainer
          key={`slide-${slide.id}-${index}`}
          isActive={index === currentSlideIndex}
          isTransitioning={isTransitioning && index === currentSlideIndex}
        >
          {slide.type === 'scoreboard' ? (
            <KioskScoreboard scoreboard={staticData.scoreboard} entries={entries} />
          ) : slide.type === 'image' && slide.imageUrl ? (
            <KioskImageSlide
              imageUrl={slide.imageUrl}
              nextImageUrl={nextSlide?.type === 'image' ? nextSlide.imageUrl : undefined}
            />
          ) : null}
        </SlideContainer>
      ))}

      {/* Controls overlay */}
      <div
        data-testid="kiosk-controls"
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top bar with title */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between">
            <h1 className="text-white text-lg font-semibold truncate">
              {staticData.scoreboard.title}
            </h1>
            <div className="flex items-center gap-2 text-white/70 text-sm">
              {isPaused && (
                <span className="flex items-center gap-1">
                  <Icon name="PauseIcon" size={16} />
                  Paused
                </span>
              )}
              <span>
                {currentSlideIndex + 1} / {slides.length}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent pointer-events-auto">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() =>
                setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length)
              }
              className="p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Previous slide"
              title="Previous slide"
            >
              <Icon name="ChevronLeftIcon" size={24} />
            </button>

            <button
              onClick={() => setIsPaused((prev) => !prev)}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
              aria-label={isPaused ? 'Play' : 'Pause'}
              title={isPaused ? 'Resume slideshow' : 'Pause slideshow'}
            >
              <Icon name={isPaused ? 'PlayIcon' : 'PauseIcon'} size={24} />
            </button>

            <button
              onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % slides.length)}
              className="p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Next slide"
              title="Next slide"
            >
              <Icon name="ChevronRightIcon" size={24} />
            </button>

            <div className="w-px h-6 bg-white/20" />

            <button
              onClick={toggleFullscreen}
              className="p-2 text-white/70 hover:text-white transition-colors"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              <Icon
                name={isFullscreen ? 'ArrowsPointingInIcon' : 'ArrowsPointingOutIcon'}
                size={24}
              />
            </button>
          </div>

          {/* Slide indicators */}
          {slides.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlideIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlideIndex ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Keyboard shortcuts hint */}
          <div className="text-center text-white/40 text-xs mt-4">
            <span>Space: Pause</span>
            <span className="mx-2">•</span>
            <span>← →: Navigate</span>
            <span className="mx-2">•</span>
            <span>F: Fullscreen</span>
            <span className="mx-2">•</span>
            <span>ESC: Exit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
