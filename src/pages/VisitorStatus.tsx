import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { 
  Loader2, 
  CheckCircle, 
  Clock, 
  XCircle, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Briefcase,
  Calendar,
  IdCard,
  Building,
  Languages,
  FileText,
  AlertCircle,
  Plane,
  Home,
  Edit,
  Trash2
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import HeaderAuth from '@/components/ui/HeaderAuth';

interface VisitorData {
  id: number;
  user_id: number;
  full_name: string;
  national_id: string;
  passport_number: string;
  birth_date: string;
  mobile: string;
  whatsapp_number: string;
  email: string;
  residence_address: string;
  city_province: string;
  destination_cities: string;
  has_local_contact: boolean;
  local_contact_details: string;
  bank_account_iban: string;
  bank_name: string;
  account_holder_name: string;
  has_marketing_experience: boolean;
  marketing_experience_desc: string;
  language_level: string;
  special_skills: string;
  agrees_to_use_approved_products: boolean;
  agrees_to_violation_consequences: boolean;
  agrees_to_submit_reports: boolean;
  digital_signature: string;
  signature_date: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string;
  approved_at: string | null;
  created_at: string;
}

interface VisitorStatusResponse {
  has_visitor: boolean;
  visitor?: VisitorData;
  message?: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />تایید شده</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" />رد شده</Badge>;
    case 'pending':
    default:
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />در انتظار بررسی</Badge>;
  }
};

const getLanguageLevelLabel = (level: string) => {
  switch (level) {
    case 'excellent': return 'عالی';
    case 'good': return 'متوسط';
    case 'weak': return 'ضعیف';
    case 'none': return 'بلد نیستم';
    default: return level;
  }
};

