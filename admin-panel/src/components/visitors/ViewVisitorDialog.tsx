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
  Eye,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Bot,
  Clock,
  FileText,
  Calendar,
  MapPin,
  Languages,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisitorData {
  id: string;
  ip: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: 'desktop' | 'mobile' | 'tablet' | 'other';
  country?: string;
  city?: string;
  page: string;
  referrer?: string;
  sessionId?: string;
  duration?: number;
  isBot: boolean;
  language?: string;
  visitedAt?: string;
  createdAt?: string;
}

interface ViewVisitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitor: VisitorData | null;
}

const deviceConfig = {
  desktop: {
    label: 'دسکتاپ',
    className: 'bg-primary/10 text-primary',
    icon: Monitor,
  },
  mobile: {
    label: 'موبایل',
    className: 'bg-info/10 text-info',
    icon: Smartphone,
  },
  tablet: {
    label: 'تبلت',
    className: 'bg-success/10 text-success',
    icon: Tablet,
  },
  other: {
    label: 'سایر',
    className: 'bg-muted text-muted-foreground',
    icon: Monitor,
  },
};

export function ViewVisitorDialog({ open, onOpenChange, visitor }: ViewVisitorDialogProps) {
  if (!visitor) return null;

  const DeviceIcon = visitor.device ? deviceConfig[visitor.device].icon : Monitor;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Eye className="w-5 h-5 text-primary" />
            جزئیات بازدیدکننده
          </DialogTitle>
          <DialogDescription className="text-right">
            اطلاعات کامل بازدیدکننده
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2 font-mono" dir="ltr">
                    {visitor.ip}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {visitor.device && (
                      <Badge
                        variant="outline"
                        className={cn('border-2', deviceConfig[visitor.device].className)}
                      >
                        <DeviceIcon className="w-3 h-3 ml-1" />
                        {deviceConfig[visitor.device].label}
                      </Badge>
                    )}
                    {visitor.isBot && (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        <Bot className="w-3 h-3 ml-1" />
                        ربات
                      </Badge>
                    )}
                    {visitor.country && (
                      <Badge variant="outline" className="bg-info/10 text-info border-info/20">
                        {visitor.country}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Browser & OS */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4">مرورگر و سیستم عامل</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visitor.browser && (
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Globe className="w-4 h-4" />
                      مرورگر
                    </div>
                    <p className="text-lg font-bold text-foreground">{visitor.browser}</p>
                  </div>
                )}
                {visitor.os && (
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Monitor className="w-4 h-4" />
                      سیستم عامل
                    </div>
                    <p className="text-lg font-bold text-foreground">{visitor.os}</p>
                  </div>
                )}
              </div>
              {visitor.userAgent && (
                <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">User Agent:</p>
                  <p className="text-xs font-mono text-foreground break-all" dir="ltr">
                    {visitor.userAgent}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          {(visitor.country || visitor.city) && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  موقعیت جغرافیایی
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {visitor.country && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">کشور</p>
                        <p className="text-sm font-medium text-foreground">{visitor.country}</p>
                      </div>
                    </div>
                  )}
                  {visitor.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">شهر</p>
                        <p className="text-sm font-medium text-foreground">{visitor.city}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Visit Details */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                جزئیات بازدید
              </h4>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">صفحه بازدید شده</p>
                    <p className="text-sm font-medium text-foreground font-mono" dir="ltr">
                      {visitor.page}
                    </p>
                  </div>
                </div>
                {visitor.referrer && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">مرجع</p>
                      <a
                        href={visitor.referrer}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline break-all"
                        dir="ltr"
                      >
                        {visitor.referrer}
                      </a>
                    </div>
                  </div>
                )}
                {visitor.duration !== undefined && visitor.duration > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">مدت زمان بازدید</p>
                      <p className="text-sm font-medium text-foreground">
                        {Math.floor(visitor.duration / 60)} دقیقه و {visitor.duration % 60} ثانیه
                      </p>
                    </div>
                  </div>
                )}
                {visitor.language && (
                  <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">زبان</p>
                      <p className="text-sm font-medium text-foreground">{visitor.language}</p>
                    </div>
                  </div>
                )}
                {visitor.sessionId && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">شناسه نشست</p>
                      <p className="text-sm font-medium text-foreground font-mono" dir="ltr">
                        {visitor.sessionId}
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
                {visitor.visitedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">زمان بازدید</p>
                      <p className="text-sm font-medium text-foreground">{visitor.visitedAt}</p>
                    </div>
                  </div>
                )}
                {visitor.createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">تاریخ ثبت</p>
                      <p className="text-sm font-medium text-foreground">{visitor.createdAt}</p>
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

