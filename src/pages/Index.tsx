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
    { id: "aslsupplier", label: "تأمین‌کنندگان", icon: Users },
    { id: "aslexpress", label: "ارسال", icon: Truck },
    { id: "aslvisit", label: "ویزیتورها", icon: Globe },
    { id: "aslpay", label: "دریافت پول", icon: CreditCard },
    { id: "aslai", label: "هوش مصنوعی", icon: Bot },
    { id: "aslavailable", label: "کالاهای موجود", icon: Package },
    { id: "tools", label: "ابزارها", icon: Wrench },
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardSection />;
      case "asllearn":
        return <AslLearn />;
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
      case "steps":
        return <StepsSection />;
      case "tools":
        return <ToolsSection />;
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
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 mb-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "outline"}
                className={`h-20 flex flex-col gap-1 rounded-2xl border border-border bg-card/80 hover:bg-accent hover:border-orange-400/40 text-center shadow-sm transition-all duration-300 text-xs font-medium leading-tight px-2 py-2 ${
                  isActive
                    ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white border-orange-400 shadow-lg shadow-orange-400/20"
                    : "text-muted-foreground hover:shadow-md"
                }`}
                onClick={() => setActiveSection(item.id)}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1 ${isActive ? "text-white" : "text-muted-foreground"}`} />
                <span>{item.label}</span>
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