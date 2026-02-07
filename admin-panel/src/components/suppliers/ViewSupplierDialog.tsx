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
import { Button } from '@/components/ui/button';
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
import { toast } from '@/hooks/use-toast';

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
  is_featured?: boolean;
  tag_first_class?: boolean;
  tag_good_price?: boolean;
  tag_export_experience?: boolean;
  tag_export_packaging?: boolean;
  tag_supply_without_capital?: boolean;
}

interface ViewSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: SupplierData | null;
  onFeaturedChange?: () => void;
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

export function ViewSupplierDialog({ open, onOpenChange, supplier, onFeaturedChange }: ViewSupplierDialogProps) {
  const [loading, setLoading] = useState(false);
  const [featureLoading, setFeatureLoading] = useState(false);
  const [fullSupplier, setFullSupplier] = useState<SupplierData | null>(supplier);

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
          is_featured: s.is_featured || false,
          tag_first_class: s.tag_first_class || false,
          tag_good_price: s.tag_good_price || false,
          tag_export_experience: s.tag_export_experience || false,
          tag_export_packaging: s.tag_export_packaging || false,
          tag_supply_without_capital: s.tag_supply_without_capital || false,
        });
      }
    } catch (error) {
      console.error('Error loading supplier details:', error);
      setFullSupplier(supplier);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupplierDetails();
  }, [supplier?.id, open]);

  const handleToggleFeatured = async () => {
    if (!fullSupplier?.id) return;
    setFeatureLoading(true);
    try {
      if (fullSupplier.is_featured) {
        await adminApi.unfeatureSupplier(parseInt(fullSupplier.id));
        toast({ title: 'برگزیده حذف شد', description: 'تأمین‌کننده از لیست برگزیده‌ها حذف شد.' });
      } else {
        await adminApi.featureSupplier(parseInt(fullSupplier.id));
        toast({ title: 'برگزیده شد', description: 'تأمین‌کننده به لیست برگزیده‌ها اضافه شد.' });
      }
      await loadSupplierDetails();
      onFeaturedChange?.();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'عملیات انجام نشد',
        variant: 'destructive',
      });
    } finally {
      setFeatureLoading(false);
    }
  };

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
                    {fullSupplier.is_featured && (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        <Star className="w-3 h-3 ml-1 fill-warning" />
                        برگزیده
                      </Badge>
                    )}
                    {fullSupplier.rating !== undefined && fullSupplier.rating > 0 && (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        <Star className="w-3 h-3 ml-1 fill-warning" />
                        {fullSupplier.rating.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </div>
                {fullSupplier.status === 'active' && (
                  <Button
                    variant={fullSupplier.is_featured ? 'outline' : 'default'}
                    size="sm"
                    disabled={featureLoading}
                    onClick={handleToggleFeatured}
                    className="shrink-0"
                  >
                    {featureLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : fullSupplier.is_featured ? (
                      <>حذف برگزیده</>
                    ) : (
                      <>⭐ برگزیده کن</>
                    )}
                  </Button>
                )}
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

          {/* Supplier tags */}
          {(fullSupplier.tag_first_class || fullSupplier.tag_good_price || fullSupplier.tag_export_experience || fullSupplier.tag_export_packaging || fullSupplier.tag_supply_without_capital) && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  تگ‌های تأمین‌کننده
                </h4>
                <div className="flex flex-wrap gap-2">
                  {fullSupplier.tag_first_class && (
                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">تأمین‌کننده دسته اول</Badge>
                  )}
                  {fullSupplier.tag_good_price && (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">تأمین‌کننده خوش قیمت</Badge>
                  )}
                  {fullSupplier.tag_export_experience && (
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30">تأمین‌کننده سابقه صادرات</Badge>
                  )}
                  {fullSupplier.tag_export_packaging && (
                    <Badge variant="secondary" className="bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30">دارایی بسته‌بندی صادراتی</Badge>
                  )}
                  {fullSupplier.tag_supply_without_capital && (
                    <Badge variant="secondary" className="bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30">تأمین بدون سرمایه</Badge>
                  )}
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

