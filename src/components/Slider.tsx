import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const getImageUrl = (imagePath: string) => {
    // Image paths are served from root, not from /backend
    // If imagePath already starts with http, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // For production, use full URL
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'asllmarket.com' || hostname === 'www.asllmarket.com') {
        return `https://asllmarket.com${imagePath}`;
      }
    }
    
    // For local development, use relative path
    return imagePath;
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (sliders.length === 0) {
    return null; // Don't show slider if no sliders
  }

  return (
    <div className="relative w-full mb-8 rounded-2xl overflow-hidden shadow-lg">
      <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
        {sliders.map((slider, index) => (
          <div
            key={slider.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-500',
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            )}
          >
            <img
              src={getImageUrl(slider.image_url)}
              alt={`Slider ${slider.id}`}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => handleSliderClick(slider)}
            />
          </div>
        ))}

        {/* Navigation Arrows */}
        {sliders.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {sliders.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {sliders.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  index === currentIndex
                    ? 'bg-white w-8'
                    : 'bg-white/50 hover:bg-white/75'
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
