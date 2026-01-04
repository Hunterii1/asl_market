import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  AlertTriangle,
  Zap,
  Package
} from 'lucide-react';
import { apiService } from '@/services/api';

interface AvailableProductLimits {
  license_type: string;
  available_product_limits: {
    used: number;
    max: number;
    remaining: number;
  };
  date: string;
}

interface AvailableProductLimitsDisplayProps {
  className?: string;
}

export function AvailableProductLimitsDisplay({ className }: AvailableProductLimitsDisplayProps) {
  const [limits, setLimits] = useState<AvailableProductLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLimits = async () => {
    try {
      setLoading(true);
      setError(null);
      const dailyLimits = await apiService.getDailyLimitsStatus();
      
      // Only extract available product limits
      if (dailyLimits?.available_product_limits) {
        setLimits({
          license_type: dailyLimits.license_type,
          available_product_limits: dailyLimits.available_product_limits,
          date: dailyLimits.date
        });
      } else {
        setError('محدودیت کالاهای موجود یافت نشد');
      }
    } catch (err: any) {
      setError('خطا در دریافت محدودیت‌های روزانه');
      console.error('Failed to fetch daily limits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLimits();
  }, []);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="mr-2 text-sm text-muted-foreground">در حال بارگذاری...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !limits) {
    return (
      <Alert className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error || 'خطا در نمایش محدودیت‌ها'}</AlertDescription>
      </Alert>
    );
  }

  const getLicenseTypeBadge = (type: string) => {
    if (type === 'pro') {
      return <Badge className="bg-gradient-to-r from-purple-500 to-blue-500">💎 پرو</Badge>;
    }
    if (type === 'plus4') {
      return <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500">⭐ پلاس 4 ماهه</Badge>;
    }
    return <Badge variant="secondary">🔑 پلاس</Badge>;
  };

  const getProgressColor = (used: number, max: number) => {
    const percentage = (used / max) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const isLimitReached = limits.available_product_limits.remaining <= 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          محدودیت مشاهده کالاهای موجود
          {getLicenseTypeBadge(limits.license_type)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Available Product Limits */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">مشاهده کالاهای موجود</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`text-xs rounded-full ${
                limits.available_product_limits.remaining <= 0
                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                  : "bg-purple-500/20 text-purple-400 border-purple-500/30"
              }`}>
                {limits.available_product_limits.remaining} مونده
              </Badge>
              <span className="text-xs text-muted-foreground">
                {limits.available_product_limits.used} / {limits.available_product_limits.max}
              </span>
            </div>
          </div>
          <Progress 
            value={(limits.available_product_limits.used / limits.available_product_limits.max) * 100}
            className="h-2"
          />
          <p className="text-xs text-muted-foreground text-center">
            {limits.available_product_limits.remaining > 0 
              ? `${limits.available_product_limits.remaining} مشاهده باقی‌مانده`
              : 'محدودیت امروز به پایان رسیده'
            }
          </p>
        </div>

        {/* Reset Info */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              محدودیت‌ها فردا بازنشانی می‌شوند
            </span>
          </div>
        </div>

        {/* Warning for limits reached */}
        {isLimitReached && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              محدودیت روزانه مشاهده کالاهای موجود شما به پایان رسیده است. برای افزایش محدودیت، لایسنس پرو تهیه کنید.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
