import { useEffect, useState } from 'react';
import { CheckCircle, Users, Radio } from 'lucide-react';

interface MatchingConnectionProps {
  isConnected?: boolean;
  visitorCount?: number;
  acceptedCount?: number;
}

export function MatchingConnection({ 
  isConnected = false, 
  visitorCount = 0,
  acceptedCount = 0 
}: MatchingConnectionProps) {
  const [pulseScale, setPulseScale] = useState(1);
  const [connectionLines, setConnectionLines] = useState(false);

  useEffect(() => {
    if (!isConnected) return;

    // Pulse animation
    const pulseInterval = setInterval(() => {
      setPulseScale(prev => prev === 1 ? 1.1 : 1);
    }, 2000);

    // Connection lines animation
    const linesInterval = setInterval(() => {
      setConnectionLines(prev => !prev);
    }, 3000);

    return () => {
      clearInterval(pulseInterval);
      clearInterval(linesInterval);
    };
  }, [isConnected]);

  if (!isConnected) return null;

  return (
    <div className="relative w-full h-32 flex items-center justify-center my-6">
      {/* Connection lines */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`w-full h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 transition-all duration-1000 ${
          connectionLines ? 'opacity-100' : 'opacity-30'
        }`} style={{
          boxShadow: connectionLines ? '0 0 20px rgba(59, 130, 246, 0.6)' : 'none'
        }}></div>
      </div>

      {/* Center connection point */}
      <div className="relative z-10">
        <div 
          className={`w-16 h-16 rounded-full bg-gradient-to-br from-green-500 via-blue-500 to-purple-600 flex items-center justify-center shadow-2xl transition-all duration-500 ${
            isConnected ? 'animate-pulse' : ''
          }`}
          style={{
            transform: `scale(${pulseScale})`,
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(34, 197, 94, 0.4)'
          }}
        >
          <Radio className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        
        {/* Pulsing rings */}
        {isConnected && (
          <>
            <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75"></div>
            <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-50" style={{ animationDelay: '1s' }}></div>
            <div className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-25" style={{ animationDelay: '2s' }}></div>
          </>
        )}

        {/* Stats */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 dark:bg-gray-900/90 px-3 py-1 rounded-full shadow-lg border-2 border-blue-200 dark:border-blue-800">
          <Users className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {visitorCount} ویزیتور
          </span>
          {acceptedCount > 0 && (
            <>
              <span className="text-gray-400">•</span>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold text-green-600">
                {acceptedCount} پذیرفته
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

