import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import HeaderAuth from "@/components/ui/HeaderAuth";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<'supplier' | 'visitor' | null>(null);
  const [mobile, setMobile] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showMobileForm, setShowMobileForm] = useState(false);

  const urlMobile = searchParams.get('mobile');
  const urlType = searchParams.get('type') as 'supplier' | 'visitor';

  useEffect(() => {
    // If URL has parameters, use them directly
    if (urlMobile && urlType) {
      setMobile(urlMobile);
      setSelectedType(urlType);
      setShowForm(true);
      fetchRegistrationStatus(urlMobile, urlType);
    }
  }, [urlMobile, urlType]);

  const fetchRegistrationStatus = async (mobileParam?: string, typeParam?: 'supplier' | 'visitor') => {
    try {
      setLoading(true);
      setError(null);
      
      const mobileToUse = mobileParam || mobile;
      const typeToUse = typeParam || selectedType;
      
      if (!mobileToUse || !typeToUse) {
        throw new Error('اطلاعات ناقص است');
      }
      
      const response = await fetch(`/backend/api/v1/public/registration-status?mobile=${mobileToUse}&type=${typeToUse}`, {
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
        if (data.message && data.message.includes('یافت نشد')) {
          setError('درخواست ثبت‌نام با این شماره موبایل یافت نشد. لطفاً شماره موبایل صحیح را وارد کنید.');
        } else {
          setError(data.message || 'خطا در دریافت اطلاعات');
        }
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

  const handleTypeSelection = (type: 'supplier' | 'visitor') => {
    setSelectedType(type);
    setShowForm(true);
    setShowMobileForm(true);
  };

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile && selectedType) {
      // Validate mobile number format
      const mobileRegex = /^09\d{9}$/;
      if (!mobileRegex.test(mobile)) {
        setError('شماره موبایل باید با 09 شروع شده و 11 رقم باشد');
        return;
      }
      fetchRegistrationStatus(mobile, selectedType);
    }
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

  // Type selection page
  if (!showForm && !urlMobile && !urlType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <HeaderAuth />
        <div className="container mx-auto px-2 sm:px-4 max-w-4xl py-4 sm:py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">بررسی وضعیت ثبت‌نام</CardTitle>
              <p className="text-muted-foreground">ابتدا نوع کاربری خود را انتخاب کنید</p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
                  onClick={() => handleTypeSelection('supplier')}
                >
                  <CardContent className="p-6 text-center">
                    <Building className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                    <h3 className="text-lg font-semibold mb-2">تأمین‌کننده</h3>
                    <p className="text-sm text-muted-foreground">
                      برای بررسی وضعیت ثبت‌نام تأمین‌کننده
                    </p>
                  </CardContent>
                </Card>
                
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-500"
                  onClick={() => handleTypeSelection('visitor')}
                >
                  <CardContent className="p-6 text-center">
                    <Globe className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <h3 className="text-lg font-semibold mb-2">ویزیتور</h3>
                    <p className="text-sm text-muted-foreground">
                      برای بررسی وضعیت ثبت‌نام ویزیتور
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Mobile input form
  if (showForm && selectedType && showMobileForm && !registrationData && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <HeaderAuth />
        <div className="container mx-auto px-2 sm:px-4 max-w-4xl py-4 sm:py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold">
                {selectedType === 'supplier' ? 'بررسی وضعیت تأمین‌کننده' : 'بررسی وضعیت ویزیتور'}
              </CardTitle>
              <p className="text-muted-foreground">شماره موبایل خود را وارد کنید</p>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleMobileSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">شماره موبایل</label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                      if (value.length <= 11) {
                        setMobile(value);
                      }
                    }}
                    placeholder="09123456789"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={11}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    شماره موبایل باید با 09 شروع شده و 11 رقم باشد
                  </p>
                </div>
                <Button type="submit" className="w-full">
                  بررسی وضعیت
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setShowForm(false);
                    setShowMobileForm(false);
                    setSelectedType(null);
                    setMobile('');
                    setError(null);
                  }}
                >
                  بازگشت
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            <div className="space-y-2">
              <Button 
                onClick={() => {
                  setError(null);
                  setMobile('');
                  setShowForm(false);
                  setSelectedType(null);
                }} 
                className="w-full"
              >
                تلاش مجدد
              </Button>
              <Button onClick={() => window.location.href = '/'} variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 ml-2" />
                بازگشت به صفحه اصلی
              </Button>
            </div>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <HeaderAuth />
      <div className="max-w-4xl mx-auto p-2 sm:p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            وضعیت درخواست ثبت‌نام
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
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
