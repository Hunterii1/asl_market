import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    if (sliders.length > 0) {
      // Auto-advance slider every 5 seconds
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % sliders.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [sliders.length]);

  useEffect(() => {
    // Track view when slider changes
    if (sliders[currentIndex]) {
      apiService.trackSliderView(sliders[currentIndex].id).catch(console.error);
    }
  }, [currentIndex, sliders]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + sliders.length) % sliders.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sliders.length);
  };

  const handleSliderClick = async (slider: Slider) => {
    if (!slider.link) return;

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


  if (loading) {
    return null; // Don't show anything while loading
  }

  if (sliders.length === 0) {
    return null; // Don't show slider if no sliders
  }

  return (
    <div className="relative w-full">
      <div className="relative w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        {sliders.map((slider, index) => (
          <div
            key={slider.id}
            className={cn(
              'relative w-full transition-opacity duration-700 ease-in-out',
              index === currentIndex 
                ? 'opacity-100 z-10' 
                : 'opacity-0 z-0 absolute inset-0'
            )}
          >
            <img
              src={getImageUrl(slider.image_url)}
              alt={`Slider ${slider.id}`}
              className="w-full h-auto object-contain cursor-pointer transition-transform duration-700 hover:scale-[1.02] block mx-auto"
              onClick={() => handleSliderClick(slider)}
              loading={index === 0 ? 'eager' : 'lazy'}
              style={{ maxHeight: '80vh' }}
            />
            {/* Overlay gradient for better text readability if needed */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
          </div>
        ))}

        {/* Navigation Arrows */}
        {sliders.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 p-2 sm:p-3 rounded-full transition-all z-20 shadow-lg hover:shadow-xl hover:scale-110 backdrop-blur-sm"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 p-2 sm:p-3 rounded-full transition-all z-20 shadow-lg hover:shadow-xl hover:scale-110 backdrop-blur-sm"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {sliders.length > 1 && (
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-black/30 dark:bg-white/30 backdrop-blur-sm px-3 py-2 rounded-full">
            {sliders.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'rounded-full transition-all duration-300',
                  index === currentIndex
                    ? 'bg-white w-8 h-2 shadow-lg'
                    : 'bg-white/60 hover:bg-white/80 w-2 h-2'
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
