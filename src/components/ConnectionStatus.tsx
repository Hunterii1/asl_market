import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const hostname = window.location.hostname;
        const apiUrl = hostname === 'asllmarket.com' || hostname === 'www.asllmarket.com'
          ? 'https://asllmarket.com/backend/health'
          : 'https://asllmarket.com/backend/health';
        
        const response = await fetch(apiUrl, { 
          method: 'GET',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          setApiStatus('online');
        } else {
          setApiStatus('offline');
        }
      } catch (error) {
        setApiStatus('offline');
      }
    };

    checkApiStatus();
    const interval = setInterval(checkApiStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (!isOnline) {
    return (
      <Badge variant="destructive" className="fixed bottom-4 left-4 z-50 flex items-center gap-2">
        <WifiOff className="w-4 h-4" />
        عدم اتصال به اینترنت
      </Badge>
    );
  }

  if (apiStatus === 'offline') {
    return (
      <Badge variant="destructive" className="fixed bottom-4 left-4 z-50 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        سرور در دسترس نیست
      </Badge>
    );
  }

  if (apiStatus === 'online') {
    return (
      <Badge className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-green-500 text-white">
        <Wifi className="w-4 h-4" />
        متصل
      </Badge>
    );
  }

  return null;
} 