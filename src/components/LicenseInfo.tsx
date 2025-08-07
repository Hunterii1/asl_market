import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  Key, 
  Calendar, 
  RefreshCw, 
  AlertTriangle,
  Shield,
  Info
} from 'lucide-react';
import { apiService, type LicenseInfo, type LicenseStatus } from '@/services/api';
import { licenseStorage } from '@/utils/licenseStorage';

export function LicenseInfo() {
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchLicenseData = async () => {
    try {
      setLoading(true);
      
      // دریافت وضعیت لایسنس
      const status = await apiService.checkLicenseStatus();
      setLicenseStatus(status);
      
      if (status.has_license && status.is_active) {
        // دریافت اطلاعات تفصیلی لایسنس
        try {
          const info = await apiService.getLicenseInfo();
          setLicenseInfo(info);
          
          // ذخیره در storage محلی
          licenseStorage.storeLicenseInfo(
            info.license_code,
            info.activated_at
          );
        } catch (err) {
          console.error('Failed to fetch license info:', err);
          
          // در صورت خطا، از storage محلی استفاده کن
          const storedInfo = licenseStorage.getStoredLicenseInfo();
                  if (storedInfo) {
          setLicenseInfo({
            license_code: storedInfo.license_code,
            activated_at: storedInfo.activated_at,
            expires_at: '',
            type: 'plus',
            duration: 12,
            remaining_days: 0,
            remaining_hours: 0,
            is_active: true
          });
        }
        }
      }
    } catch (error) {
      console.error('Error fetching license data:', error);
      
      // در صورت خطا، بررسی storage محلی
      if (licenseStorage.hasStoredLicense() && licenseStorage.isStoredLicenseValid()) {
        const storedInfo = licenseStorage.getStoredLicenseInfo();
        if (storedInfo) {
          setLicenseInfo({
            license_code: storedInfo.license_code,
            activated_at: storedInfo.activated_at,
            expires_at: '',
            type: 'plus',
            duration: 12,
            remaining_days: 0,
            remaining_hours: 0,
            is_active: true
          });
          setLicenseStatus({
            has_license: true,
            is_approved: true,
            is_active: true
          });
        }
      }
      
      toast({
        variant: "destructive",
        title: "خطا",
        description: "خطا در دریافت اطلاعات لایسنس",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLicenseData();
    setRefreshing(false);
    
    toast({
      title: "بروزرسانی شد",
      description: "اطلاعات لایسنس بروزرسانی شد",
    });
  };

  useEffect(() => {
    fetchLicenseData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            اطلاعات لایسنس
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!licenseStatus?.has_license) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            اطلاعات لایسنس
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              شما هنوز لایسنس فعالی ندارید. برای استفاده از تمام امکانات سایت، لطفا لایسنس خود را فعال کنید.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'نامشخص';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          اطلاعات لایسنس
          <Badge variant="secondary" className="mr-auto">
            <CheckCircle className="h-3 w-3 mr-1" />
            فعال
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {licenseInfo && (
          <>
            <div className="flex items-center gap-3">
              <Key className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">کد لایسنس</p>
                <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded mt-1">
                  {licenseInfo.license_code}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">تاریخ فعال‌سازی</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(licenseInfo.activated_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">نوع لایسنس</p>
                <Badge variant={licenseInfo.type === 'pro' ? 'default' : 'secondary'} className="mt-1">
                  {licenseInfo.type === 'pro' ? '💎 پرو' : '🔑 پلاس'} ({licenseInfo.duration || 12} ماه)
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">زمان باقی‌مانده</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {licenseInfo.remaining_days || 0} روز
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {licenseInfo.remaining_hours || 0} ساعت
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  انقضا: {formatDate(licenseInfo.expires_at)}
                </p>
              </div>
            </div>
          </>
        )}

        <div className="flex items-center gap-3">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-sm font-medium">وضعیت</p>
            <p className="text-xs text-green-600">
              {licenseInfo?.is_active ? 'فعال و قابل استفاده' : 'منقضی شده'}
            </p>
          </div>
        </div>

        {/* نمایش اطلاعات storage محلی */}
        {licenseStorage.hasStoredLicense() && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="text-xs">
                اطلاعات لایسنس در مرورگر شما ذخیره شده است تا در صورت پاک شدن cache دسترسی خود را از دست ندهید.
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="pt-2">
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            variant="outline" 
            size="sm"
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'در حال بروزرسانی...' : 'بروزرسانی اطلاعات'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}