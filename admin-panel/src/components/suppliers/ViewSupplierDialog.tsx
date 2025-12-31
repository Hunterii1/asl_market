import { useState, useEffect } from 'react';
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
import { adminApi } from '@/lib/api/adminApi';
import { Loader2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [fullSupplier, setFullSupplier] = useState<SupplierData | null>(supplier);
  
  useEffect(() => {
    const loadSupplierDetails = async () => {
      if (!supplier || !open) return;
      
      try {
        setLoading(true);
        const response = await adminApi.getSupplier(parseInt(supplier.id));
        if (response?.supplier) {
          const s = response.supplier;
          setFullSupplier({
            id: s.id?.toString() || '',
            name: s.full_name || 'بدون نام',
            companyName: s.brand_name || '',
            email: s.user?.email || '',
            phone: s.mobile || '',
            address: s.address || '',
            city: s.city || '',
            status: s.status === 'approved' ? 'active' : s.status === 'pending' ? 'inactive' : 'suspended',
            rating: s.average_rating || 0,
            notes: s.admin_notes || '',
            totalOrders: 0,
            totalAmount: 0,
            createdAt: s.created_at || new Date().toISOString(),
            updatedAt: s.updated_at || new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error loading supplier details:', error);
        setFullSupplier(supplier);
      } finally {
        setLoading(false);
      }
    };

    loadSupplierDetails();
  }, [supplier?.id, open]);

  if (!supplier || !fullSupplier) return null;

  const StatusIcon = statusConfig[fullSupplier.status].icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Truck className="w-5 h-5 text-primary" />
            {fullSupplier.name}
          </DialogTitle>
          <DialogDescription className="text-right">
            جزئیات کامل تامین‌کننده
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && (
            <>
          {/* Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">{fullSupplier.name}</h3>
                  {fullSupplier.companyName && (
                    <p className="text-muted-foreground mb-2">{fullSupplier.companyName}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn('border-2', statusConfig[fullSupplier.status].className)}
                    >
                      <StatusIcon className="w-3 h-3 ml-1" />
                      {statusConfig[fullSupplier.status].label}
                    </Badge>
                    {fullSupplier.rating !== undefined && fullSupplier.rating > 0 && (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        <Star className="w-3 h-3 ml-1 fill-warning" />
                        {fullSupplier.rating.toFixed(1)}
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
                {fullSupplier.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">تلفن</p>
                      <p className="text-sm font-medium text-foreground">{fullSupplier.phone}</p>
                    </div>
                  </div>
                )}
                {fullSupplier.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">ایمیل</p>
                      <p className="text-sm font-medium text-foreground">{fullSupplier.email}</p>
                    </div>
                  </div>
                )}
                {fullSupplier.address && (
                  <div className="flex items-start gap-2 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">آدرس</p>
                      <p className="text-sm font-medium text-foreground">{fullSupplier.address}</p>
                      {fullSupplier.city && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {fullSupplier.city}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>


          {/* Statistics */}
          {fullSupplier.rating !== undefined && fullSupplier.rating > 0 && (
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4">آمار</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Star className="w-4 h-4" />
                    امتیاز
                  </div>
                  <p className="text-xl font-bold text-foreground">{fullSupplier.rating.toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Notes */}
          {fullSupplier.notes && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  یادداشت ادمین
                </h4>
                <p className="text-sm text-foreground whitespace-pre-wrap">{fullSupplier.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Dates */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4">زمان‌بندی</h4>
              <div className="grid grid-cols-2 gap-4">
                {fullSupplier.createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">تاریخ ایجاد</p>
                      <p className="text-sm font-medium text-foreground">{new Date(fullSupplier.createdAt).toLocaleDateString('fa-IR')}</p>
                    </div>
                  </div>
                )}
                {fullSupplier.updatedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">آخرین بروزرسانی</p>
                      <p className="text-sm font-medium text-foreground">{new Date(fullSupplier.updatedAt).toLocaleDateString('fa-IR')}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

