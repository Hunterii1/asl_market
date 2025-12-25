import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  FileText,
  AlertCircle,
  Users,
  Calendar,
  Link,
  Image,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MousePointerClick,
  Volume2,
  Vibrate,
  VolumeX,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationData {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'email' | 'sms' | 'telegram' | 'push';
  status: 'sent' | 'pending' | 'failed' | 'draft';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recipientType: 'all' | 'specific' | 'group';
  recipientIds?: string[];
  scheduledAt?: string;
  actionUrl?: string;
  actionText?: string;
  icon?: string;
  imageUrl?: string;
  sound: boolean;
  vibrate: boolean;
  silent: boolean;
  expiresAt?: string;
  metadata?: Record<string, any>;
  sentAt?: string | null;
  readCount?: number;
  clickCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ViewNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification: NotificationData | null;
}

const statusConfig = {
  sent: {
    label: 'ارسال شده',
    className: 'bg-success/10 text-success border-success/20',
    icon: CheckCircle,
  },
  pending: {
    label: 'در انتظار',
    className: 'bg-warning/10 text-warning border-warning/20',
    icon: Clock,
  },
  failed: {
    label: 'ناموفق',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: XCircle,
  },
  draft: {
    label: 'پیش‌نویس',
    className: 'bg-muted text-muted-foreground border-border',
    icon: FileText,
  },
};

const typeConfig = {
  system: { label: 'سیستمی', className: 'bg-primary/10 text-primary' },
  email: { label: 'ایمیل', className: 'bg-info/10 text-info' },
  sms: { label: 'پیامک', className: 'bg-success/10 text-success' },
  telegram: { label: 'تلگرام', className: 'bg-blue-500/10 text-blue-500' },
  push: { label: 'Push', className: 'bg-warning/10 text-warning' },
};

const priorityConfig = {
  low: { label: 'پایین', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'متوسط', className: 'bg-info/10 text-info' },
  high: { label: 'بالا', className: 'bg-warning/10 text-warning' },
  urgent: { label: 'فوری', className: 'bg-destructive/10 text-destructive' },
};

const recipientTypeConfig = {
  all: 'همه کاربران',
  specific: 'کاربران خاص',
  group: 'گروه خاص',
};

export function ViewNotificationDialog({ open, onOpenChange, notification }: ViewNotificationDialogProps) {
  if (!notification) return null;

  const StatusIcon = statusConfig[notification.status].icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bell className="w-5 h-5 text-primary" />
            {notification.title}
          </DialogTitle>
          <DialogDescription className="text-right">
            جزئیات کامل اعلان
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">{notification.title}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn('border-2', statusConfig[notification.status].className)}
                    >
                      <StatusIcon className="w-3 h-3 ml-1" />
                      {statusConfig[notification.status].label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn('border-2', typeConfig[notification.type].className)}
                    >
                      {typeConfig[notification.type].label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn('border-2', priorityConfig[notification.priority].className)}
                    >
                      {priorityConfig[notification.priority].label}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4">محتوا</h4>
              <p className="text-sm text-foreground whitespace-pre-wrap">{notification.content}</p>
              {notification.imageUrl && (
                <div className="mt-4">
                  <img
                    src={notification.imageUrl}
                    alt={notification.title}
                    className="rounded-lg max-w-full h-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4">آمار</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Eye className="w-4 h-4" />
                    تعداد خوانده شده
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {(notification.readCount || 0).toLocaleString('fa-IR')}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MousePointerClick className="w-4 h-4" />
                    تعداد کلیک
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {(notification.clickCount || 0).toLocaleString('fa-IR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                گیرنده‌ها
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">نوع گیرنده</p>
                    <p className="text-sm font-medium text-foreground">
                      {recipientTypeConfig[notification.recipientType]}
                    </p>
                  </div>
                </div>
                {notification.recipientIds && notification.recipientIds.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">تعداد گیرندگان:</p>
                    <p className="text-sm font-medium text-foreground">
                      {notification.recipientIds.length} کاربر
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4">تنظیمات</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  {notification.sound ? (
                    <Volume2 className="w-4 h-4 text-success" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">صدا</p>
                    <p className="text-sm font-medium text-foreground">
                      {notification.sound ? 'فعال' : 'غیرفعال'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {notification.vibrate ? (
                    <Vibrate className="w-4 h-4 text-success" />
                  ) : (
                    <Vibrate className="w-4 h-4 text-muted-foreground opacity-50" />
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">لرزش</p>
                    <p className="text-sm font-medium text-foreground">
                      {notification.vibrate ? 'فعال' : 'غیرفعال'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {notification.silent ? (
                    <VolumeX className="w-4 h-4 text-warning" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-muted-foreground opacity-50" />
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">بی‌صدا</p>
                    <p className="text-sm font-medium text-foreground">
                      {notification.silent ? 'فعال' : 'غیرفعال'}
                    </p>
                  </div>
                </div>
                {notification.actionUrl && (
                  <div className="flex items-center gap-2">
                    <Link className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">لینک</p>
                      <a
                        href={notification.actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline break-all"
                        dir="ltr"
                      >
                        {notification.actionUrl}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4">زمان‌بندی</h4>
              <div className="grid grid-cols-2 gap-4">
                {notification.scheduledAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">زمان‌بندی شده</p>
                      <p className="text-sm font-medium text-foreground">{notification.scheduledAt}</p>
                    </div>
                  </div>
                )}
                {notification.sentAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">ارسال شده</p>
                      <p className="text-sm font-medium text-foreground">{notification.sentAt}</p>
                    </div>
                  </div>
                )}
                {notification.expiresAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">انقضا</p>
                      <p className="text-sm font-medium text-foreground">{notification.expiresAt}</p>
                    </div>
                  </div>
                )}
                {notification.createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">تاریخ ایجاد</p>
                      <p className="text-sm font-medium text-foreground">{notification.createdAt}</p>
                    </div>
                  </div>
                )}
                {notification.updatedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">آخرین بروزرسانی</p>
                      <p className="text-sm font-medium text-foreground">{notification.updatedAt}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

