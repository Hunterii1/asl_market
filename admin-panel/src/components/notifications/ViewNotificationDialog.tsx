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
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notification } from '@/types/notification';

interface ViewNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification: Notification | null;
}

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
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
};

const typeConfig: Record<string, { label: string; className: string }> = {
  info: { label: 'اطلاعات', className: 'bg-info/10 text-info' },
  warning: { label: 'هشدار', className: 'bg-warning/10 text-warning' },
  success: { label: 'موفقیت', className: 'bg-success/10 text-success' },
  error: { label: 'خطا', className: 'bg-destructive/10 text-destructive' },
  matching: { label: 'Matching', className: 'bg-purple-500/10 text-purple-500' },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: 'پایین', className: 'bg-muted text-muted-foreground' },
  normal: { label: 'عادی', className: 'bg-info/10 text-info' },
  high: { label: 'بالا', className: 'bg-warning/10 text-warning' },
  urgent: { label: 'فوری', className: 'bg-destructive/10 text-destructive' },
};

export function ViewNotificationDialog({ open, onOpenChange, notification }: ViewNotificationDialogProps) {
  if (!notification) return null;

  const status = notification.is_active ? 'active' : 'inactive';
  const StatusIcon = statusConfig[status].icon;
  const typeInfo = typeConfig[notification.type] || typeConfig.info;
  const priorityInfo = priorityConfig[notification.priority] || priorityConfig.normal;

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
                      className={cn('border-2', statusConfig[status].className)}
                    >
                      <StatusIcon className="w-3 h-3 ml-1" />
                      {statusConfig[status].label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn('border-2', typeInfo.className)}
                    >
                      {typeInfo.label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn('border-2', priorityInfo.className)}
                    >
                      {priorityInfo.label}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                محتوا
              </h4>
              <p className="text-sm text-foreground whitespace-pre-wrap">{notification.message}</p>
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                گیرنده
              </h4>
              <div className="space-y-2">
                {notification.user_id ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">کاربر خاص:</p>
                    {notification.user ? (
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {notification.user.first_name} {notification.user.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{notification.user.email}</p>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-foreground">شناسه کاربر: {notification.user_id}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">نوع گیرنده:</p>
                    <p className="text-sm font-medium text-foreground">همه کاربران</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action */}
          {notification.action_url && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Link className="w-5 h-5 text-primary" />
                  لینک عملیات
                </h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">آدرس:</p>
                    <a
                      href={notification.action_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline break-all"
                      dir="ltr"
                    >
                      {notification.action_url}
                    </a>
                  </div>
                  {notification.action_text && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">متن دکمه:</p>
                      <p className="text-sm font-medium text-foreground">{notification.action_text}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Created By */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                ایجاد کننده
              </h4>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">نام:</p>
                  <p className="text-sm font-medium text-foreground">
                    {notification.created_by.first_name} {notification.created_by.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ایمیل:</p>
                  <p className="text-sm font-medium text-foreground">{notification.created_by.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                زمان‌بندی
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {notification.expires_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">تاریخ انقضا</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(notification.expires_at).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">تاریخ ایجاد</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(notification.created_at).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">آخرین بروزرسانی</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(notification.updated_at).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">وضعیت خواندن</p>
                    <p className="text-sm font-medium text-foreground">
                      {notification.is_read ? 'خوانده شده' : 'خوانده نشده'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
