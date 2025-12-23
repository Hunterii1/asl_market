import { useEffect, useState } from 'react';
import { Users, CheckCircle, Radio, Clock, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MatchingRadarProps {
  totalVisitors: number;
  acceptedCount: number;
  pendingCount?: number;
  rejectedCount?: number;
  isActive?: boolean;
}

export function MatchingRadar({ 
  totalVisitors, 
  acceptedCount, 
  pendingCount = 0,
  rejectedCount = 0,
  isActive = true 
}: MatchingRadarProps) {
  const [rotation, setRotation] = useState(0);
  const [pulseScale, setPulseScale] = useState(1);

  useEffect(() => {
    if (!isActive) return;

    // Rotate radar continuously
    const rotateInterval = setInterval(() => {
      setRotation(prev => (prev + 1) % 360);
    }, 50);

    // Pulse animation
    const pulseInterval = setInterval(() => {
      setPulseScale(prev => prev === 1 ? 1.05 : 1);
    }, 2000);

    return () => {
      clearInterval(rotateInterval);
      clearInterval(pulseInterval);
    };
  }, [isActive]);

  const acceptanceRate = totalVisitors > 0 ? (acceptedCount / totalVisitors) * 100 : 0;
  const pendingRate = totalVisitors > 0 ? (pendingCount / totalVisitors) * 100 : 0;

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800">
      {/* Animated background radar circles */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full"
          style={{
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            transition: 'transform 0.05s linear'
          }}
        >
          {/* Radar lines */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
            {/* Horizontal line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-400 dark:bg-blue-600"></div>
            {/* Vertical line */}
            <div className="absolute left-1/2 top-0 h-full w-0.5 bg-blue-400 dark:bg-blue-600"></div>
            {/* Diagonal lines */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-blue-400 dark:bg-blue-600"
              style={{ transform: 'translate(-50%, -50%) rotate(45deg)' }}
            ></div>
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-blue-400 dark:bg-blue-600"
              style={{ transform: 'translate(-50%, -50%) rotate(-45deg)' }}
            ></div>
          </div>
          
          {/* Concentric circles */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 border-2 border-blue-400 dark:border-blue-600 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 border-2 border-blue-400 dark:border-blue-600 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border-2 border-blue-400 dark:border-blue-600 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Pulsing center dot */}
      {isActive && (
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 dark:bg-blue-400 rounded-full z-10"
          style={{
            transform: `translate(-50%, -50%) scale(${pulseScale})`,
            transition: 'transform 2s ease-in-out',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)'
          }}
        ></div>
      )}

      <CardContent className="relative z-10 p-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Icon */}
          <div className="relative">
            <div className={`p-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg ${
              isActive ? 'animate-pulse' : ''
            }`}>
              <Radio className="w-8 h-8 text-white" />
            </div>
            {isActive && (
              <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75"></div>
            )}
          </div>

          {/* Stats */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {totalVisitors}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">ویزیتور مطلع شده</p>
          </div>

          {/* Acceptance Stats */}
          <div className="grid grid-cols-3 gap-3 w-full">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-lg font-bold text-green-700 dark:text-green-300">
                  {acceptedCount}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">پذیرفته</p>
              {totalVisitors > 0 && (
                <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-1">
                  {acceptanceRate.toFixed(1)}%
                </p>
              )}
            </div>

            {pendingCount > 0 && (
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                    {pendingCount}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">در انتظار</p>
                {totalVisitors > 0 && (
                  <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 mt-1">
                    {pendingRate.toFixed(1)}%
                  </p>
                )}
              </div>
            )}

            {rejectedCount > 0 && (
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-lg font-bold text-red-700 dark:text-red-300">
                    {rejectedCount}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">رد شده</p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {totalVisitors > 0 && (
            <div className="w-full space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>نرخ پذیرش</span>
                <span className="font-semibold">{acceptanceRate.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                  style={{ width: `${acceptanceRate}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className={`px-4 py-2 rounded-full text-xs font-semibold ${
            isActive 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}>
            {isActive ? '🟢 سیستم Matching فعال است' : '⚪ سیستم Matching غیرفعال'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

