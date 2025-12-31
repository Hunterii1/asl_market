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
  Megaphone,
  FileText,
  Calendar,
  Link,
  CheckCircle,
  XCircle,
  Eye,
  MousePointerClick,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popup } from '@/types/popup';

interface ViewPopupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  popup: Popup | null;
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
};

export function ViewPopupDialog({ open, onOpenChange, popup }: ViewPopupDialogProps) {
  if (!popup) return null;

  const statusKey = popup.is_active ? 'active' : 'inactive';
  const statusInfo = statusConfig[statusKey];
  const StatusIcon = statusInfo.icon;
  const clickRate = popup.show_count > 0 
    ? ((popup.click_count || 0) / popup.show_count * 100).toFixed(2)
    : '0.00';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Megaphone className="w-5 h-5 text-primary" />
            {popup.title}
          </DialogTitle>
          <DialogDescription className="text-right">
            جزئیات کامل پاپ‌آپ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">{popup.title}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn('border-2', statusInfo.className)}
                    >
                      <StatusIcon className="w-3 h-3 ml-1" />
                      {statusInfo.label}
                    </Badge>
                    <Badge variant="outline" className="bg-muted text-muted-foreground">
                      اولویت: {popup.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Preview */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4">محتوا</h4>
              <div className="rounded-lg p-6 border border-border bg-muted/30">
                <h3 className="font-bold text-lg mb-2">{popup.title}</h3>
                <p className="text-sm mb-4 whitespace-pre-wrap">{popup.message}</p>
                {popup.button_text && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{popup.button_text}</span>
                    {popup.discount_url && (
                      <Link className="w-4 h-4 text-primary" />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4">تنظیمات</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">متن دکمه</p>
                    <p className="text-sm font-medium text-foreground">
                      {popup.button_text || 'تعریف نشده'}
                    </p>
                  </div>
                </div>
                {popup.discount_url && (
                  <div className="flex items-center gap-2">
                    <Link className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">لینک</p>
                      <a
                        href={popup.discount_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline break-all"
                        dir="ltr"
                      >
                        {popup.discount_url}
                      </a>
                    </div>
                  </div>
                )}
              </div>
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
                    تعداد نمایش
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {(popup.show_count || 0).toLocaleString('fa-IR')}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MousePointerClick className="w-4 h-4" />
                    تعداد کلیک
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {(popup.click_count || 0).toLocaleString('fa-IR')}
                  </p>
                </div>
              </div>
              {popup.show_count > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-1">نرخ کلیک:</p>
                  <p className="text-lg font-bold text-primary">
                    {clickRate}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4">زمان‌بندی</h4>
              <div className="grid grid-cols-2 gap-4">
                {popup.start_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">تاریخ شروع</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(popup.start_date).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  </div>
                )}
                {popup.end_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">تاریخ پایان</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(popup.end_date).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  </div>
                )}
                {popup.created_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">تاریخ ایجاد</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(popup.created_at).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  </div>
                )}
                {popup.updated_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">آخرین بروزرسانی</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(popup.updated_at).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Added By */}
          {popup.added_by && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-4">ایجاد شده توسط</h4>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {popup.added_by.first_name} {popup.added_by.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{popup.added_by.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