export default function VisitorStatus() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [visitorData, setVisitorData] = useState<VisitorData | null>(null);
  const [hasVisitor, setHasVisitor] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchVisitorStatus = async () => {
      try {
        console.log('🔍 Fetching visitor status...');
        const data = await apiService.getMyVisitorStatus();
        console.log('✅ API Response data:', data);
        
        setHasVisitor(data.has_visitor);
        if (data.visitor) {
          setVisitorData(data.visitor);
          console.log('👤 Visitor data set:', data.visitor);
        }
      } catch (error: any) {
        console.error('❌ API Error:', error);
        console.error('📝 Error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        if (error.response?.status === 404) {
          // Handle 404 - no visitor found
          setHasVisitor(false);
        } else {
          toast({
            title: "خطا", 
            description: error.message || "خطا در دریافت اطلاعات ویزیتور",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVisitorStatus();
  }, [toast]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await apiService.deleteVisitor();
      toast({
        title: "موفق",
        description: "اطلاعات ویزیتور شما با موفقیت حذف شد",
      });
      navigate('/visitor-status');
      window.location.reload(); // Reload to show the "no visitor" state
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "خطا در حذف اطلاعات ویزیتور",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <>
        <HeaderAuth />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="mr-2">در حال بارگذاری...</span>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!hasVisitor || !visitorData) {
    return (
      <>
        <HeaderAuth />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">وضعیت ویزیتور</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">شما هنوز به عنوان ویزیتور ثبت‌نام نکرده‌اید</h3>
              <p className="text-muted-foreground">
                برای شروع فعالیت ویزیتوری، لطفا ابتدا ثبت‌نام کنید.
              </p>
              <Button asChild>
                <Link to="/visitor-registration">ثبت‌نام ویزیتور</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <HeaderAuth />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">وضعیت ویزیتور</CardTitle>
                <p className="text-muted-foreground mt-1">
                  اطلاعات و وضعیت درخواست ویزیتوری شما
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(visitorData.status)}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/edit-visitor')}
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
                        <AlertDialogTitle className="text-2xl text-foreground">حذف اطلاعات ویزیتور</AlertDialogTitle>
                      </div>
                      <AlertDialogDescription className="text-base pt-4 space-y-3">
                        <p className="text-foreground">
                          آیا مطمئن هستید که می‌خواهید اطلاعات ویزیتور خود را حذف کنید؟
                        </p>
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                            <div className="space-y-1">
                              <p className="font-semibold text-red-800 dark:text-red-300">این عمل قابل بازگشت نیست</p>
                              <p className="text-sm text-red-700 dark:text-red-400">
                                تمام اطلاعات ویزیتور شما از سیستم حذف خواهد شد و دیگر قادر به دسترسی به این اطلاعات نخواهید بود.
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
        </Card>

        {/* Status Alert */}
        {visitorData.status === 'pending' && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              درخواست شما در انتظار بررسی توسط تیم ما است. پس از تایید، با شما تماس گرفته خواهد شد.
            </AlertDescription>
          </Alert>
        )}

        {visitorData.status === 'approved' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              تبریک! درخواست ویزیتوری شما تایید شده است. حالا می‌توانید فعالیت ویزیتوری خود را شروع کنید.
              {visitorData.approved_at && (
                <div className="mt-1 text-sm">
                  تاریخ تایید: {new Date(visitorData.approved_at).toLocaleDateString('fa-IR')}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {visitorData.status === 'rejected' && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              متأسفانه درخواست شما رد شده است. لطفا با توجه به توضیحات ارائه شده، اطلاعات خود را تصحیح کرده و مجدداً درخواست دهید.
            </AlertDescription>
          </Alert>
        )}

        {visitorData.admin_notes && (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>یادداشت مدیر:</strong><br />
              {visitorData.admin_notes}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                اطلاعات شناسایی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">نام و نام خانوادگی:</span>
                  <p className="text-muted-foreground">{visitorData.full_name}</p>
                </div>
                <div>
                  <span className="font-medium">کد ملی:</span>
                  <p className="text-muted-foreground">{visitorData.national_id}</p>
                </div>
                {visitorData.passport_number && (
                  <div>
                    <span className="font-medium">شماره پاسپورت:</span>
                    <p className="text-muted-foreground">{visitorData.passport_number}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium">تاریخ تولد:</span>
                  <p className="text-muted-foreground">{visitorData.birth_date}</p>
                </div>
                <div>
                  <span className="font-medium">موبایل:</span>
                  <p className="text-muted-foreground">{visitorData.mobile}</p>
                </div>
                {visitorData.whatsapp_number && (
                  <div>
                    <span className="font-medium">واتساپ:</span>
                    <p className="text-muted-foreground">{visitorData.whatsapp_number}</p>
                  </div>
                )}
                {visitorData.email && (
                  <div className="col-span-2">
                    <span className="font-medium">ایمیل:</span>
                    <p className="text-muted-foreground">{visitorData.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Residence and Travel Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                محل سکونت و سفر
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">آدرس محل سکونت:</span>
                  <p className="text-muted-foreground">{visitorData.residence_address}</p>
                </div>
                <div>
                  <span className="font-medium">شهر/استان:</span>
                  <p className="text-muted-foreground">{visitorData.city_province}</p>
                </div>
                <div>
                  <span className="font-medium">شهرهای مقصد:</span>
                  <p className="text-muted-foreground">{visitorData.destination_cities}</p>
                </div>
                <div>
                  <span className="font-medium">آشنای محلی:</span>
                  <p className="text-muted-foreground">
                    {visitorData.has_local_contact ? 'بله' : 'خیر'}
                  </p>
                  {visitorData.has_local_contact && visitorData.local_contact_details && (
                    <p className="text-muted-foreground text-xs mt-1">
                      {visitorData.local_contact_details}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Banking Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                اطلاعات بانکی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">شماره حساب/شبا:</span>
                  <p className="text-muted-foreground font-mono">{visitorData.bank_account_iban}</p>
                </div>
                <div>
                  <span className="font-medium">نام بانک:</span>
                  <p className="text-muted-foreground">{visitorData.bank_name}</p>
                </div>
                {visitorData.account_holder_name && (
                  <div>
                    <span className="font-medium">نام صاحب حساب:</span>
                    <p className="text-muted-foreground">{visitorData.account_holder_name}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Work Experience and Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                تجربه و مهارت‌ها
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">تجربه بازاریابی:</span>
                  <p className="text-muted-foreground">
                    {visitorData.has_marketing_experience ? 'بله' : 'خیر'}
                  </p>
                  {visitorData.has_marketing_experience && visitorData.marketing_experience_desc && (
                    <p className="text-muted-foreground text-xs mt-1">
                      {visitorData.marketing_experience_desc}
                    </p>
                  )}
                </div>
                <div>
                  <span className="font-medium">سطح زبان:</span>
                  <p className="text-muted-foreground">
                    {getLanguageLevelLabel(visitorData.language_level)}
                  </p>
                </div>
                {visitorData.special_skills && (
                  <div>
                    <span className="font-medium">مهارت‌های خاص:</span>
                    <p className="text-muted-foreground">{visitorData.special_skills}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Digital Signature */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              امضا و تایید
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">امضا دیجیتال:</span>
                <p className="text-muted-foreground">{visitorData.digital_signature}</p>
              </div>
              <div>
                <span className="font-medium">تاریخ امضا:</span>
                <p className="text-muted-foreground">{visitorData.signature_date}</p>
              </div>
              <div>
                <span className="font-medium">تاریخ ثبت‌نام:</span>
                <p className="text-muted-foreground">
                  {new Date(visitorData.created_at).toLocaleDateString('fa-IR')}
                </p>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-2 text-sm">
              <h4 className="font-medium">تعهدات تایید شده:</h4>
              <div className="space-y-1 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  استفاده از محصولات تایید شده
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  پذیرش پیامدهای تخلف
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  ارسال گزارش‌های دوره‌ای
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {visitorData.status === 'rejected' && (
          <Card>
            <CardContent className="text-center py-6">
              <Button asChild>
                <Link to="/visitor-registration">ثبت‌نام مجدد</Link>
              </Button>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </>
  );
}