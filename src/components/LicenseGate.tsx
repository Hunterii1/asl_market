import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { apiService, type LicenseStatus } from '@/services/api';

interface LicenseGateProps {
  children: React.ReactNode;
}

export function LicenseGate({ children }: LicenseGateProps) {
  const [license, setLicense] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkLicenseStatus();
  }, []);

  const checkLicenseStatus = async () => {
    try {
      const data = await apiService.checkLicenseStatus();
      setStatus(data);
    } catch (error: any) {
      // If error is 403 with needs_license or not approved, show the form
      if (error.response?.status === 403) {
        const data = await error.response.json();
        setStatus({
          has_license: data.has_license,
          is_approved: data.is_approved,
          is_active: false, // در صورت خطا، لایسنس فعال نیست
        });
      } else {
        console.error('Error checking license status:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiService.verifyLicense(license);
      toast({
        title: "موفقیت‌آمیز",
        description: "لایسنس با موفقیت ثبت شد. لطفا منتظر تأیید ادمین باشید.",
      });
      checkLicenseStatus(); // Refresh status
    } catch (error) {
      // Error toast is handled by apiService
      console.error('Error verifying license:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">در حال بررسی وضعیت لایسنس...</p>
        </div>
      </div>
    );
  }

  // If approved, show the content
  if (status?.is_approved) {
    return <>{children}</>;
  }

  // Show license form
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">فعال‌سازی لایسنس</CardTitle>
        </CardHeader>
        <CardContent>
          {status?.has_license ? (
            <Alert>
              <AlertDescription>
                لایسنس شما ثبت شده و در انتظار تأیید است. لطفا صبور باشید.
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
  );
} 