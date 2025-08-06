import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  X, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Server,
  Shield,
  User
} from 'lucide-react';

interface ErrorInfo {
  type: 'network' | 'auth' | 'license' | 'server' | 'validation' | 'unknown';
  message: string;
  timestamp: number;
  statusCode?: number;
}

interface Props {
  onRetry?: () => void;
  showConnectionStatus?: boolean;
  className?: string;
}

export function ErrorDisplay({ onRetry, showConnectionStatus = true, className = "" }: Props) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastError, setLastError] = useState<ErrorInfo | null>(null);
  const [showError, setShowError] = useState(false);

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

  // Listen for custom error events
  useEffect(() => {
    const handleError = (event: CustomEvent<ErrorInfo>) => {
      setLastError(event.detail);
      setShowError(true);
    };

    window.addEventListener('asl-error' as any, handleError);

    return () => {
      window.removeEventListener('asl-error' as any, handleError);
    };
  }, []);

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'network':
        return <WifiOff className="h-4 w-4" />;
      case 'auth':
        return <User className="h-4 w-4" />;
      case 'license':
        return <Shield className="h-4 w-4" />;
      case 'server':
        return <Server className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getErrorVariant = (type: string) => {
    switch (type) {
      case 'network':
        return 'destructive' as const;
      case 'auth':
        return 'default' as const;
      case 'license':
        return 'default' as const;
      default:
        return 'destructive' as const;
    }
  };

  const handleRetry = () => {
    setShowError(false);
    setLastError(null);
    if (onRetry) {
      onRetry();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) {
      return 'الان';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)} دقیقه پیش`;
    } else {
      return new Date(timestamp).toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (!showConnectionStatus && !showError) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Connection Status */}
      {showConnectionStatus && (
        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
          <div className="flex items-center gap-2 text-sm">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span>متصل به اینترنت</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span>عدم اتصال به اینترنت</span>
              </>
            )}
          </div>
          <Badge variant={isOnline ? "secondary" : "destructive"} className="text-xs">
            {isOnline ? "آنلاین" : "آفلاین"}
          </Badge>
        </div>
      )}

      {/* Error Display */}
      {showError && lastError && (
        <Alert variant={getErrorVariant(lastError.type)} className="relative">
          <div className="flex items-start gap-3">
            {getErrorIcon(lastError.type)}
            <div className="flex-1 min-w-0">
              <AlertDescription>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium mb-1">
                      {lastError.message}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatTimestamp(lastError.timestamp)}</span>
                      {lastError.statusCode && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {lastError.statusCode}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {lastError.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {onRetry && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleRetry}
                        className="h-6 w-6 p-0"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowError(false)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {/* Offline Mode Alert */}
      {!isOnline && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            شما در حالت آفلاین هستید. برخی از امکانات ممکن است در دسترس نباشند.
            {lastError && (
              <div className="mt-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  تلاش مجدد
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Helper function to dispatch error events
export const dispatchError = (error: Omit<ErrorInfo, 'timestamp'>) => {
  const errorEvent = new CustomEvent('asl-error', {
    detail: {
      ...error,
      timestamp: Date.now(),
    },
  });
  window.dispatchEvent(errorEvent);
};