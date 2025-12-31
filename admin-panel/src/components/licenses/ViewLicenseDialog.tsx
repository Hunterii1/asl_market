import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Key,
  User,
  Package,
  Calendar,
  Hash,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface License {
  id: string;
  code: string;
  type: 'pro' | 'plus' | 'plus4';
  duration: number;
  is_used: boolean;
  used_by?: number;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  used_at?: string;
  expires_at?: string;
  generated_by: number;
  admin?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
}

interface ViewLicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  license: License | null;
}

const statusConfig = {
  used: {
    label: 'استفاده شده',
    className: 'bg-info/10 text-info border-info/20',
    icon: CheckCircle,
  },
  available: {
    label: 'در دسترس',
    className: 'bg-success/10 text-success border-success/20',
    icon: CheckCircle,
  },
};

const typeConfig = {
  pro: {
    label: 'پرو',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  plus: {
    label: 'پلاس',
    className: 'bg-success/10 text-success border-success/20',
  },
  plus4: {
    label: 'پلاس ۴',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
};

export function ViewLicenseDialog({ open, onOpenChange, license }: ViewLicenseDialogProps) {
  if (!license) return null;

  const statusKey = license.is_used ? 'used' : 'available';
  const StatusIcon = statusConfig[statusKey].icon;
  const userName = license.user ? `${license.user.first_name || ''} ${license.user.last_name || ''}`.trim() : 'بدون کاربر';

  const handleCopyKey = () => {
    navigator.clipboard.writeText(license.code);
    toast({
      title: 'کپی شد',
      description: 'کد لایسنس در کلیپ‌بورد کپی شد.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Key className="w-5 h-5 text-primary" />
            جزئیات لایسنس
          </DialogTitle>
          <DialogDescription className="text-right">
            اطلاعات کامل لایسنس
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">لایسنس #{license.id}</h3>
                  <Badge
                    variant="outline"
                    className={cn('border-2', statusConfig[statusKey].className)}
                  >
                    <StatusIcon className="w-3 h-3 ml-1" />
                    {statusConfig[statusKey].label}
                  </Badge>
                </div>
                <Badge
                  variant="outline"
                  className={cn('border-2', typeConfig[license.type].className)}
                >
                  {typeConfig[license.type].label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* License Key */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">کد لایسنس</p>
                  </div>
                  <p className="font-mono text-lg font-bold text-foreground dir-ltr text-left">
                    {license.code}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyKey}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4 ml-2" />
                  کپی
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User & Product Information */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h4 className="font-semibold text-foreground mb-4">اطلاعات مرتبط</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">کاربر</p>
                    <p className="font-medium text-foreground">{userName}</p>
                    {license.user?.email && (
                      <p className="text-xs text-muted-foreground mt-1">{license.user.email}</p>
                    )}
                    {license.user?.phone && (
                      <p className="text-xs text-muted-foreground mt-1">{license.user.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates & Activations */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h4 className="font-semibold text-foreground mb-4">زمان‌بندی و فعال‌سازی</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4" />
                    تاریخ استفاده
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {license.used_at ? new Date(license.used_at).toLocaleDateString('fa-IR') : 'هنوز استفاده نشده'}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4" />
                    تاریخ انقضا
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {license.expires_at ? new Date(license.expires_at).toLocaleDateString('fa-IR') : 'نامحدود'}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4" />
                    مدت زمان (ماه)
                  </div>
                  <p className="text-xl font-bold text-foreground">{license.duration}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4" />
                    تاریخ ایجاد
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {new Date(license.created_at).toLocaleDateString('fa-IR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </DialogContent>
    </Dialog>
  );
}

