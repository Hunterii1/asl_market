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
  Shield,
  Mail,
  Phone,
  User,
  Key,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminData {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: string[];
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin: string | null;
  loginCount: number;
}

interface ViewAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: AdminData | null;
}

const statusConfig = {
  active: {
    label: 'فعال',
    className: 'bg-success/10 text-success border-success/20',
    icon: CheckCircle,
  },
  inactive: {
    label: 'غیرفعال',
    className: 'bg-muted text-muted-foreground border-border',
    icon: XCircle,
  },
  suspended: {
    label: 'تعلیق شده',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: AlertCircle,
  },
};

const roleConfig = {
  super_admin: {
    label: 'مدیر کل',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  admin: {
    label: 'مدیر',
    className: 'bg-info/10 text-info border-info/20',
  },
  moderator: {
    label: 'ناظر',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

const permissionLabels: Record<string, string> = {
  'users.manage': 'مدیریت کاربران',
  'users.view': 'مشاهده کاربران',
  'products.manage': 'مدیریت محصولات',
  'products.view': 'مشاهده محصولات',
  'orders.manage': 'مدیریت سفارشات',
  'orders.view': 'مشاهده سفارشات',
  'reports.view': 'مشاهده گزارش‌ها',
  'settings.manage': 'مدیریت تنظیمات',
};

export function ViewAdminDialog({ open, onOpenChange, admin }: ViewAdminDialogProps) {
  if (!admin) return null;

  const StatusIcon = statusConfig[admin.status].icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="w-5 h-5 text-primary" />
            جزئیات مدیر
          </DialogTitle>
          <DialogDescription className="text-right">
            اطلاعات کامل مدیر
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Admin Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-2xl">
                  {admin.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-foreground">{admin.name}</h3>
                    <Badge
                      variant="outline"
                      className={cn('border-2', statusConfig[admin.status].className)}
                    >
                      <StatusIcon className="w-3 h-3 ml-1" />
                      {statusConfig[admin.status].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">شناسه: {admin.id}</p>
                  <Badge
                    variant="outline"
                    className={cn('mt-2 border-2', roleConfig[admin.role].className)}
                  >
                    {roleConfig[admin.role].label}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h4 className="font-semibold text-foreground mb-4">اطلاعات تماس</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">ایمیل</p>
                    <p className="font-medium text-foreground font-mono">{admin.email}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-info" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">شماره تلفن</p>
                    <p className="font-medium text-foreground">{admin.phone}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">نام کاربری</p>
                    <p className="font-medium text-foreground font-mono">{admin.username}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role & Permissions */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h4 className="font-semibold text-foreground mb-4">نقش و دسترسی‌ها</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Key className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">نقش</p>
                    <Badge
                      variant="outline"
                      className={cn('mt-1 border-2', roleConfig[admin.role].className)}
                    >
                      {roleConfig[admin.role].label}
                    </Badge>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">دسترسی‌ها</p>
                  <div className="flex flex-wrap gap-2">
                    {admin.permissions && admin.permissions.length > 0 ? (
                      admin.permissions.map((permission) => (
                        <Badge key={permission} variant="secondary">
                          {permissionLabels[permission] || permission}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">هیچ دسترسی خاصی تعریف نشده</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h4 className="font-semibold text-foreground mb-4">آمار و اطلاعات</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4" />
                    تاریخ ثبت‌نام
                  </div>
                  <p className="text-lg font-semibold text-foreground">{admin.createdAt}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Clock className="w-4 h-4" />
                    آخرین ورود
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {admin.lastLogin || 'هنوز وارد نشده'}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 col-span-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Clock className="w-4 h-4" />
                    تعداد ورودها
                  </div>
                  <p className="text-xl font-bold text-foreground">{admin.loginCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

