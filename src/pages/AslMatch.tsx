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
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
    // Don't check visitor/supplier status here - let each page check it when needed
  }, [isAuthenticated]);

  // Page is accessible to everyone - no authentication/license required
  // Users can see all features, but checks will be done in target pages

  // Handle navigation - checks will be done in the target pages
  const handleCreateRequest = () => {
    if (!isAuthenticated) {
      toast({
        title: "نیاز به ورود",
        description: "برای ایجاد درخواست، ابتدا باید وارد شوید.",
        variant: "default",
      });
      navigate('/login');
      return;
    }
    navigate('/matching/create');
  };

  const handleMyRequests = () => {
    if (!isAuthenticated) {
      toast({
        title: "نیاز به ورود",
        description: "برای مشاهده درخواست‌های خود، ابتدا باید وارد شوید.",
        variant: "default",
      });
      navigate('/login');
      return;
    }
    navigate('/matching/my-requests');
  };

  const handleAvailableRequests = () => {
    if (!isAuthenticated) {
      toast({
        title: "نیاز به ورود",
        description: "برای مشاهده درخواست‌های موجود، ابتدا باید وارد شوید.",
        variant: "default",
      });
      navigate('/login');
      return;
    }
    navigate('/matching/available-requests');
  };

  const handleChats = () => {
    if (!isAuthenticated) {
      toast({
        title: "نیاز به ورود",
        description: "برای دسترسی به مکالمات، ابتدا باید وارد شوید.",
        variant: "default",
      });
      navigate('/login');
      return;
    }
    navigate('/matching/chats');
  };

  const handleRatings = () => {
    if (!isAuthenticated) {
      toast({
        title: "نیاز به ورود",
        description: "برای مشاهده امتیازها، ابتدا باید وارد شوید.",
        variant: "default",
      });
      navigate('/login');
      return;
    }
    navigate('/matching/ratings');
  };

  const menuItems = [
    // Always show - Create Request
    {
      id: "create",
      label: "ایجاد درخواست",
      description: "ایجاد درخواست جدید برای فروش محصول",
      icon: PlusCircle,
      color: "from-orange-500 to-orange-600",
      action: handleCreateRequest
    },
    // Always show - My Requests
    {
      id: "my-requests",
      label: "درخواست‌های من",
      description: "مشاهده و مدیریت درخواست‌های شما",
      icon: List,
      color: "from-orange-600 to-red-600",
      action: handleMyRequests
    },
    // Always show - Available Requests
    {
      id: "available",
      label: "درخواست‌های موجود",
      description: "مشاهده درخواست‌های مناسب برای شما",
      icon: Package,
      color: "from-red-500 to-orange-600",
      action: handleAvailableRequests
    },
    // Common for all - Always available (but require authentication)
    {
      id: "chats",
      label: "مکالمات",
      description: isAuthenticated 
        ? "چت با تأمین‌کنندگان و ویزیتورها" 
        : "برای دسترسی به مکالمات، ابتدا وارد شوید",
      icon: MessageCircle,
      color: "from-orange-500 via-red-500 to-orange-600",
      action: handleChats,
      badge: !isAuthenticated ? "نیاز به ورود" : undefined
    },
    {
      id: "ratings",
      label: "امتیازها",
      description: isAuthenticated 
        ? "مشاهده امتیازهای دریافتی و داده شده" 
        : "برای مشاهده امتیازها، ابتدا وارد شوید",
      icon: Star,
      color: "from-amber-500 to-orange-600",
      action: handleRatings,
      badge: !isAuthenticated ? "نیاز به ورود" : undefined
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
                    if (item.action) {
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
                if (item.action) {
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

        {/* Content */}
        {renderOverview()}
      </div>
    </div>
  );
}
