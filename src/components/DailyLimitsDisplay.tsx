import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Building, 
  Clock, 
  AlertTriangle,
  Zap
} from 'lucide-react';
import { apiService } from '@/services/api';

interface DailyLimits {
  license_type: string;
  visitor_limits: {
    used: number;
    max: number;
    remaining: number;
  };
  supplier_limits: {
    used: number;
    max: number;
    remaining: number;
  };
  date: string;
}

interface DailyLimitsDisplayProps {
  className?: string;
}

export function DailyLimitsDisplay({ className }: DailyLimitsDisplayProps) {
  const [limits, setLimits] = useState<DailyLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLimits = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getDailyLimitsStatus();
      setLimits(data);
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
    return <Badge variant="secondary">🔑 پلاس</Badge>;
  };

  const getProgressColor = (used: number, max: number) => {
    const percentage = (used / max) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const isLimitReached = (remaining: number) => remaining <= 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          محدودیت‌های روزانه
          {getLicenseTypeBadge(limits.license_type)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visitor Limits */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">مشاهده ویزیتورها</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {limits.visitor_limits.used} / {limits.visitor_limits.max}
              </span>
              {isLimitReached(limits.visitor_limits.remaining) && (
                <Badge variant="destructive" className="text-xs">
                  محدود شده
                </Badge>
              )}
            </div>
          </div>
          <Progress 
            value={(limits.visitor_limits.used / limits.visitor_limits.max) * 100}
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {limits.visitor_limits.remaining > 0 
              ? `${limits.visitor_limits.remaining} مشاهده باقی‌مانده`
              : 'محدودیت امروز به پایان رسیده'
            }
          </p>
        </div>

        {/* Supplier Limits */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">مشاهده تأمین‌کنندگان</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {limits.supplier_limits.used} / {limits.supplier_limits.max}
              </span>
              {isLimitReached(limits.supplier_limits.remaining) && (
                <Badge variant="destructive" className="text-xs">
                  محدود شده
                </Badge>
              )}
            </div>
          </div>
          <Progress 
            value={(limits.supplier_limits.used / limits.supplier_limits.max) * 100}
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {limits.supplier_limits.remaining > 0 
              ? `${limits.supplier_limits.remaining} مشاهده باقی‌مانده`
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
        {(isLimitReached(limits.visitor_limits.remaining) || isLimitReached(limits.supplier_limits.remaining)) && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              برخی از محدودیت‌های روزانه شما به پایان رسیده است. برای افزایش محدودیت، لایسنس پرو تهیه کنید.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}