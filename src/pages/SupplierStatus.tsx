import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  User,
  Phone,
  MapPin,
  Building,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Info,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { apiService } from '@/services/api';

interface SupplierData {
  id: number;
  full_name: string;
  mobile: string;
  brand_name: string;
  city: string;
  address: string;
  has_registered_business: boolean;
  business_registration_num: string;
  has_export_experience: boolean;
  export_price: string;
  wholesale_min_price: string;
  wholesale_high_volume_price: string;
  can_produce_private_label: boolean;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string;
  approved_at: string | null;
  created_at: string;
}

export default function SupplierStatus() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasSupplier, setHasSupplier] = useState(false);
  const [supplierData, setSupplierData] = useState<SupplierData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    checkSupplierStatus();
  }, []);

  const checkSupplierStatus = async () => {
    try {
      const response = await apiService.getSupplierStatus();
      setHasSupplier(response.has_supplier);
      if (response.has_supplier) {
        setSupplierData(response.supplier);
      }
    } catch (error) {
      console.error('Error checking supplier status:', error);
      setHasSupplier(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await apiService.deleteSupplier();
      toast({
        title: "موفق",
        description: "اطلاعات تأمین‌کننده شما با موفقیت حذف شد",
      });
      navigate('/supplier-status');
      window.location.reload(); // Reload to show the "no supplier" state
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "خطا در حذف اطلاعات تأمین‌کننده",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            در انتظار بررسی
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            تأیید شده
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            رد شده
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          title: 'درخواست شما در حال بررسی است',
          description: 'تیم کارشناسی ما درخواست ثبت‌نام شما را در حال بررسی است. پس از تأیید، با شما تماس گرفته خواهد شد.',
          variant: 'default' as const
        };
      case 'approved':
        return {
          title: 'تبریک! شما به عنوان تأمین‌کننده تأیید شدید',
          description: 'حالا محصولات شما برای کاربران با لایسنس نمایش داده می‌شود.',
          variant: 'default' as const
        };
      case 'rejected':
        return {
          title: 'متأسفانه درخواست شما رد شد',
          description: 'لطفا دلیل رد را مطالعه کرده و در صورت نیاز درخواست جدیدی ارسال کنید.',
          variant: 'destructive' as const
        };
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            برای مشاهده وضعیت تأمین‌کننده، ابتدا وارد حساب کاربری خود شوید.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">در حال بارگذاری...</span>
        </div>
      </div>
    );
  }

  if (!hasSupplier) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle>ثبت‌نام به عنوان تأمین‌کننده</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                شما هنوز به عنوان تأمین‌کننده ثبت‌نام نکرده‌اید.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <p className="text-muted-foreground">
                با ثبت‌نام به عنوان تأمین‌کننده در ASL MARKET، محصولات خود را به کاربران معرفی کنید.
              </p>
              
              <Button onClick={() => navigate('/supplier-registration')} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                شروع ثبت‌نام تأمین‌کننده
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusMessage(supplierData!.status);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Status Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>وضعیت تأمین‌کننده</CardTitle>
              <div className="flex items-center gap-2">
                {getStatusBadge(supplierData!.status)}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/edit-supplier')}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  ویرایش
                </Button>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleting}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl border-border">
                    <AlertDialogHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                          <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <AlertDialogTitle className="text-2xl text-foreground">حذف اطلاعات تأمین‌کننده</AlertDialogTitle>
                      </div>
                      <AlertDialogDescription className="text-base pt-4 space-y-3">
                        <p className="text-foreground">
                          آیا مطمئن هستید که می‌خواهید اطلاعات تأمین‌کننده خود را حذف کنید؟
                        </p>
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                            <div className="space-y-1">
                              <p className="font-semibold text-red-800 dark:text-red-300">این عمل قابل بازگشت نیست</p>
                              <p className="text-sm text-red-700 dark:text-red-400">
                                تمام اطلاعات تأمین‌کننده و محصولات مرتبط از سیستم حذف خواهد شد و دیگر قادر به دسترسی به این اطلاعات نخواهید بود.
                              </p>
                            </div>
                          </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                      <AlertDialogCancel disabled={deleting} className="rounded-xl">انصراف</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleting}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl gap-2"
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            در حال حذف...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                            حذف
                          </>
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {statusInfo && (
              <Alert variant={statusInfo.variant}>
                <AlertDescription>
                  <div className="space-y-2">
                    <h4 className="font-semibold">{statusInfo.title}</h4>
                    <p>{statusInfo.description}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {supplierData!.admin_notes && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">یادداشت ادمین:</h4>
                <p className="text-sm">{supplierData!.admin_notes}</p>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">تاریخ ثبت‌نام:</span>
                <br />
                {new Date(supplierData!.created_at).toLocaleDateString('fa-IR')}
              </div>
              {supplierData!.approved_at && (
                <div>
                  <span className="font-medium">تاریخ تأیید:</span>
                  <br />
                  {new Date(supplierData!.approved_at).toLocaleDateString('fa-IR')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              اطلاعات شخصی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{supplierData!.full_name}</div>
                  <div className="text-sm text-muted-foreground">نام کامل</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium" dir="ltr">{supplierData!.mobile}</div>
                  <div className="text-sm text-muted-foreground">شماره موبایل</div>
                </div>
              </div>

              {supplierData!.brand_name && (
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{supplierData!.brand_name}</div>
                    <div className="text-sm text-muted-foreground">نام برند</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{supplierData!.city}</div>
                  <div className="text-sm text-muted-foreground">شهر</div>
                </div>
              </div>
            </div>

            {supplierData!.has_registered_business && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 font-medium text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  کسب‌وکار ثبت‌شده
                </div>
                {supplierData!.business_registration_num && (
                  <p className="text-sm text-green-700 mt-1">
                    شماره ثبت: {supplierData!.business_registration_num}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Experience & Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              اطلاعات تجاری
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {supplierData!.has_export_experience && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 font-medium text-blue-800 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  سابقه صادراتی دارد
                </div>
                {supplierData!.export_price && (
                  <p className="text-sm text-blue-700">{supplierData!.export_price}</p>
                )}
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-2">قیمت‌گذاری:</h4>
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-muted rounded">
                  <div className="font-medium">قیمت عمده حداقلی:</div>
                  <p>{supplierData!.wholesale_min_price}</p>
                </div>
                
                {supplierData!.wholesale_high_volume_price && (
                  <div className="p-3 bg-muted rounded">
                    <div className="font-medium">قیمت عمده حجم بالا:</div>
                    <p>{supplierData!.wholesale_high_volume_price}</p>
                  </div>
                )}
              </div>
            </div>

            {supplierData!.can_produce_private_label && (
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 font-medium text-orange-800">
                  <CheckCircle className="h-4 w-4" />
                  امکان تولید با برند سفارش‌دهنده
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {supplierData!.status === 'rejected' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  در صورت رفع مشکلات اعلام شده، می‌توانید دوباره درخواست ثبت‌نام دهید.
                </p>
                <Button onClick={() => navigate('/supplier-registration')}>
                  <Plus className="w-4 h-4 mr-2" />
                  درخواست جدید
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}