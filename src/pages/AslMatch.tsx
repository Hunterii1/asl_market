import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import HeaderAuth from "@/components/ui/HeaderAuth";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/services/api";
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
  Info
} from "lucide-react";

export default function AslMatch() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [hasSupplier, setHasSupplier] = useState(false);
  const [hasVisitor, setHasVisitor] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      checkVisitorSupplierStatus();
    }
  }, [isAuthenticated]);

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
    }
  };

  const menuItems = [
    // For Suppliers
    ...(hasSupplier ? [
      {
        id: "create",
        label: "ایجاد درخواست",
        description: "ایجاد درخواست جدید برای فروش محصول",
        icon: PlusCircle,
        color: "from-emerald-500 to-green-600",
        route: "/matching/create"
      },
      {
        id: "my-requests",
        label: "درخواست‌های من",
        description: "مشاهده و مدیریت درخواست‌های شما",
        icon: List,
        color: "from-blue-500 to-indigo-600",
        route: "/matching/my-requests"
      }
    ] : []),
    // For Visitors
    ...(hasVisitor ? [
      {
        id: "available",
        label: "درخواست‌های موجود",
        description: "مشاهده درخواست‌های مناسب برای شما",
        icon: Package,
        color: "from-purple-500 to-pink-600",
        route: "/matching/available-requests"
      }
    ] : []),
    // Common for all
    {
      id: "chats",
      label: "مکالمات",
      description: "چت با تأمین‌کنندگان و ویزیتورها",
      icon: MessageCircle,
      color: "from-orange-500 to-red-600",
      route: "/matching/chats"
    },
    {
      id: "ratings",
      label: "امتیازها",
      description: "مشاهده امتیازهای دریافتی و داده شده",
      icon: Star,
      color: "from-yellow-500 to-amber-600",
      route: "/matching/ratings"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
      <HeaderAuth />
      <div className="container mx-auto px-3 sm:px-4 max-w-6xl py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl sm:rounded-3xl shadow-lg">
                <Radio className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-2 sm:gap-3">
                  ASL MATCH
                  <Badge className="bg-emerald-500 text-white text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 font-bold">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">وضعیت سیستم</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">فعال</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">کاربران فعال</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-400">در حال رشد</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">اتصالات موفق</p>
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-400">رو به افزایش</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.id}
                className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-emerald-300 dark:hover:border-emerald-700 bg-card"
                onClick={() => navigate(item.route)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`p-4 bg-gradient-to-br ${item.color} rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                        {item.label}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 group-hover:border-emerald-300 dark:group-hover:border-emerald-700"
                    >
                      ورود
                      <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Card */}
        <Card className="mt-6 sm:mt-8 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-emerald-600" />
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
      </div>
    </div>
  );
}

