import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import HeaderAuth from "@/components/ui/HeaderAuth";
import { useAuth } from "@/hooks/useAuth";
import AuthRequiredModal from "@/components/AuthRequiredModal";
import { Logo } from "@/components/ui/Logo";
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
import MarketingPopup from "@/components/MarketingPopup";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState("");
  const { isAuthenticated } = useAuth();

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
    { id: "aslvisit", label: "ویزیتورها", icon: Logo },
    { id: "aslpay", label: "دریافت پول", icon: CreditCard },
    { id: "aslai", label: "هوش مصنوعی", icon: Bot },
    { id: "aslavailable", label: "کالاهای موجود", icon: Package },
  ];

  const handleSectionClick = (sectionId: string, sectionLabel: string) => {
    // Features that require authentication
    const protectedFeatures = ["asllearn", "aslsupplier", "aslexpress", "aslvisit", "aslpay", "aslai", "aslavailable"];
    
    if (protectedFeatures.includes(sectionId) && !isAuthenticated) {
      setSelectedFeature(sectionLabel);
      setAuthModalOpen(true);
      return;
    }
    
    setActiveSection(sectionId);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardSection />;
      case "asllearn":
        return isAuthenticated ? <AslLearn /> : <DashboardSection />;
      case "products":
        return <ProductsResearch />;
      case "aslsupplier":
        return isAuthenticated ? <AslSupplier /> : <DashboardSection />;
      case "aslexpress":
        return isAuthenticated ? <AslExpress /> : <DashboardSection />;
      case "aslvisit":
        return isAuthenticated ? <AslVisit /> : <DashboardSection />;
      case "aslpay":
        return isAuthenticated ? <AslPay /> : <DashboardSection />;
      case "aslai":
        return isAuthenticated ? <AslAI /> : <DashboardSection />;
      case "aslavailable":
        return isAuthenticated ? <AslAvailable /> : <DashboardSection />;
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <HeaderAuth />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Navigation Menu */}
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <Button
                key={item.id}
                variant="outline"
                className={`h-20 sm:h-24 md:h-36 w-full flex flex-col gap-1 sm:gap-2 md:gap-3 rounded-2xl sm:rounded-2xl md:rounded-3xl border-0 sm:border border-border bg-transparent sm:bg-card/80 hover:bg-accent hover:border-orange-400/40 text-center shadow-none sm:shadow-lg hover:shadow-xl transition-all duration-300 text-xs sm:text-sm font-bold leading-tight px-1 sm:px-2 md:px-4 py-2 sm:py-3 md:py-6 group ${
                  isActive
                    ? "bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 sm:border-orange-400 sm:shadow-xl sm:shadow-orange-400/30 sm:scale-105"
                    : "text-muted-foreground sm:hover:shadow-lg sm:hover:scale-105"
                }`}
                onClick={() => handleSectionClick(item.id, item.label)}
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto rounded-2xl sm:rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isActive 
                    ? "bg-gradient-to-br from-orange-400 to-orange-500 shadow-lg" 
                    : "bg-transparent sm:bg-gradient-to-br sm:from-orange-500/10 sm:to-orange-600/10 group-hover:from-orange-500/20 group-hover:to-orange-600/20"
                }`}>
                  <Icon className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 ${isActive ? "text-white" : "text-orange-400"} drop-shadow-lg`} />
                </div>
                <span className={`text-xs sm:text-sm font-bold ${isActive ? "text-orange-600 dark:text-orange-400" : "text-foreground"} leading-tight text-center`}>
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

        {/* Auth Required Modal */}
        <AuthRequiredModal 
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          featureName={selectedFeature}
        />

        {/* Marketing Popup */}
        <MarketingPopup isAuthenticated={isAuthenticated} />
      </div>
    </div>
  );
};

export default Index;