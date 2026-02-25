import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { apiService } from '@/services/api';

type PopupType = 'license' | 'post_login' | 'browsing';

interface PopupStatus {
  should_show_popup: boolean;
  popup_type?: PopupType;
  has_license: boolean;
  message?: string;
}

const GUEST_POPUP_SHOWN_KEY = 'asl_guest_popup_shown';
const GUEST_POPUP_TIMESTAMP_KEY = 'asl_guest_popup_timestamp';

export function useLicensePopup() {
  const { user, isAuthenticated } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [showLoginOption, setShowLoginOption] = useState(false);
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);

  // Check if user should see popup (for logged-in users)
  const checkPopupStatus = useCallback(async () => {
    const token = apiService.getToken();
    if (!token) return;

    try {
      const response = await fetch('/api/v1/popup/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: PopupStatus = await response.json();
        
        if (data.should_show_popup && !data.has_license) {
          // Show popup based on type
          if (data.popup_type === 'post_login') {
            // Show immediately after login
            setShowLoginOption(false);
            setShowPopup(true);
          } else if (data.popup_type === 'browsing') {
            // Show after 2 minutes
            setTimeout(() => {
              setShowLoginOption(false);
              setShowPopup(true);
            }, 2 * 60 * 1000); // 2 minutes
          }
        }
      }
    } catch (error) {
      console.error('Failed to check popup status:', error);
    }
  }, [isAuthenticated]);

  // Mark popup as seen
  const markPopupSeen = useCallback(async (popupType: PopupType) => {
    const token = apiService.getToken();
    if (!token) return;

    try {
      await fetch('/api/v1/popup/mark-seen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ popup_type: popupType }),
      });
    } catch (error) {
      console.error('Failed to mark popup as seen:', error);
    }
  }, []);

  // Handle popup close
  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
    
    if (isAuthenticated && user) {
      // For logged-in users, mark as seen in backend
      // Determine which popup type based on current state
      if (!hasCheckedStatus) {
        markPopupSeen('post_login');
      } else {
        markPopupSeen('browsing');
      }
    } else {
      // For guests, mark in localStorage
      localStorage.setItem(GUEST_POPUP_SHOWN_KEY, 'true');
      localStorage.setItem(GUEST_POPUP_TIMESTAMP_KEY, Date.now().toString());
    }
  }, [isAuthenticated, user, hasCheckedStatus, markPopupSeen]);

  // Check for guest users (not logged in)
  useEffect(() => {
    if (!isAuthenticated && !user) {
      // Check if popup was already shown
      const hasShownBefore = localStorage.getItem(GUEST_POPUP_SHOWN_KEY) === 'true';
      const lastShownTimestamp = localStorage.getItem(GUEST_POPUP_TIMESTAMP_KEY);
      
      // Reset after 24 hours
      if (lastShownTimestamp) {
        const dayInMs = 24 * 60 * 60 * 1000;
        if (Date.now() - parseInt(lastShownTimestamp) > dayInMs) {
          localStorage.removeItem(GUEST_POPUP_SHOWN_KEY);
          localStorage.removeItem(GUEST_POPUP_TIMESTAMP_KEY);
        }
      }

      if (!hasShownBefore) {
        // Show popup after 1.5 minutes for guests
        const timer = setTimeout(() => {
          setShowLoginOption(true);
          setShowPopup(true);
        }, 90 * 1000); // 1.5 minutes

        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, user]);

  // Check for logged-in users
  useEffect(() => {
    if (isAuthenticated && user && !hasCheckedStatus) {
      setHasCheckedStatus(true);
      checkPopupStatus();
    }
  }, [isAuthenticated, user, hasCheckedStatus, checkPopupStatus]);

  // Reset popup status (for testing)
  const resetPopupStatus = useCallback(async () => {
    if (!isAuthenticated) {
      localStorage.removeItem(GUEST_POPUP_SHOWN_KEY);
      localStorage.removeItem(GUEST_POPUP_TIMESTAMP_KEY);
      return;
    }

    const token = apiService.getToken();
    if (!token) return;

    try {
      await fetch('/api/v1/popup/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Failed to reset popup status:', error);
    }
  }, [isAuthenticated]);

  return {
    showPopup,
    showLoginOption,
    handleClosePopup,
    resetPopupStatus, // Exposed for testing/debugging
  };
}
