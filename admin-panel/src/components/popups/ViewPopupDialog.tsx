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
  Layout,
  Calendar,
  Users,
  Link,
  Palette,
  Clock,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
  Eye,
  MousePointerClick,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PopupData {
  id: string;
  title: string;
  content: string;
  type: 'modal' | 'banner' | 'toast' | 'slide_in';
  position?: 'top' | 'bottom' | 'center' | 'left' | 'right';
  status: 'active' | 'inactive' | 'scheduled';
  startDate?: string;
  endDate?: string;
  showOnPages?: string[];
  showToUsers: 'all' | 'logged_in' | 'logged_out' | 'specific';
  specificUserIds?: string[];
  buttonText?: string;
  buttonLink?: string;
  closeButton: boolean;
  showDelay?: number;
  backgroundColor?: string;
  textColor?: string;
  width?: number;
  height?: number;
  displayCount?: number;
  clickCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ViewPopupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  popup: PopupData | null;
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
  scheduled: {
    label: 'زمان‌بندی شده',
    className: 'bg-info/10 text-info border-info/20',
    icon: CalendarIcon,
  },
};

const typeConfig = {
  modal: { label: 'Modal (پنجره)', className: 'bg-primary/10 text-primary' },
  banner: { label: 'Banner (بنر)', className: 'bg-info/10 text-info' },
  toast: { label: 'Toast (اعلان)', className: 'bg-success/10 text-success' },
  slide_in: { label: 'Slide-in (کشویی)', className: 'bg-warning/10 text-warning' },
};

const positionConfig = {
  top: 'بالا',
  bottom: 'پایین',
  center: 'وسط',
  left: 'چپ',
  right: 'راست',
};

const showToUsersConfig = {
  all: 'همه کاربران',
  logged_in: 'فقط کاربران وارد شده',
  logged_out: 'فقط کاربران خارج شده',
  specific: 'کاربران خاص',
};

export function ViewPopupDialog({ open, onOpenChange, popup }: ViewPopupDialogProps) {
  if (!popup) return null;

  const StatusIcon = statusConfig[popup.status].icon;

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
                      className={cn('border-2', statusConfig[popup.status].className)}
                    >
                      <StatusIcon className="w-3 h-3 ml-1" />
                      {statusConfig[popup.status].label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn('border-2', typeConfig[popup.type].className)}
                    >
                      {typeConfig[popup.type].label}
                    </Badge>
                    {popup.position && (
                      <Badge variant="outline" className="bg-muted text-muted-foreground">
                        {positionConfig[popup.position]}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Preview */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4">پیش‌نمایش محتوا</h4>
              <div
                className="rounded-lg p-6 mx-auto border border-border"
                style={{
                  backgroundColor: popup.backgroundColor || '#ffffff',
                  color: popup.textColor || '#000000',
                  width: popup.width ? `${popup.width}px` : '500px',
                  minHeight: popup.height ? `${popup.height}px` : '300px',
                  maxWidth: '100%',
                }}
              >
                <h3 className="font-bold text-lg mb-2">{popup.title}</h3>
                <p className="text-sm mb-4 whitespace-pre-wrap">{popup.content}</p>
                {popup.buttonText && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={(e) => e.preventDefault()}
                  >
                    {popup.buttonText}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4">تنظیمات نمایش</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">نمایش به</p>
                    <p className="text-sm font-medium text-foreground">
                      {showToUsersConfig[popup.showToUsers]}
                    </p>
                  </div>
                </div>
                {popup.showDelay !== undefined && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">تاخیر نمایش</p>
                      <p className="text-sm font-medium text-foreground">
                        {popup.showDelay} ثانیه
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">دکمه بستن</p>
                    <p className="text-sm font-medium text-foreground">
                      {popup.closeButton ? 'فعال' : 'غیرفعال'}
                    </p>
                  </div>
                </div>
                {popup.buttonLink && (
                  <div className="flex items-center gap-2">
                    <Link className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">لینک دکمه</p>
                      <a
                        href={popup.buttonLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline break-all"
                        dir="ltr"
                      >
                        {popup.buttonLink}
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
                    {(popup.displayCount || 0).toLocaleString('fa-IR')}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MousePointerClick className="w-4 h-4" />
                    تعداد کلیک
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {(popup.clickCount || 0).toLocaleString('fa-IR')}
                  </p>
                </div>
              </div>
              {popup.displayCount && popup.displayCount > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-1">نرخ کلیک:</p>
                  <p className="text-lg font-bold text-primary">
                    {((popup.clickCount || 0) / popup.displayCount * 100).toFixed(2)}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Design Settings */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                تنظیمات طراحی
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {popup.backgroundColor && (
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">رنگ پس‌زمینه</p>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-border"
                          style={{ backgroundColor: popup.backgroundColor }}
                        />
                        <p className="text-sm font-medium text-foreground font-mono" dir="ltr">
                          {popup.backgroundColor}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {popup.textColor && (
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">رنگ متن</p>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-border"
                          style={{ backgroundColor: popup.textColor }}
                        />
                        <p className="text-sm font-medium text-foreground font-mono" dir="ltr">
                          {popup.textColor}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {popup.width && (
                  <div className="flex items-center gap-2">
                    <Layout className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">عرض</p>
                      <p className="text-sm font-medium text-foreground">
                        {popup.width} پیکسل
                      </p>
                    </div>
                  </div>
                )}
                {popup.height && (
                  <div className="flex items-center gap-2">
                    <Layout className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">ارتفاع</p>
                      <p className="text-sm font-medium text-foreground">
                        {popup.height} پیکسل
                      </p>
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
                {popup.startDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">تاریخ شروع</p>
                      <p className="text-sm font-medium text-foreground">{popup.startDate}</p>
                    </div>
                  </div>
                )}
                {popup.endDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">تاریخ پایان</p>
                      <p className="text-sm font-medium text-foreground">{popup.endDate}</p>
                    </div>
                  </div>
                )}
                {popup.createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">تاریخ ایجاد</p>
                      <p className="text-sm font-medium text-foreground">{popup.createdAt}</p>
                    </div>
                  </div>
                )}
                {popup.updatedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">آخرین بروزرسانی</p>
                      <p className="text-sm font-medium text-foreground">{popup.updatedAt}</p>
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

