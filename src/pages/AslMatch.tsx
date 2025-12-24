import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import HeaderAuth from "@/components/ui/HeaderAuth";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { MatchingRadar } from "@/components/MatchingRadar";
import { 
  Users, 
  PlusCircle,
  List,
  Package,
  MessageCircle,
  Star,
  Radio,
  ArrowLeft,
  CheckCircle,
  Clock,
  TrendingUp,
  Info,
  Eye,
  Edit,
  Trash2,
  CalendarClock,
  XCircle,
  AlertTriangle,
  Zap,
  Activity
} from "lucide-react";

interface MatchingRequest {
  id: number;
  product_name: string;
  quantity: string;
  unit: string;
  destination_countries: string;
  price: string;
  currency: string;
  status: string;
  matched_visitor_count: number;
  accepted_visitor_id?: number;
  expires_at: string;
  remaining_time: string;
  is_expired: boolean;
  created_at: string;
  responses?: Array<{
    id: number;
    response_type: string;
    visitor_id: number;
  }>;
}

export default function AslMatch() {
  const navigate = useNavigate();
  const { isAuthenticated, licenseStatus } = useAuth();
  const { toast } = useToast();
  const [hasSupplier, setHasSupplier] = useState(false);
  const [hasVisitor, setHasVisitor] = useState(false);
  const [myRequests, setMyRequests] = useState<MatchingRequest[]>([]);
  const [availableRequests, setAvailableRequests] = useState<MatchingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'my-requests' | 'available' | 'chats' | 'ratings'>('overview');

  useEffect(() => {
    if (isAuthenticated) {
      checkVisitorSupplierStatus();
      if (activeTab === 'my-requests' && hasSupplier) {
        fetchMyRequests();
      } else if (activeTab === 'available' && hasVisitor) {
        fetchAvailableRequests();
      }
    }
  }, [isAuthenticated, activeTab, hasSupplier, hasVisitor]);

  const checkVisitorSupplierStatus = async () => {
    if (!isAuthenticated) return;
    
    try {
      // Check visitor status
      try {
        const visitorStatus = await apiService.getMyVisitorStatus();
        setHasVisitor(visitorStatus.has_visitor || false);
      } catch (error) {
        setHasVisitor(false);
      }

      // Check supplier status
      try {
        const supplierStatus = await apiService.getSupplierStatus();
        setHasSupplier(supplierStatus.has_supplier || false);
      } catch (error) {
        setHasSupplier(false);
      }
    } catch (error) {
      console.error('Error checking visitor/supplier status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const response = await apiService.getMyMatchingRequests();
      setMyRequests(response.requests || []);
    } catch (error) {
      console.error('Error fetching my requests:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "خطا در دریافت درخواست‌های شما",
      });
    }
  };

  const fetchAvailableRequests = async () => {
    try {
      const response = await apiService.getAvailableMatchingRequests();
      setAvailableRequests(response.requests || []);
    } catch (error) {
      console.error('Error fetching available requests:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "خطا در دریافت درخواست‌های موجود",
      });
    }
  };

  if (!isAuthenticated || !licenseStatus?.is_approved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-amber-50 dark:from-gray-900 dark:via-orange-950/20 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md text-center p-8">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">دسترسی محدود</h2>
          <p className="text-muted-foreground mb-4">
            برای دسترسی به ASL Match، باید وارد شوید و لایسنس فعال داشته باشید.
          </p>
          <Button onClick={() => navigate("/login")}>ورود / ثبت‌نام</Button>
        </Card>
      </div>
    );
  }

  // Handle navigation with smart routing
  const handleCreateRequest = () => {
    if (hasSupplier) {
      navigate('/matching/create');
    } else {
      toast({
        title: "نیاز به ثبت‌نام تأمین‌کننده",
        description: "برای ایجاد درخواست، ابتدا باید به عنوان تأمین‌کننده ثبت‌نام کنید.",
        variant: "default",
      });
      navigate('/supplier-registration');
    }
  };

  const handleMyRequests = () => {
    if (hasSupplier) {
      setActiveTab('my-requests');
      fetchMyRequests();
    } else {
      toast({
        title: "نیاز به ثبت‌نام تأمین‌کننده",
        description: "برای مشاهده درخواست‌های خود، ابتدا باید به عنوان تأمین‌کننده ثبت‌نام کنید.",
        variant: "default",
      });
      navigate('/supplier-registration');
    }
  };

  const handleAvailableRequests = () => {
    if (hasVisitor) {
      setActiveTab('available');
      fetchAvailableRequests();
    } else {
      toast({
        title: "نیاز به ثبت‌نام ویزیتور",
        description: "برای مشاهده درخواست‌های موجود، ابتدا باید به عنوان ویزیتور ثبت‌نام کنید.",
        variant: "default",
      });
      navigate('/visitor-registration');
    }
  };

  const menuItems = [
    // Always show - Create Request (smart routing)
    {
      id: "create",
      label: "ایجاد درخواست",
      description: hasSupplier 
        ? "ایجاد درخواست جدید برای فروش محصول" 
        : "برای ایجاد درخواست، ابتدا به عنوان تأمین‌کننده ثبت‌نام کنید",
      icon: PlusCircle,
      color: "from-orange-500 to-orange-600",
      action: handleCreateRequest,
      badge: hasSupplier ? undefined : "نیاز به ثبت‌نام"
    },
    // Always show - My Requests (smart routing)
    {
      id: "my-requests",
      label: "درخواست‌های من",
      description: hasSupplier 
        ? "مشاهده و مدیریت درخواست‌های شما" 
        : "برای مشاهده درخواست‌های خود، ابتدا به عنوان تأمین‌کننده ثبت‌نام کنید",
      icon: List,
      color: "from-orange-600 to-red-600",
      action: handleMyRequests,
      badge: hasSupplier ? undefined : "نیاز به ثبت‌نام"
    },
    // Always show - Available Requests (smart routing)
    {
      id: "available",
      label: "درخواست‌های موجود",
      description: hasVisitor 
        ? "مشاهده درخواست‌های مناسب برای شما" 
        : "برای مشاهده درخواست‌های موجود، ابتدا به عنوان ویزیتور ثبت‌نام کنید",
      icon: Package,
      color: "from-red-500 to-orange-600",
      action: handleAvailableRequests,
      badge: hasVisitor ? undefined : "نیاز به ثبت‌نام"
    },
    // Common for all - Always available
    {
      id: "chats",
      label: "مکالمات",
      description: "چت با تأمین‌کنندگان و ویزیتورها",
      icon: MessageCircle,
      color: "from-orange-500 via-red-500 to-orange-600",
      route: "/matching/chats"
    },
    {
      id: "ratings",
      label: "امتیازها",
      description: "مشاهده امتیازهای دریافتی و داده شده",
      icon: Star,
      color: "from-amber-500 to-orange-600",
      route: "/matching/ratings"
    }
  ];

  const renderOverview = () => (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">وضعیت سیستم</p>
                <p className="text-lg font-bold text-orange-700 dark:text-orange-400">فعال</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-xl">
                <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">کاربران فعال</p>
                <p className="text-lg font-bold text-orange-700 dark:text-orange-400">در حال رشد</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-xl">
                <CheckCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">اتصالات موفق</p>
                <p className="text-lg font-bold text-red-700 dark:text-red-400">رو به افزایش</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Menu - Always Visible */}
      <Card className="mb-6 sm:mb-8 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <Zap className="w-5 h-5 text-orange-600 dark:text-orange-500" />
            دسترسی سریع ASL Match
            <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs px-2 py-0.5 font-bold">
              BETA
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isDisabled = item.badge !== undefined;
              return (
                <Card
                  key={item.id}
                  className={`group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 ${
                    isDisabled 
                      ? 'border-gray-300 dark:border-gray-700 opacity-75 hover:border-orange-300 dark:hover:border-orange-700' 
                      : 'hover:border-orange-300 dark:hover:border-orange-700'
                  } bg-card relative overflow-hidden`}
                  onClick={() => {
                    if (item.route) {
                      navigate(item.route);
                    } else if (item.action) {
                      item.action();
                    }
                  }}
                >
                  {/* Animated gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isDisabled ? 'opacity-50' : ''}`}></div>
                  
                  {/* Shimmer effect */}
                  {!isDisabled && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  )}
                  
                  <CardContent className="p-4 sm:p-5 relative z-10">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className={`p-3 bg-gradient-to-br ${item.color} rounded-xl shadow-lg group-hover:scale-110 ${isDisabled ? '' : 'group-hover:rotate-6'} transition-all duration-300 relative`}>
                        <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <Icon className={`w-6 h-6 sm:w-7 sm:h-7 text-white relative z-10 ${isDisabled ? '' : 'group-hover:scale-110'} transition-transform duration-300`} />
                      </div>
                      <div className="w-full">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <h3 className={`text-sm sm:text-base font-bold ${isDisabled ? 'text-muted-foreground' : 'text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400'} transition-colors`}>
                            {item.label}
                          </h3>
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className={`text-xs ${isDisabled ? 'text-muted-foreground/70' : 'text-muted-foreground'} leading-tight`}>
                          {item.description}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isDisabled}
                        className={`w-full text-xs ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'group-hover:bg-gradient-to-r group-hover:from-orange-50 group-hover:to-red-50 dark:group-hover:from-orange-900/20 dark:group-hover:to-red-900/20 group-hover:border-orange-300 dark:group-hover:border-orange-700 group-hover:text-orange-700 dark:group-hover:text-orange-400'} transition-all duration-300`}
                      >
                        {isDisabled ? 'نیاز به ثبت‌نام' : 'ورود'}
                        {!isDisabled && <ArrowLeft className="w-3 h-3 mr-1 group-hover:translate-x-1 transition-transform" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Menu Items - Detailed Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isDisabled = item.badge !== undefined;
          return (
            <Card
              key={item.id}
              className={`group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 ${
                isDisabled 
                  ? 'border-gray-300 dark:border-gray-700 opacity-75 hover:border-orange-300 dark:hover:border-orange-700' 
                  : 'hover:border-orange-300 dark:hover:border-orange-700'
              } bg-card relative overflow-hidden`}
              onClick={() => {
                if (item.route) {
                  navigate(item.route);
                } else if (item.action) {
                  item.action();
                }
              }}
            >
              {/* Animated gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isDisabled ? 'opacity-50' : ''}`}></div>
              
              {/* Shimmer effect */}
              {!isDisabled && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              )}
              
              <CardContent className="p-6 relative z-10">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`p-4 bg-gradient-to-br ${item.color} rounded-2xl shadow-lg group-hover:scale-110 ${isDisabled ? '' : 'group-hover:rotate-6'} transition-all duration-300 relative`}>
                    <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Icon className={`w-8 h-8 sm:w-10 sm:h-10 text-white relative z-10 ${isDisabled ? '' : 'group-hover:scale-110'} transition-transform duration-300`} />
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <h3 className={`text-lg sm:text-xl font-bold ${isDisabled ? 'text-muted-foreground' : 'text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400'} transition-colors`}>
                        {item.label}
                      </h3>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm ${isDisabled ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                      {item.description}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    disabled={isDisabled}
                    className={`w-full ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'group-hover:bg-gradient-to-r group-hover:from-orange-50 group-hover:to-red-50 dark:group-hover:from-orange-900/20 dark:group-hover:to-red-900/20 group-hover:border-orange-300 dark:group-hover:border-orange-700 group-hover:text-orange-700 dark:group-hover:text-orange-400'} transition-all duration-300`}
                  >
                    {isDisabled ? 'نیاز به ثبت‌نام' : 'ورود'}
                    {!isDisabled && <ArrowLeft className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800 hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <Info className="w-5 h-5 text-orange-600 dark:text-orange-500" />
            درباره ASL Match
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ASL Match یک سیستم هوشمند برای اتصال سریع و خودکار تأمین‌کنندگان ایرانی با ویزیتورهای فعال در کشورهای عربی است. 
            این سیستم با استفاده از الگوریتم‌های پیشرفته، بهترین تطابق‌ها را پیدا کرده و از طریق نوتیفیکیشن‌های فوری، 
            طرفین را مطلع می‌کند.
          </p>
        </CardContent>
      </Card>
    </>
  );

  const renderMyRequests = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-orange-700 dark:text-orange-400">درخواست‌های من</h2>
        <Button 
          onClick={() => navigate('/matching/create')}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
        >
          <PlusCircle className="w-4 h-4 ml-2" />
          ایجاد درخواست جدید
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      ) : myRequests.length === 0 ? (
        <Card className="text-center p-8">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">درخواستی وجود ندارد</h3>
          <p className="text-muted-foreground mb-4">هنوز درخواستی ایجاد نکرده‌اید</p>
          <Button 
            onClick={() => navigate('/matching/create')}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
          >
            <PlusCircle className="w-4 h-4 ml-2" />
            ایجاد اولین درخواست
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {myRequests.map((request) => {
            const acceptedCount = request.responses?.filter(r => r.response_type === 'accepted').length || 0;
            const pendingCount = request.responses?.filter(r => r.response_type === 'question').length || 0;
            const rejectedCount = request.responses?.filter(r => r.response_type === 'rejected').length || 0;

            return (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold">{request.product_name}</h3>
                        <Badge 
                          variant={
                            request.status === 'active' ? 'default' :
                            request.status === 'accepted' ? 'default' :
                            request.status === 'expired' ? 'destructive' :
                            'secondary'
                          }
                          className={
                            request.status === 'active' ? 'bg-green-500' :
                            request.status === 'accepted' ? 'bg-blue-500' :
                            ''
                          }
                        >
                          {request.status === 'active' ? 'فعال' :
                           request.status === 'accepted' ? 'پذیرفته شده' :
                           request.status === 'expired' ? 'منقضی شده' :
                           request.status === 'cancelled' ? 'لغو شده' :
                           'در انتظار'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          <span>{request.quantity} {request.unit}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>{request.price} {request.currency}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{request.remaining_time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{request.matched_visitor_count} ویزیتور</span>
                        </div>
                      </div>
                      {request.status === 'active' && (
                        <div className="mt-4">
                          <MatchingRadar 
                            totalVisitors={request.matched_visitor_count} 
                            acceptedCount={acceptedCount}
                            pendingCount={pendingCount}
                            rejectedCount={rejectedCount}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/matching/requests/${request.id}`)}
                      >
                        <Eye className="w-4 h-4 ml-2" />
                        مشاهده
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderAvailableRequests = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-orange-700 dark:text-orange-400">درخواست‌های موجود</h2>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      ) : availableRequests.length === 0 ? (
        <Card className="text-center p-8">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">درخواستی وجود ندارد</h3>
          <p className="text-muted-foreground">در حال حاضر درخواست مناسبی برای شما وجود ندارد</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {availableRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">{request.product_name}</h3>
                      <Badge variant="default" className="bg-green-500">
                        {request.status === 'active' ? 'فعال' : request.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        <span>{request.quantity} {request.unit}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>{request.price} {request.currency}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{request.remaining_time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/matching/requests/${request.id}`)}
                    >
                      <Eye className="w-4 h-4 ml-2" />
                      مشاهده
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-amber-50 dark:from-gray-900 dark:via-orange-950/20 dark:to-gray-800">
      <HeaderAuth />
      <div className="container mx-auto px-3 sm:px-4 max-w-6xl py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/30"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative p-3 sm:p-4 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-2xl sm:rounded-3xl shadow-lg group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                <Radio className="w-6 h-6 sm:w-8 sm:h-8 text-white relative z-10 group-hover:rotate-180 transition-transform duration-500" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-orange-600 via-orange-700 to-red-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
                  ASL MATCH
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 font-bold shadow-lg animate-pulse">
                    BETA
                  </Badge>
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  سیستم هوشمند اتصال تأمین‌کنندگان و ویزیتورها
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'outline'}
            onClick={() => setActiveTab('overview')}
            className={`${activeTab === 'overview' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white' : ''}`}
          >
            <Activity className="w-4 h-4 ml-2" />
            نمای کلی
          </Button>
          {hasSupplier && (
            <Button
              variant={activeTab === 'my-requests' ? 'default' : 'outline'}
              onClick={() => {
                setActiveTab('my-requests');
                fetchMyRequests();
              }}
              className={`${activeTab === 'my-requests' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white' : ''}`}
            >
              <List className="w-4 h-4 ml-2" />
              درخواست‌های من
            </Button>
          )}
          {hasVisitor && (
            <Button
              variant={activeTab === 'available' ? 'default' : 'outline'}
              onClick={() => {
                setActiveTab('available');
                fetchAvailableRequests();
              }}
              className={`${activeTab === 'available' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white' : ''}`}
            >
              <Package className="w-4 h-4 ml-2" />
              درخواست‌های موجود
            </Button>
          )}
          <Button
            variant={activeTab === 'chats' ? 'default' : 'outline'}
            onClick={() => navigate('/matching/chats')}
            className={`${activeTab === 'chats' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white' : ''}`}
          >
            <MessageCircle className="w-4 h-4 ml-2" />
            مکالمات
          </Button>
          <Button
            variant={activeTab === 'ratings' ? 'default' : 'outline'}
            onClick={() => navigate('/matching/ratings')}
            className={`${activeTab === 'ratings' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white' : ''}`}
          >
            <Star className="w-4 h-4 ml-2" />
            امتیازها
          </Button>
        </div>

        {/* Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'my-requests' && renderMyRequests()}
        {activeTab === 'available' && renderAvailableRequests()}
      </div>
    </div>
  );
}
