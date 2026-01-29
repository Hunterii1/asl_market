import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Info, CheckCircle } from 'lucide-react';
import { apiService, type LicenseStatus } from '@/services/api';
import { licenseStorage } from '@/utils/licenseStorage';
import { ErrorDisplay } from '@/components/ErrorDisplay';

export function LicenseCheck() {
  const [license, setLicense] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const { user, refreshUserData, licenseStatus: authLicenseStatus } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkLicenseStatus();
  }, []);

  const checkLicenseStatus = async () => {
    try {
      const data = await apiService.checkLicenseStatus();
      setStatus(data);
    } catch (error) {
      console.error('Error checking license status:', error);
      
      // If API call fails, check auth context license status
      if (authLicenseStatus) {
        setStatus(authLicenseStatus);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await apiService.verifyLicense(license);
      toast({
        title: "موفقیت‌آمیز",
        description: result.message || "لایسنس با موفقیت فعال شد!",
      });
      
      // ذخیره لایسنس در storage محلی
      if (user) {
        licenseStorage.storeLicenseInfo(license, new Date().toISOString(), user.email);
      }
      
      // Refresh both local and auth context status
      await checkLicenseStatus();
      await refreshUserData();
      
      // After successful activation, reload the page to let LicenseRequiredRoute re-check
      // This ensures proper access control separation
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      // Error toast is handled by apiService
      console.error('Error verifying license:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshLicense = async () => {
    setRefreshing(true);
    try {
      // Use same API base URL logic as apiService
      const getApiBaseUrl = () => {
        if (typeof window !== 'undefined') {
          const hostname = window.location.hostname;
          if (hostname === 'asllmarket.ir' || hostname === 'www.asllmarket.ir') {
            return 'https://asllmarket.ir/backend/api/v1';
          }
        }
        return 'https://asllmarket.ir/backend/api/v1';
      };
      
      const response = await fetch(`${getApiBaseUrl()}/license/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.has_license) {
          toast({
            title: "بازیابی موفقیت‌آمیز",
            description: data.message,
          });
          
          // Store license info if available
          if (data.license_info && user) {
            licenseStorage.storeLicenseInfo(
              data.license_info.code, 
              data.license_info.used_at, 
              user.email
            );
          }
          
          // Refresh status
          await checkLicenseStatus();
          await refreshUserData();
        } else {
          toast({
            title: "اطلاعات",
            description: data.message,
          });
        }
      } else {
        throw new Error(data.error || 'خطا در بازیابی لایسنس');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "خطا در بازیابی لایسنس",
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (!user) {
    return (
      <Alert>
        <AlertDescription>
          لطفا ابتدا وارد شوید
        </AlertDescription>
      </Alert>
    );
  }

  if (status?.has_license && status?.is_active) {
    return null; // User will be redirected to main page
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto space-y-4">
        <ErrorDisplay onRetry={checkLicenseStatus} />
        <Card>
        <CardHeader>
          <CardTitle className="text-center">فعال‌سازی لایسنس</CardTitle>
        </CardHeader>
        <CardContent>
          {/* نمایش اطلاعات محلی اگر وجود دارد */}
          {licenseStorage.hasStoredLicense() && licenseStorage.isStoredLicenseValid() && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">لایسنس محلی یافت شد:</div>
                <div className="text-sm whitespace-pre-line">
                  {licenseStorage.displayLicenseInfo()}
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {status?.has_license ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                لایسنس شما فعال است! در حال انتقال به صفحه اصلی...
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert className="mb-6">
                <AlertDescription>
                  <div className="space-y-3">
                    <p className="font-medium">کد لایسنس خودتون رو وارد کنید:</p>
                    <p className="text-sm">
                      درصورتی نداشتن کد لایسنس، جهت ثبت نام اشتراک نسخه پلاس یا پرو به آی دی تلگرام زیر پیام بدین 👇
                    </p>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                        @incoming_center
                      </p>
                    </div>
                    <div className="mt-2 p-2 bg-muted/30 rounded-lg border border-border">
                      <p className="text-xs font-semibold text-foreground mb-1">پشتیبانی تلفنی مجموعه:</p>
                      <p className="text-xs text-muted-foreground mb-1">ساعت پاسخگویی 9 تا 17</p>
                      <a href="tel:02188922936-9" className="text-blue-600 dark:text-blue-400 hover:underline font-mono font-bold text-xs">021-88922936-9</a>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>توجه:</strong> هر لایسنس فقط یک بار قابل استفاده است.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    value={license}
                    onChange={(e) => setLicense(e.target.value)}
                    placeholder="لایسنس خود را وارد کنید"
                    required
                    className="text-right"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || refreshing}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        در حال بررسی...
                      </>
                    ) : (
                      'بررسی لایسنس'
                    )}
                  </Button>
                  
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">
                      اگر قبلاً لایسنس فعال کرده‌اید:
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={loading || refreshing}
                      onClick={handleRefreshLicense}
                    >
                      {refreshing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          در حال بازیابی...
                        </>
                      ) : (
                        'بازیابی لایسنس'
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
} 