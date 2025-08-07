import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ExternalLink, Gift } from 'lucide-react';
import { apiService } from '@/services/api';

interface MarketingPopupData {
  id: number;
  title: string;
  message: string;
  discount_url: string;
  button_text: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  show_count: number;
  click_count: number;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface MarketingPopupProps {
  isAuthenticated?: boolean;
  onClose?: () => void;
}

const MarketingPopup: React.FC<MarketingPopupProps> = ({ 
  isAuthenticated = false,
  onClose 
}) => {
  const [popup, setPopup] = useState<MarketingPopupData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Only show popup once per session and if user is authenticated
    if (!isAuthenticated || hasShown) return;

    const checkForPopup = async () => {
      try {
        const response = await apiService.getActiveMarketingPopup();
        if (response.popup) {
          setPopup(response.popup);
          // Show popup after a short delay for better UX
          setTimeout(() => {
            setIsVisible(true);
            setHasShown(true);
          }, 2000);
        }
      } catch (error) {
        console.error('Error fetching marketing popup:', error);
      }
    };

    checkForPopup();
  }, [isAuthenticated, hasShown]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setPopup(null);
      if (onClose) onClose();
    }, 300);
  };

  const handleDiscountClick = async () => {
    if (popup?.discount_url && popup.id) {
      // Track click
      try {
        await apiService.trackPopupClick(popup.id);
      } catch (error) {
        console.error('Error tracking popup click:', error);
      }

      // Open link in new tab
      window.open(popup.discount_url, '_blank');
      
      // Close popup after click
      handleClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!popup || !isVisible) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleOverlayClick}
      dir="rtl"
    >
      <Card 
        className={`w-full max-w-md bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800 shadow-2xl transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-0 relative overflow-hidden">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 left-2 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Header with icon */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 text-center relative">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="w-6 h-6" />
              <h3 className="text-lg font-bold">{popup.title}</h3>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-2 right-4 w-12 h-12 border-2 border-white rounded-full"></div>
              <div className="absolute bottom-2 left-4 w-8 h-8 border-2 border-white rounded-full"></div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
              {popup.message}
            </p>

            {/* Action buttons */}
            <div className="space-y-3">
              {popup.discount_url && (
                <Button
                  onClick={handleDiscountClick}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <ExternalLink className="w-4 h-4 ml-2" />
                  {popup.button_text || 'مشاهده تخفیف'}
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 rounded-xl"
              >
                بستن
              </Button>
            </div>
          </div>

          {/* Priority badge */}
          {popup.priority > 5 && (
            <Badge 
              className="absolute top-4 right-4 bg-red-500 text-white text-xs"
            >
              فوری
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingPopup;