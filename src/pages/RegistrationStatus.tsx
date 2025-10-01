import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Building,
  Globe,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  ArrowLeft
} from "lucide-react";
import { apiService } from "@/services/api";

interface RegistrationData {
  id: number;
  type: 'supplier' | 'visitor';
  full_name: string;
  mobile: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  // Supplier specific fields
  brand_name?: string;
  city?: string;
  address?: string;
  // Visitor specific fields
  national_id?: string;
  city_province?: string;
  destination_cities?: string;
  language_level?: string;
}

const RegistrationStatus: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const mobile = searchParams.get('mobile');
  const type = searchParams.get('type') as 'supplier' | 'visitor';

  useEffect(() => {
    if (mobile && type) {
      fetchRegistrationStatus();
    } else {
      setError('لینک نامعتبر است. لطفاً از طریق لینک صحیح وارد شوید.');
      setLoading(false);
    }
  }, [mobile, type]);

  const fetchRegistrationStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/v1/public/registration-status?mobile=${mobile}&type=${type}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('خطا در دریافت اطلاعات');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRegistrationData(data.data);
      } else {
        setError(data.message || 'خطا در دریافت اطلاعات');
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRegistrationStatus();
    setRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'تأیید شده';
      case 'rejected':
        return 'رد شده';
      case 'pending':
      default:
        return 'در انتظار بررسی';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'pending':
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-muted-foreground">در حال بارگذاری...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2">خطا</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              <ArrowLeft className="w-4 h-4 ml-2" />
              بازگشت به صفحه اصلی
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!registrationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-bold mb-2">درخواست یافت نشد</h2>
            <p className="text-muted-foreground mb-4">
              درخواست ثبت‌نام با این شماره موبایل یافت نشد.
            </p>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              <ArrowLeft className="w-4 h-4 ml-2" />
              بازگشت به صفحه اصلی
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            وضعیت درخواست ثبت‌نام
          </h1>
          <p className="text-muted-foreground">
            وضعیت درخواست ثبت‌نام شما را در اینجا مشاهده کنید
          </p>
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                {registrationData.type === 'supplier' ? (
                  <Building className="w-6 h-6 text-orange-500" />
                ) : (
                  <Globe className="w-6 h-6 text-blue-500" />
                )}
                {registrationData.type === 'supplier' ? 'تأمین‌کننده' : 'ویزیتور'}
              </CardTitle>
              <div className="flex items-center gap-2">
                {getStatusIcon(registrationData.status)}
                <Badge variant={getStatusBadgeVariant(registrationData.status)}>
                  {getStatusText(registrationData.status)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-3">اطلاعات کلی</h3>
                
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">نام کامل</p>
                    <p className="font-medium">{registrationData.full_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">شماره موبایل</p>
                    <p className="font-medium">{registrationData.mobile}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">تاریخ ثبت‌نام</p>
                    <p className="font-medium">{formatDate(registrationData.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Type Specific Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-3">
                  {registrationData.type === 'supplier' ? 'اطلاعات تأمین‌کننده' : 'اطلاعات ویزیتور'}
                </h3>

                {registrationData.type === 'supplier' ? (
                  <>
                    {registrationData.brand_name && (
                      <div className="flex items-center gap-3">
                        <Building className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">نام برند</p>
                          <p className="font-medium">{registrationData.brand_name}</p>
                        </div>
                      </div>
                    )}

                    {registrationData.city && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">شهر</p>
                          <p className="font-medium">{registrationData.city}</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {registrationData.national_id && (
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">کد ملی</p>
                          <p className="font-medium">{registrationData.national_id}</p>
                        </div>
                      </div>
                    )}

                    {registrationData.city_province && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">شهر/استان</p>
                          <p className="font-medium">{registrationData.city_province}</p>
                        </div>
                      </div>
                    )}

                    {registrationData.destination_cities && (
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">شهرهای مقصد</p>
                          <p className="font-medium">{registrationData.destination_cities}</p>
                        </div>
                      </div>
                    )}

                    {registrationData.language_level && (
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">سطح زبان</p>
                          <p className="font-medium">{registrationData.language_level}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Messages */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {registrationData.status === 'pending' && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  درخواست شما در حال بررسی توسط تیم ادمین است. پس از بررسی، نتیجه از طریق پیامک یا تماس تلفنی به شما اطلاع‌رسانی خواهد شد.
                </AlertDescription>
              </Alert>
            )}

            {registrationData.status === 'approved' && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  تبریک! درخواست شما تأیید شده است. اطلاعات شما در پلتفرم نمایش داده می‌شود و می‌توانید از خدمات پلتفرم استفاده کنید.
                </AlertDescription>
              </Alert>
            )}

            {registrationData.status === 'rejected' && (
              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  متأسفانه درخواست شما رد شده است. در صورت نیاز به اطلاعات بیشتر، با پشتیبانی تماس بگیرید.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleRefresh} 
            variant="outline"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'در حال بروزرسانی...' : 'بروزرسانی وضعیت'}
          </Button>

          <Button onClick={() => window.location.href = '/'} variant="outline">
            <ArrowLeft className="w-4 h-4 ml-2" />
            بازگشت به صفحه اصلی
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationStatus;
