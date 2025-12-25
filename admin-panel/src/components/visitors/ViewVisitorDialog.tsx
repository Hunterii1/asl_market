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
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisitorData {
  id: string;
  full_name?: string;
  mobile?: string;
  email?: string;
  city_province?: string;
  destination_cities?: string;
  national_id?: string;
  status?: 'pending' | 'approved' | 'rejected';
  is_featured?: boolean;
  average_rating?: number;
  admin_notes?: string;
  created_at?: string;
  createdAt?: string;
}

interface ViewVisitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitor: VisitorData | null;
}

const statusConfig = {
  pending: {
    label: 'در انتظار',
    className: 'bg-warning/10 text-warning border-warning/20',
    icon: Clock,
  },
  approved: {
    label: 'تأیید شده',
    className: 'bg-success/10 text-success border-success/20',
    icon: CheckCircle,
  },
  rejected: {
    label: 'رد شده',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: XCircle,
  },
};

export function ViewVisitorDialog({ open, onOpenChange, visitor }: ViewVisitorDialogProps) {
  if (!visitor) return null;

  const StatusIcon = visitor.status ? statusConfig[visitor.status].icon : Clock;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Eye className="w-5 h-5 text-primary" />
            جزئیات ویزیتور
          </DialogTitle>
          <DialogDescription className="text-right">
            اطلاعات کامل ویزیتور
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {visitor.full_name || 'بدون نام'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {visitor.status && (
                      <Badge
                        variant="outline"
                        className={cn('border-2', statusConfig[visitor.status].className)}
                      >
                        <StatusIcon className="w-3 h-3 ml-1" />
                        {statusConfig[visitor.status].label}
                      </Badge>
                    )}
                    {visitor.is_featured && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        <Star className="w-3 h-3 ml-1" />
                        ویژه
                      </Badge>
                    )}
                    {visitor.average_rating !== undefined && visitor.average_rating > 0 && (
                      <Badge variant="outline" className="bg-info/10 text-info border-info/20">
                        <Star className="w-3 h-3 ml-1" />
                        {visitor.average_rating.toFixed(1)} ⭐
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                اطلاعات شخصی
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visitor.full_name && (
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <User className="w-4 h-4" />
                      نام و نام خانوادگی
                    </div>
                    <p className="text-lg font-bold text-foreground">{visitor.full_name}</p>
                  </div>
                )}
                {visitor.national_id && (
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Shield className="w-4 h-4" />
                      کد ملی
                    </div>
                    <p className="text-lg font-bold text-foreground font-mono" dir="ltr">
                      {visitor.national_id}
                    </p>
                  </div>
                )}
                {visitor.mobile && (
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Phone className="w-4 h-4" />
                      شماره موبایل
                    </div>
                    <p className="text-lg font-bold text-foreground font-mono" dir="ltr">
                      {visitor.mobile}
                    </p>
                  </div>
                )}
                {visitor.email && (
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Mail className="w-4 h-4" />
                      ایمیل
                    </div>
                    <p className="text-lg font-bold text-foreground font-mono" dir="ltr">
                      {visitor.email}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          {(visitor.city_province || visitor.destination_cities) && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  اطلاعات موقعیت
                </h4>
                <div className="space-y-4">
                  {visitor.city_province && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">شهر و استان محل سکونت</p>
                        <p className="text-sm font-medium text-foreground">{visitor.city_province}</p>
                      </div>
                    </div>
                  )}
                  {visitor.destination_cities && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">شهرهای مقصد</p>
                        <p className="text-sm font-medium text-foreground">{visitor.destination_cities}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Notes */}
          {visitor.admin_notes && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  یادداشت ادمین
                </h4>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{visitor.admin_notes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dates */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4">زمان‌بندی</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visitor.createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">تاریخ ثبت</p>
                      <p className="text-sm font-medium text-foreground">{visitor.createdAt}</p>
                    </div>
                  </div>
                )}
                {visitor.created_at && !visitor.createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">تاریخ ثبت</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(visitor.created_at).toLocaleDateString('fa-IR')}
                      </p>
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


