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
  Truck,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  User,
  Star,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupplierData {
  id: string;
  name: string;
  companyName?: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  website?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  category?: 'electronics' | 'clothing' | 'food' | 'books' | 'furniture' | 'automotive' | 'other';
  status: 'active' | 'inactive' | 'suspended';
  rating?: number;
  notes?: string;
  totalOrders: number;
  totalAmount: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ViewSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: SupplierData | null;
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
    label: 'معلق',
    className: 'bg-warning/10 text-warning border-warning/20',
    icon: AlertCircle,
  },
};

const categoryConfig = {
  electronics: { label: 'الکترونیک', className: 'bg-primary/10 text-primary' },
  clothing: { label: 'پوشاک', className: 'bg-info/10 text-info' },
  food: { label: 'غذا', className: 'bg-success/10 text-success' },
  books: { label: 'کتاب', className: 'bg-warning/10 text-warning' },
  furniture: { label: 'مبلمان', className: 'bg-muted text-muted-foreground' },
  automotive: { label: 'خودرو', className: 'bg-destructive/10 text-destructive' },
  other: { label: 'سایر', className: 'bg-muted text-muted-foreground' },
};

export function ViewSupplierDialog({ open, onOpenChange, supplier }: ViewSupplierDialogProps) {
  if (!supplier) return null;

  const StatusIcon = statusConfig[supplier.status].icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Truck className="w-5 h-5 text-primary" />
            {supplier.name}
          </DialogTitle>
          <DialogDescription className="text-right">
            جزئیات کامل تامین‌کننده
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">{supplier.name}</h3>
                  {supplier.companyName && (
                    <p className="text-muted-foreground mb-2">{supplier.companyName}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn('border-2', statusConfig[supplier.status].className)}
                    >
                      <StatusIcon className="w-3 h-3 ml-1" />
                      {statusConfig[supplier.status].label}
                    </Badge>
                    {supplier.category && (
                      <Badge
                        variant="outline"
                        className={cn('border-2', categoryConfig[supplier.category].className)}
                      >
                        {categoryConfig[supplier.category].label}
                      </Badge>
                    )}
                    {supplier.rating !== undefined && supplier.rating > 0 && (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        <Star className="w-3 h-3 ml-1 fill-warning" />
                        {supplier.rating.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4">اطلاعات تماس</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {supplier.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">تلفن</p>
                      <p className="text-sm font-medium text-foreground">{supplier.phone}</p>
                    </div>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">ایمیل</p>
                      <p className="text-sm font-medium text-foreground">{supplier.email}</p>
                    </div>
                  </div>
                )}
                {supplier.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">وب‌سایت</p>
                      <a
                        href={supplier.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline"
                        dir="ltr"
                      >
                        {supplier.website}
                      </a>
                    </div>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-start gap-2 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">آدرس</p>
                      <p className="text-sm font-medium text-foreground">{supplier.address}</p>
                      {(supplier.city || supplier.country || supplier.postalCode) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {[supplier.city, supplier.country, supplier.postalCode].filter(Boolean).join(' - ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Person */}
          {(supplier.contactPerson || supplier.contactPhone || supplier.contactEmail) && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  شخص تماس
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {supplier.contactPerson && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">نام</p>
                        <p className="text-sm font-medium text-foreground">{supplier.contactPerson}</p>
                      </div>
                    </div>
                  )}
                  {supplier.contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">تلفن</p>
                        <p className="text-sm font-medium text-foreground">{supplier.contactPhone}</p>
                      </div>
                    </div>
                  )}
                  {supplier.contactEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">ایمیل</p>
                        <p className="text-sm font-medium text-foreground">{supplier.contactEmail}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4">آمار</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Package className="w-4 h-4" />
                    سفارشات
                  </div>
                  <p className="text-xl font-bold text-foreground">{supplier.totalOrders.toLocaleString('fa-IR')}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <DollarSign className="w-4 h-4" />
                    مجموع مبلغ
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {supplier.totalAmount.toLocaleString('fa-IR')} تومان
                  </p>
                </div>
                {supplier.rating !== undefined && (
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Star className="w-4 h-4" />
                      امتیاز
                    </div>
                    <p className="text-xl font-bold text-foreground">{supplier.rating.toFixed(1)}</p>
                  </div>
                )}
                {supplier.taxId && (
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <FileText className="w-4 h-4" />
                      شناسه مالیاتی
                    </div>
                    <p className="text-xl font-bold text-foreground">{supplier.taxId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {supplier.notes && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  یادداشت
                </h4>
                <p className="text-sm text-foreground whitespace-pre-wrap">{supplier.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Dates */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4">زمان‌بندی</h4>
              <div className="grid grid-cols-2 gap-4">
                {supplier.createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">تاریخ ایجاد</p>
                      <p className="text-sm font-medium text-foreground">{supplier.createdAt}</p>
                    </div>
                  </div>
                )}
                {supplier.updatedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">آخرین بروزرسانی</p>
                      <p className="text-sm font-medium text-foreground">{supplier.updatedAt}</p>
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

