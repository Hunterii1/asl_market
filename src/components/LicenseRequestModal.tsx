import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';

interface LicenseRequestModalProps {
  onClose: () => void;
}

export function LicenseRequestModal({ onClose }: LicenseRequestModalProps) {
  const [license, setLicense] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiService.verifyLicense(license);
      toast({
        title: "موفقیت‌آمیز",
        description: "لایسنس با موفقیت ثبت شد و فعال است!",
      });
      
      // بستن مودال و رفرش صفحه تا useAuth لایسنس جدید را بخواند
      onClose();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
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
          <DialogDescription className="text-center">
            برای استفاده از امکانات سایت، لطفا لایسنس خود را وارد کنید
          </DialogDescription>
        </DialogHeader>
        <Alert>
          <AlertDescription>
            کد لایسنس پلتفرم ASL را در کادر زیر وارد کنید.
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
                'فعال‌سازی لایسنس'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 