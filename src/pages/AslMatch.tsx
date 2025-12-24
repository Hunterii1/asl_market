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
  Eye,
  Edit,
  Trash2,
  CalendarClock,
  XCircle,
  AlertTriangle,
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
        <Card className="group bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-200 dark:border-orange-800 hover:shadow-2xl hover:scale-105 transition-all duration-500 relative overflow-hidden animate-in fade-in-0 slide-in-from-left-4 duration-700">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <CardContent className="p-4 sm:p-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative p-3 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl opacity-0 group-hover:opacity-20 animate-pulse"></div>
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">وضعیت سیستم</p>
                <p className="text-lg font-bold text-orange-700 dark:text-orange-400 flex items-center gap-2">
                  <span>فعال</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-2 border-orange-200 dark:border-orange-800 hover:shadow-2xl hover:scale-105 transition-all duration-500 relative overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-700" style={{ animationDelay: '0.1s' }}>
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-amber-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <CardContent className="p-4 sm:p-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative p-3 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-xl group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl opacity-0 group-hover:opacity-20 animate-pulse"></div>
                <Users className="w-6 h-6 text-orange-600 dark:text-orange-400 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">کاربران فعال</p>
                <p className="text-lg font-bold text-orange-700 dark:text-orange-400 flex items-center gap-2">
                  <span>در حال رشد</span>
                  <TrendingUp className="w-4 h-4 text-green-500 animate-bounce" />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800 hover:shadow-2xl hover:scale-105 transition-all duration-500 relative overflow-hidden animate-in fade-in-0 slide-in-from-right-4 duration-700" style={{ animationDelay: '0.2s' }}>
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-400/10 to-orange-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <CardContent className="p-4 sm:p-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative p-3 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-orange-500 rounded-xl opacity-0 group-hover:opacity-20 animate-pulse"></div>
                <CheckCircle className="w-6 h-6 text-red-600 dark:text-red-400 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute top-0 right-0 w-2 h-2 bg-purple-500 rounded-full animate-ping" style={{ animationDelay: '0.6s' }}></div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">اتصالات موفق</p>
                <p className="text-lg font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                  <span>رو به افزایش</span>
                  <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isDisabled = item.badge !== undefined;
          return (
            <Card
              key={item.id}
              className={`group hover:shadow-2xl hover:scale-[1.03] transition-all duration-500 cursor-pointer border-2 ${
                isDisabled 
                  ? 'border-gray-300 dark:border-gray-700 opacity-75 hover:border-orange-300 dark:hover:border-orange-700' 
                  : 'hover:border-orange-300 dark:hover:border-orange-700 border-orange-200/50 dark:border-orange-800/50'
              } bg-card/80 backdrop-blur-sm relative overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-700`}
              style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              onClick={() => {
                if (item.action) {
                  item.action();
                }
              }}
            >
              {/* Animated gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${isDisabled ? 'opacity-5' : ''}`}></div>
              
              {/* Shimmer effect */}
              {!isDisabled && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              )}

              {/* Glowing border effect */}
              {!isDisabled && (
                <div className="absolute inset-0 rounded-lg border-2 border-transparent bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
              )}
              
              {/* Pulsing dots */}
              {!isDisabled && (
                <>
                  <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ animationDelay: '0.3s' }}></div>
                </>
              )}
              
              <CardContent className="p-6 relative z-10">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`relative p-4 bg-gradient-to-br ${item.color} rounded-2xl shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ${isDisabled ? '' : 'group-hover:shadow-orange-500/50'}`}>
                    {/* Rotating ring */}
                    {!isDisabled && (
                      <div className="absolute inset-0 rounded-2xl border-2 border-white/30 animate-spin opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDuration: '3s' }}></div>
                    )}
                    {/* Pulsing glow */}
                    <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                    {/* Icon */}
                    <Icon className={`w-8 h-8 sm:w-10 sm:h-10 text-white relative z-10 ${isDisabled ? '' : 'group-hover:scale-110 group-hover:rotate-12'} transition-transform duration-300`} />
                    {/* Glowing dots on icon */}
                    {!isDisabled && (
                      <>
                        <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute bottom-1 left-1 w-1 h-1 bg-white rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ animationDelay: '0.5s' }}></div>
                      </>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <h3 className={`text-lg sm:text-xl font-extrabold ${isDisabled ? 'text-muted-foreground' : 'text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400'} transition-colors duration-300`}>
                        {item.label}
                      </h3>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 animate-pulse">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm ${isDisabled ? 'text-muted-foreground/70' : 'text-muted-foreground'} group-hover:text-foreground/80 transition-colors duration-300`}>
                      {item.description}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    disabled={isDisabled}
                    className={`w-full relative overflow-hidden ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'group-hover:bg-gradient-to-r group-hover:from-orange-50 group-hover:to-red-50 dark:group-hover:from-orange-900/20 dark:group-hover:to-red-900/20 group-hover:border-orange-300 dark:group-hover:border-orange-700 group-hover:text-orange-700 dark:group-hover:text-orange-400 group-hover:shadow-lg group-hover:scale-105'} transition-all duration-300`}
                  >
                    {/* Button shimmer */}
                    {!isDisabled && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isDisabled ? 'نیاز به ثبت‌نام' : 'ورود'}
                      {!isDisabled && <ArrowLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />}
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

    </>
  );


  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-amber-50 dark:from-gray-900 dark:via-orange-950/20 dark:to-gray-800 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-orange-300 dark:bg-orange-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-red-300 dark:bg-red-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-amber-300 dark:bg-amber-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-orange-200 dark:bg-orange-800 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-15 animate-blob animation-delay-6000"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-orange-400/30 dark:bg-orange-600/30 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <HeaderAuth />
      <div className="container mx-auto px-3 sm:px-4 max-w-6xl py-4 sm:py-8 relative z-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8 animate-in fade-in-0 slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3 sm:gap-4 flex-1">
              <div className="relative p-3 sm:p-4 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-2xl sm:rounded-3xl shadow-2xl group hover:scale-110 transition-all duration-300">
                {/* Pulsing glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                {/* Rotating ring */}
                <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border-4 border-white/30 animate-spin" style={{ animationDuration: '20s' }}></div>
                <Radio className="w-6 h-6 sm:w-8 sm:h-8 text-white relative z-10 group-hover:rotate-180 transition-transform duration-500" />
                {/* Glowing dots */}
                <div className="absolute top-0 right-0 w-3 h-3 bg-white rounded-full animate-ping opacity-75"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 bg-white rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }}></div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r from-orange-600 via-orange-700 to-red-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3 animate-in fade-in-0 slide-in-from-right-4 duration-700">
                  <span className="relative">
                    ASL MATCH
                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg blur opacity-20 animate-pulse"></div>
                  </span>
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 font-bold shadow-lg animate-pulse hover:scale-110 transition-transform duration-300">
                    BETA
                  </Badge>
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1 flex items-center gap-2 animate-in fade-in-0 slide-in-from-right-4 duration-700" style={{ animationDelay: '0.2s' }}>
                  <Activity className="w-4 h-4 text-orange-500 animate-pulse" />
                  سیستم هوشمند اتصال تأمین‌کنندگان و ویزیتورها
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700" style={{ animationDelay: '0.3s' }}>
          {renderOverview()}
        </div>
      </div>
    </div>
  );
}
