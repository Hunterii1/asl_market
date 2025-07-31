import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { apiService, LicenseStatus } from '@/services/api';

export function LicenseCheck() {
  const [license, setLicense] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkLicenseStatus();
  }, []);

  const checkLicenseStatus = async () => {
    try {
      const data = await apiService.checkLicenseStatus();
      setStatus(data);
      
      // If approved, redirect to dashboard
      if (data.is_approved) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error checking license status:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "خطا در بررسی وضعیت لایسنس",
      });
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

  if (!user) {
    return (
      <Alert>
        <AlertDescription>
          لطفا ابتدا وارد شوید
        </AlertDescription>
      </Alert>
    );
  }

  if (status?.is_approved) {
    return null; // User will be redirected to dashboard
  }

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
                  برای استفاده از امکانات سایت، لطفا لایسنس پلتفرم ASL را وارد کنید.
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