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
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/adminApi';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface VisitorData {
  id: string;
  full_name?: string;
  national_id?: string;
  passport_number?: string;
  birth_date?: string;
  mobile?: string;
  whatsapp_number?: string;
  email?: string;
  residence_address?: string;
  city_province?: string;
  destination_cities?: string;
  has_local_contact?: boolean;
  local_contact_details?: string;
  bank_account_iban?: string;
  bank_name?: string;
  account_holder_name?: string;
  has_marketing_experience?: boolean;
  marketing_experience_desc?: string;
  language_level?: string;
  special_skills?: string;
  interested_products?: string;
  status?: 'pending' | 'approved' | 'rejected';
  is_featured?: boolean;
  average_rating?: number;
  admin_notes?: string;
  approved_at?: string;
  created_at?: string;
  createdAt?: string;
}

interface ViewVisitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitor: VisitorData | null;
  onFeaturedChange?: () => void;
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

export function ViewVisitorDialog({ open, onOpenChange, visitor: initialVisitor, onFeaturedChange }: ViewVisitorDialogProps) {
  const [fullVisitor, setFullVisitor] = useState<VisitorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [featureLoading, setFeatureLoading] = useState(false);

  const loadFullVisitor = async () => {
    if (!initialVisitor) return;
    try {
      setLoading(true);
      const response = await adminApi.getVisitor(Number(initialVisitor.id));
      if (response && response.visitor) {
        const v = response.visitor;
        setFullVisitor({
          id: v.id?.toString() || '',
          full_name: v.full_name || '',
          national_id: v.national_id || '',
          passport_number: v.passport_number || '',
          birth_date: v.birth_date || '',
          mobile: v.mobile || '',
          whatsapp_number: v.whatsapp_number || '',
          email: v.email || '',
          residence_address: v.residence_address || '',
          city_province: v.city_province || '',
          destination_cities: v.destination_cities || '',
          has_local_contact: v.has_local_contact || false,
          local_contact_details: v.local_contact_details || '',
          bank_account_iban: v.bank_account_iban || '',
          bank_name: v.bank_name || '',
          account_holder_name: v.account_holder_name || '',
          has_marketing_experience: v.has_marketing_experience || false,
          marketing_experience_desc: v.marketing_experience_desc || '',
          language_level: v.language_level || '',
          special_skills: v.special_skills || '',
          interested_products: v.interested_products || '',
          status: (v.status || 'pending') as 'pending' | 'approved' | 'rejected',
          is_featured: v.is_featured || false,
          average_rating: v.average_rating || 0,
          admin_notes: v.admin_notes || '',
          approved_at: v.approved_at,
          created_at: v.created_at,
          createdAt: v.created_at || new Date().toISOString(),
        });
      } else {
        setFullVisitor(initialVisitor);
      }
    } catch (error) {
      console.error('Error loading full visitor:', error);
      setFullVisitor(initialVisitor);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && initialVisitor) {
      loadFullVisitor();
    } else {
      setFullVisitor(null);
    }
  }, [open, initialVisitor?.id]);

  const handleToggleFeatured = async () => {
    if (!initialVisitor?.id) return;
    setFeatureLoading(true);
    try {
      const current = fullVisitor || initialVisitor;
      if (current.is_featured) {
        await adminApi.unfeatureVisitor(parseInt(current.id));
        toast({ title: 'برگزیده حذف شد', description: 'ویزیتور از لیست برگزیده‌ها حذف شد.' });
      } else {
        await adminApi.featureVisitor(parseInt(current.id));
        toast({ title: 'برگزیده شد', description: 'ویزیتور به لیست برگزیده‌ها اضافه شد.' });
      }
      await loadFullVisitor();
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

  if (!fullVisitor && !initialVisitor) return null;
  const visitor = fullVisitor || initialVisitor!;

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

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
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
                {visitor.status === 'approved' && (
                  <Button
                    variant={visitor.is_featured ? 'outline' : 'default'}
                    size="sm"
                    disabled={featureLoading}
                    onClick={handleToggleFeatured}
                    className="shrink-0"
                  >
                    {featureLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : visitor.is_featured ? (
                      <>حذف برگزیده</>
                    ) : (
                      <>⭐ برگزیده کن</>
                    )}
                  </Button>
                )}
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
        )}
      </DialogContent>
    </Dialog>
  );
}


