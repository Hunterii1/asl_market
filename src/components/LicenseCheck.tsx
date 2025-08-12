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
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const { user, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkLicenseStatus();
  }, []);

  const checkLicenseStatus = async () => {
    try {
      const data = await apiService.checkLicenseStatus();
      setStatus(data);
      
      // If has license and active, no need to stay on license page
      if (data.has_license && data.is_active) {
        navigate('/');
      }
    } catch (error) {
      console.error('Error checking license status:', error);
      // در صورت خطا، بررسی کن که آیا لایسنس محلی وجود دارد
      if (licenseStorage.hasStoredLicense() && licenseStorage.isStoredLicenseValid()) {
        const licenseInfo = licenseStorage.displayLicenseInfo();
        if (licenseInfo) {
          toast({
            title: "اطلاعات لایسنس محلی",
            description: licenseInfo,
            duration: 5000,
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "خطا",
          description: "خطا در بررسی وضعیت لایسنس",
        });
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
      
      // Navigate to main page after successful activation
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
    } catch (error) {
      // Error toast is handled by apiService
      console.error('Error verifying license:', error);
    } finally {
      setLoading(false);
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
                  برای استفاده از امکانات سایت، لطفا لایسنس معتبر ASL را وارد کنید.
                  <br />
                  <strong>توجه:</strong> هر لایسنس فقط یک بار قابل استفاده است.
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
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
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
              </form>
            </>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
} 