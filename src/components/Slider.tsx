import { useState, useEffect, useRef } from 'react';
import { apiService } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/utils/imageUrl';

interface Slider {
  id: number;
  image_url: string;
  link: string;
  link_type: 'internal' | 'external';
  order: number;
}

export default function Slider() {
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadSliders();
  }, []);

  const loadSliders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getActiveSliders();
      if (response && response.sliders) {
        setSliders(response.sliders);
        // Track view for first slider
        if (response.sliders.length > 0) {
          apiService.trackSliderView(response.sliders[0].id).catch(console.error);
        }
      }
    } catch (error) {
      console.error('Error loading sliders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sliders.length > 0 && !isPaused) {
      // Reset progress
      setProgress(0);
      
      // Progress bar animation
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            return 0;
          }
          return prev + 2; // 2% every 100ms = 100% in 5 seconds
        });
      }, 100);
      progressIntervalRef.current = progressInterval;

      // Auto-advance slider every 5 seconds
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % sliders.length);
        setProgress(0);
      }, 5000);

      return () => {
        clearInterval(interval);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
    } else {
      // Pause progress when hovered or dragging
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  }, [sliders.length, isPaused, currentIndex]);

  useEffect(() => {
    // Track view when slider changes
    if (sliders[currentIndex]) {
      apiService.trackSliderView(sliders[currentIndex].id).catch(console.error);
    }
  }, [currentIndex, sliders]);

  const handleSliderClick = async (slider: Slider) => {
    if (!slider.link || isDragging) return;

    // Track click
    try {
      await apiService.trackSliderClick(slider.id);
    } catch (error) {
      console.error('Error tracking click:', error);
    }

    // Navigate based on link type
    if (slider.link_type === 'internal') {
      navigate(slider.link);
    } else {
      window.open(slider.link, '_blank');
    }
  };

  // Touch/Mouse drag handlers
  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
    setIsPaused(true);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startX;
    setTranslateX(diff);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    
    const threshold = 50; // Minimum drag distance to change slide
    if (Math.abs(translateX) > threshold) {
      if (translateX > 0) {
        // Swipe right - go to previous
        setCurrentIndex((prev) => (prev - 1 + sliders.length) % sliders.length);
      } else {
        // Swipe left - go to next
        setCurrentIndex((prev) => (prev + 1) % sliders.length);
      }
    }
    
    setIsDragging(false);
    setTranslateX(0);
    setStartX(0);
    setIsPaused(false);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleEnd();
    }
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };


  if (loading) {
    return null; // Don't show anything while loading
  }

  if (sliders.length === 0) {
    return null; // Don't show slider if no sliders
  }

  return (
    <div 
      className="relative w-full group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div 
        ref={sliderRef}
        className="relative w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'pan-x pan-y pinch-zoom'
        }}
      >
        <div 
          className="flex transition-transform duration-700 ease-in-out"
          style={{
            transform: isDragging 
              ? `translateX(calc(-${currentIndex * 100}% + ${translateX}px))`
              : `translateX(-${currentIndex * 100}%)`,
            width: `${sliders.length * 100}%`
          }}
        >
          {sliders.map((slider, index) => (
            <div
              key={slider.id}
              className="relative flex-shrink-0"
              style={{ width: `${100 / sliders.length}%` }}
            >
              <div className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[85vh] xl:h-[90vh] flex items-center justify-center overflow-hidden">
                <img
                  src={getImageUrl(slider.image_url)}
                  alt={`Slider ${slider.id}`}
                  className={cn(
                    "w-full h-full object-contain cursor-pointer transition-transform duration-700",
                    !isDragging && "hover:scale-[1.01]",
                    isDragging && "scale-100"
                  )}
                  onClick={() => handleSliderClick(slider)}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  draggable={false}
                />
                {/* Subtle overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar - Show on hover for desktop, always on mobile */}
        {sliders.length > 1 && !isPaused && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10 z-20 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity duration-300">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Dots Indicator - Only show on hover for desktop, always on mobile */}
        {sliders.length > 1 && (
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-black/20 dark:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity duration-300">
            {sliders.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setProgress(0);
                  setIsPaused(true);
                  setTimeout(() => setIsPaused(false), 3000);
                }}
                className={cn(
                  'rounded-full transition-all duration-300 hover:scale-110',
                  index === currentIndex
                    ? 'bg-white dark:bg-gray-200 w-8 h-2 shadow-lg'
                    : 'bg-white/60 dark:bg-gray-400/60 hover:bg-white/80 dark:hover:bg-gray-400/80 w-2 h-2'
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-30 min-h-[300px]">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
