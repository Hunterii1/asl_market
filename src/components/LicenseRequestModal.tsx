import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { apiService, type LicenseStatus } from '@/services/api';

interface LicenseRequestModalProps {
  onClose: () => void;
}

export function LicenseRequestModal({ onClose }: LicenseRequestModalProps) {
  const [license, setLicense] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkLicenseStatus();
  }, []);

  const checkLicenseStatus = async () => {
    try {
      const data = await apiService.checkLicenseStatus();
      setStatus(data);
      
      // If approved, close modal
      if (data.is_approved) {
        onClose();
      }
    } catch (error) {
      console.error('Error checking license status:', error);
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">فعال‌سازی لایسنس</DialogTitle>
        </DialogHeader>
        {status?.has_license ? (
          <Alert>
            <AlertDescription>
              لایسنس شما ثبت شده و در انتظار تأیید است. لطفا صبور باشید.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert>
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
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  بعداً
                </Button>
                <Button
                  type="submit"
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
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 