import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import HeaderAuth from "@/components/ui/HeaderAuth";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  ArrowUpRight,
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
  Wrench,
  BookOpen,
  Globe,
  Zap,
  Star,
  Settings,
  Package,
  CreditCard,
  Truck,
  Bot,
  Palette
} from "lucide-react";
import DashboardSection from "@/components/sections/DashboardSection";
import StepsSection from "@/components/sections/StepsSection";
import ToolsSection from "@/components/sections/ToolsSection";
import AslLearn from "./AslLearn";
import AslSupplier from "./AslSupplier";
import AslExpress from "./AslExpress";
import AslVisit from "./AslVisit";
import AslPay from "./AslPay";
import AslAI from "./AslAI";
import AslAvailable from "./AslAvailable";
import ProductsResearch from "./ProductsResearch";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");

  // Convert numbers to Farsi
  const toFarsiNumber = (num: number) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, (digit) => farsiDigits[parseInt(digit)]);
  };

  const menuItems = [
    { id: "dashboard", label: "داشبورد", icon: BarChart3 },
    { id: "asllearn", label: "آموزش", icon: BookOpen },
    { id: "products", label: "محصولات تحقیقی", icon: Target },
    { id: "aslsupplier", label: "تأمین‌کنندگان", icon: Users },
    { id: "aslexpress", label: "ارسال", icon: Truck },
    { id: "aslvisit", label: "ویزیتورها", icon: Globe },
    { id: "aslpay", label: "دریافت پول", icon: CreditCard },
    { id: "aslai", label: "هوش مصنوعی", icon: Bot },
    { id: "aslavailable", label: "کالاهای موجود", icon: Package },
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardSection />;
      case "asllearn":
        return <AslLearn />;
      case "products":
        return <ProductsResearch />;
      case "aslsupplier":
        return <AslSupplier />;
      case "aslexpress":
        return <AslExpress />;
      case "aslvisit":
        return <AslVisit />;
      case "aslpay":
        return <AslPay />;
      case "aslai":
        return <AslAI />;
      case "aslavailable":
        return <AslAvailable />;
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <HeaderAuth />
      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        {/**
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="rounded-2xl border border-border bg-card/90 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center shadow-sm">
                  <Users className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                </div>
                <Badge className="bg-blue-100 dark:bg-blue-500/20 text-blue-500 dark:text-blue-300 border-none rounded-full px-2 py-0.5 text-xs">کل</Badge>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{toFarsiNumber(7)}</div>
              <p className="text-sm text-muted-foreground">مخاطبین شبکه</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card/90 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-2xl flex items-center justify-center shadow-sm">
                  <Star className="w-5 h-5 text-green-500 dark:text-green-400" />
                </div>
                <Badge className="bg-green-100 dark:bg-green-500/20 text-green-500 dark:text-green-300 border-none rounded-full px-2 py-0.5 text-xs">VIP</Badge>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{toFarsiNumber(2)}</div>
              <p className="text-sm text-muted-foreground">مخاطبین VIP</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card/90 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-2xl flex items-center justify-center shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                </div>
                <Badge className="bg-orange-100 dark:bg-orange-500/20 text-orange-500 dark:text-orange-300 border-none rounded-full px-2 py-0.5 text-xs">اقدام</Badge>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{toFarsiNumber(4)}</div>
              <p className="text-sm text-muted-foreground">نیاز به توجه فوری</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card/90 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-2xl flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                </div>
                <Badge className="bg-purple-100 dark:bg-purple-500/20 text-purple-500 dark:text-purple-300 border-none rounded-full px-2 py-0.5 text-xs">فرصت</Badge>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{toFarsiNumber(0)}</div>
              <p className="text-sm text-muted-foreground">فرصت‌های رشد</p>
            </CardContent>
          </Card>
        </div>
        */}
        {/* TODO: کارت‌های آمار موقتاً غیرفعال شدند. برای استفاده مجدد فقط این بخش را از کامنت خارج کنید. */}

        {/* Navigation Menu */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <Button
                key={item.id}
                variant="outline"
                className={`h-32 md:h-36 flex flex-col gap-3 rounded-3xl border border-border bg-card/80 hover:bg-accent hover:border-orange-400/40 text-center shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-bold leading-tight px-4 py-6 group ${
                  isActive
                    ? "border-orange-400 shadow-xl shadow-orange-400/30 scale-105"
                    : "text-muted-foreground hover:shadow-lg hover:scale-105"
                }`}
                onClick={() => setActiveSection(item.id)}
              >
                <div className={`w-12 h-12 md:w-14 md:h-14 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isActive 
                    ? "bg-gradient-to-br from-orange-400 to-orange-500 shadow-lg" 
                    : "bg-gradient-to-br from-orange-500/10 to-orange-600/10 group-hover:from-orange-500/20 group-hover:to-orange-600/20"
                }`}>
                  <Icon className={`w-7 h-7 md:w-8 md:h-8 ${isActive ? "text-white" : "text-orange-400"} drop-shadow-lg`} />
                </div>
                <span className={`text-xs md:text-sm font-bold ${isActive ? "text-orange-400" : "text-foreground"}`}>
                  {item.label}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Dynamic Content */}
        <div className="animate-fade-in">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
};

export default Index;