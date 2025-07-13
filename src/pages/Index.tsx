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
        {/* Navigation Menu */}
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <Button
                key={item.id}
                variant="outline"
                className={`h-24 md:h-36 w-full flex flex-col gap-2 md:gap-3 rounded-2xl md:rounded-3xl border-0 md:border border-border bg-transparent md:bg-card/80 hover:bg-accent hover:border-orange-400/40 text-center shadow-none md:shadow-lg hover:shadow-xl transition-all duration-300 text-xs md:text-sm font-bold leading-tight px-2 md:px-4 py-3 md:py-6 group ${
                  isActive
                    ? "bg-gradient-to-br from-orange-100 to-orange-200 md:border-orange-400 md:shadow-xl md:shadow-orange-400/30 md:scale-105"
                    : "text-muted-foreground md:hover:shadow-lg md:hover:scale-105"
                }`}
                onClick={() => setActiveSection(item.id)}
              >
                <div className={`w-16 h-16 md:w-14 md:h-14 mx-auto rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isActive 
                    ? "bg-gradient-to-br from-orange-400 to-orange-500 shadow-lg" 
                    : "bg-transparent md:bg-gradient-to-br md:from-orange-500/10 md:to-orange-600/10 group-hover:from-orange-500/20 group-hover:to-orange-600/20"
                }`}>
                  <Icon className={`w-8 h-8 md:w-10 md:h-10 ${isActive ? "text-white" : "text-orange-400"} drop-shadow-lg`} />
                </div>
                <span className={`text-xs md:text-sm font-bold ${isActive ? "text-orange-600" : "text-foreground"} leading-tight`}>
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