import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Headphones, User, Package, Key, Radio, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/utils/imageUrl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

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
  const { isAuthenticated } = useAuth();

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

  const quickLinks = [
    {
      title: 'پشتیبانی و تیکت',
      icon: Headphones,
      path: '/support',
    },
    {
      title: 'پروفایل من',
      icon: User,
      path: '/edit-profile',
    },
    {
      title: 'محصولات من',
      icon: Package,
      path: '/my-products',
    },
    {
      title: 'لایسنس من',
      icon: Key,
      path: '/license-info',
    },
  ];

  return (
    <div className="relative w-full">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:items-stretch">
          {/* Slider - smaller on desktop */}
          <div className="relative w-full lg:w-2/3 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg">
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

          {/* Quick Access Links - only on desktop */}
          <div className="hidden lg:flex flex-col gap-3 w-1/3">
            <div className="p-4 rounded-2xl border-2 border-orange-500/30 bg-white/10 dark:bg-gray-900/10 backdrop-blur-md shadow-lg h-full flex flex-col justify-between">
              {quickLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <button
                    key={index}
                    onClick={() => navigate(link.path)}
                    className="w-full flex items-center justify-between gap-3 p-5 rounded-xl border-2 border-orange-500/30 bg-white/10 dark:bg-gray-900/10 backdrop-blur-md text-gray-800 dark:text-gray-200 hover:bg-white/20 dark:hover:bg-gray-900/20 hover:border-orange-500/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] group mb-3 last:mb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                        <Icon className="w-5 h-5 text-orange-500 group-hover:text-orange-600" />
                      </div>
                      <span className="text-right font-semibold text-base">{link.title}</span>
                    </div>
                  </button>
                );
              })}
              
              {/* ASL Match Button - Desktop only, below quick links */}
              {isAuthenticated && (
                <Button
                  onClick={() => navigate('/asl-match')}
                  className="w-full h-20 bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 hover:from-orange-600 hover:via-orange-700 hover:to-red-700 text-white rounded-xl shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 flex items-center justify-center gap-3 group relative overflow-hidden mt-3"
                >
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400/30 via-orange-500/30 to-red-500/30 animate-pulse"></div>
                  
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  {/* Glowing particles */}
                  <div className="absolute top-0 left-0 w-2 h-2 bg-white rounded-full animate-ping opacity-75" style={{ animationDelay: '0s' }}></div>
                  <div className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute bottom-0 left-1/4 w-2 h-2 bg-white rounded-full animate-ping opacity-75" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute bottom-0 right-1/4 w-2 h-2 bg-white rounded-full animate-ping opacity-75" style={{ animationDelay: '1.5s' }}></div>
                  
                  {/* Content */}
                  <div className="relative z-10 flex items-center gap-3 w-full justify-center">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                      <Radio className="w-6 h-6 text-white group-hover:rotate-180 transition-transform duration-500" />
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-white drop-shadow-lg group-hover:scale-105 transition-transform duration-300">
                          ASL MATCH
                        </span>
                        <Badge className="bg-white/30 text-white border-white/50 text-xs px-2 py-0.5 font-bold backdrop-blur-sm group-hover:bg-white/40 transition-all duration-300 animate-pulse">
                          BETA
                        </Badge>
                      </div>
                      <p className="text-xs text-white/90 font-semibold mt-0.5">
                        سیستم هوشمند اتصال تأمین‌کنندگان و ویزیتورها
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-white/80 group-hover:text-white transition-colors">
                      <span className="text-sm font-semibold">ورود</span>
                      <ArrowLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
