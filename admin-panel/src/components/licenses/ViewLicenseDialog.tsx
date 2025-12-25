import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

interface LicenseData {
  id: string;
  licenseKey: string;
  userId: string;
  userName: string;
  productId: string;
  productName: string;
  licenseType: 'trial' | 'monthly' | 'yearly' | 'lifetime';
  activatedAt?: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  maxActivations: number;
  currentActivations: number;
  notes?: string;
  createdAt?: string;
}

interface ViewLicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  license: LicenseData | null;
}

const statusConfig = {
  active: {
    label: 'فعال',
    className: 'bg-success/10 text-success border-success/20',
    icon: CheckCircle,
  },
  expired: {
    label: 'منقضی شده',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: XCircle,
  },
  suspended: {
    label: 'تعلیق شده',
    className: 'bg-warning/10 text-warning border-warning/20',
    icon: AlertCircle,
  },
  revoked: {
    label: 'لغو شده',
    className: 'bg-muted text-muted-foreground border-border',
    icon: XCircle,
  },
};

const typeConfig = {
  trial: {
    label: 'آزمایشی',
    className: 'bg-info/10 text-info border-info/20',
  },
  monthly: {
    label: 'ماهانه',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  yearly: {
    label: 'سالانه',
    className: 'bg-success/10 text-success border-success/20',
  },
  lifetime: {
    label: 'مادام‌العمر',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
};

export function ViewLicenseDialog({ open, onOpenChange, license }: ViewLicenseDialogProps) {
  if (!license) return null;

  const StatusIcon = statusConfig[license.status].icon;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(license.licenseKey);
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
                    className={cn('border-2', statusConfig[license.status].className)}
                  >
                    <StatusIcon className="w-3 h-3 ml-1" />
                    {statusConfig[license.status].label}
                  </Badge>
                </div>
                <Badge
                  variant="outline"
                  className={cn('border-2', typeConfig[license.licenseType].className)}
                >
                  {typeConfig[license.licenseType].label}
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
                    {license.licenseKey}
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
                    <p className="font-medium text-foreground">{license.userName}</p>
                    <p className="text-xs text-muted-foreground mt-1">شناسه: {license.userId}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-info" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">محصول</p>
                    <p className="font-medium text-foreground">{license.productName}</p>
                    <p className="text-xs text-muted-foreground mt-1">شناسه: {license.productId}</p>
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
                    تاریخ فعال‌سازی
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {license.activatedAt || 'هنوز فعال نشده'}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4" />
                    تاریخ انقضا
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {license.expiresAt || 'نامحدود'}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <CheckCircle className="w-4 h-4" />
                    فعال‌سازی‌های فعلی
                  </div>
                  <p className="text-xl font-bold text-foreground">{license.currentActivations}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Key className="w-4 h-4" />
                    حداکثر فعال‌سازی
                  </div>
                  <p className="text-xl font-bold text-foreground">{license.maxActivations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {license.notes && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-2">یادداشت</h4>
                <p className="text-sm text-muted-foreground">{license.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

