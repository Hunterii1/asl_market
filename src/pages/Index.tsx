import { useState, useEffect } from "react";
import {
  SiteOnboardingStory,
  hasSeenSiteOnboarding,
} from "@/components/SiteOnboardingStory";
import { apiService } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import HeaderAuth from "@/components/ui/HeaderAuth";
import { useAuth } from "@/hooks/useAuth";
import AuthRequiredModal from "@/components/AuthRequiredModal";
import { Logo } from "@/components/ui/Logo";
import { useNavigate } from "react-router-dom";
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
  UserCheck,
  Zap,
  Star,
  Settings,
  Package,
  CreditCard,
  Truck,
  Bot,
  Palette,
  Building,
  Globe,
  ExternalLink,
  ArrowLeft,
  Radio,
  Headphones,
  User,
  Key,
  MapPin
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
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import Slider from "@/components/Slider";
import { GlobalSearchBar } from "@/components/GlobalSearchBar";

const SITE_ONBOARDING_DELAY_MS = 1000;

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState("");
  const { isAuthenticated, licenseStatus } = useAuth();
  const navigate = useNavigate();
  const [hasSupplier, setHasSupplier] = useState(false);
  const [hasVisitor, setHasVisitor] = useState(false);
  const [siteOnboardingOpen, setSiteOnboardingOpen] = useState(false);

  // Featured suppliers preview for dashboard (only for licensed users)
  const [featuredSuppliers, setFeaturedSuppliers] = useState<any[]>([]);
  const [loadingFeaturedSuppliers, setLoadingFeaturedSuppliers] = useState(false);

  // اولین بازدید سایت: یک بار استوری‌لاین معرفی کل سایت را نشان بده.
  useEffect(() => {
    if (hasSeenSiteOnboarding()) return;
    const t = setTimeout(() => {
      setSiteOnboardingOpen(true);
    }, SITE_ONBOARDING_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Convert numbers to Farsi
  const toFarsiNumber = (num: number) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, (digit) => farsiDigits[parseInt(digit)]);
  };

  // Load featured suppliers for dashboard slider (for همه؛ مهمان از API عمومی، کاربر لایسنس‌دار از API کامل)
  useEffect(() => {
    const loadFeatured = async () => {
      try {
        setLoadingFeaturedSuppliers(true);
        let suppliers: any[] = [];
        if (isAuthenticated && licenseStatus?.has_license && licenseStatus.is_active) {
          // کاربر لایسنس‌دار: از لیست کامل تأمین‌کننده‌ها استفاده کن
          const response = await apiService.getApprovedSuppliers({
            page: 1,
            per_page: 24,
          });
          if (Array.isArray(response)) {
            suppliers = response;
          } else if (response?.suppliers && Array.isArray(response.suppliers)) {
            suppliers = response.suppliers;
          } else if (response?.data && Array.isArray(response.data)) {
            suppliers = response.data;
          }
        } else {
          // مهمان یا بدون لایسنس: از API عمومی برگزیده‌ها استفاده کن (بدون اطلاعات تماس)
          const response = await apiService.getFeaturedSuppliersPublic(24);
          if (Array.isArray(response)) {
            suppliers = response;
          } else if (response?.suppliers && Array.isArray(response.suppliers)) {
            suppliers = response.suppliers;
          } else if (response?.data && Array.isArray(response.data)) {
            suppliers = response.data;
          }
        }

        const featured = suppliers.filter((s) =>
          s.hasOwnProperty('is_featured') ? s.is_featured === true : true
        );
        setFeaturedSuppliers(featured.slice(0, 12));
      } catch (err) {
        console.error('Error loading featured suppliers for dashboard:', err);
        setFeaturedSuppliers([]);
      } finally {
        setLoadingFeaturedSuppliers(false);
      }
    };

    loadFeatured();
  }, [isAuthenticated, licenseStatus?.has_license, licenseStatus?.is_active]);

  const menuItems = [
    { id: "dashboard", label: "داشبورد", englishLabel: "DASHBOARD", icon: BarChart3 },
    { id: "asllearn", label: "آموزش", englishLabel: "ASL LEARN", icon: BookOpen },
    { id: "products", label: "محصولات تحقیقی", englishLabel: "RESEARCH PRODUCTS", icon: Target },
    { id: "aslsupplier", label: "تأمین‌کنندگان", englishLabel: "ASL SUPPLIER", icon: Users },
    { id: "aslvisit", label: "ویزیتورها", englishLabel: "ASL VISIT", icon: UserCheck },
    { id: "aslpay", label: "دریافت پول", englishLabel: "ASL PAY", icon: CreditCard },
    { id: "aslexpress", label: "ارسال", englishLabel: "ASL EXPRESS", icon: Truck },
    { id: "aslai", label: "هوش مصنوعی", englishLabel: "ASL AI", icon: Bot },
    { id: "aslavailable", label: "کالاهای موجود", englishLabel: "ASL AVAILABLE", icon: Package },
  ];

  const handleSectionClick = async (sectionId: string, sectionLabel: string) => {
    // Features that require authentication
    const protectedFeatures = ["asllearn", "aslsupplier", "aslexpress", "aslvisit", "aslpay", "aslai", "aslavailable", "support"];
    
    if (protectedFeatures.includes(sectionId) && !isAuthenticated) {
      setSelectedFeature(sectionLabel);
      setAuthModalOpen(true);
      return;
    }
    
    setActiveSection(sectionId);

    // Update progress for authenticated users
    if (isAuthenticated && protectedFeatures.includes(sectionId)) {
      try {
        // Map section to activity
        const activityMap: Record<string, string> = {
          "asllearn": "learning",
          "aslsupplier": "suppliers", 
          "aslexpress": "express",
          "aslvisit": "visitors",
          "aslpay": "withdrawal",
          "aslai": "ai",
          "aslavailable": "available",
          "products": "products"
        };

        const activity = activityMap[sectionId];
        if (activity) {
          await apiService.updateUserProgress(activity);
          console.log(`✅ Progress updated for activity: ${activity}`);
        }
      } catch (error) {
        console.error('Error updating progress:', error);
        // Don't show error to user, just log it
      }
    }
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
      <SiteOnboardingStory
        open={siteOnboardingOpen}
        onOpenChange={setSiteOnboardingOpen}
        markAsSeenOnClose
      />
      {/* Header */}
      <HeaderAuth />
      
      {/* Global Search - Mobile only, above banners */}
      <div className="lg:hidden container mx-auto px-3 sm:px-4 pt-4">
        <GlobalSearchBar mobile />
      </div>

      {/* Slider and Quick Access Links - Desktop side by side, Mobile stacked */}
      <div className="container mx-auto px-3 sm:px-4 mt-6 sm:mt-8 mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Quick Access Links - Left side on desktop */}
          <div className="hidden lg:flex flex-col gap-3 w-1/3">
            {[
              { title: 'پشتیبانی و تیکت', icon: Headphones, path: '/support' },
              { title: 'محصولات من', icon: Package, path: '/my-products' },
              { title: 'لایسنس من', icon: Key, path: '/license-info' },
            ].map((link, index) => {
              const Icon = link.icon;
              return (
                <button
                  key={index}
                  onClick={() => navigate(link.path)}
                  className="w-full flex items-center justify-between gap-3 p-5 rounded-2xl border-2 border-orange-500/30 bg-white/10 dark:bg-gray-900/10 backdrop-blur-md text-gray-800 dark:text-gray-200 hover:bg-white/20 dark:hover:bg-gray-900/20 hover:border-orange-500/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                      <Icon className="w-5 h-5 text-orange-500 group-hover:text-orange-600" />
                    </div>
                    <span className="text-right font-semibold text-base">{link.title}</span>
                  </div>
                </button>
              );
            })}
            
            {/* ASL Match - برای همه (مهمان هم بنر را ببیند؛ با کلیک روی بخش‌ها حساب/لایسنس می‌خواهد) */}
            <Button
              onClick={() => navigate('/asl-match')}
                className="w-full h-20 bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 hover:from-orange-600 hover:via-orange-700 hover:to-red-700 text-white rounded-2xl shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 flex items-center justify-center gap-3 group relative overflow-hidden mt-2"
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400/30 via-orange-500/30 to-red-500/30 animate-pulse"></div>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                {/* Glowing particles */}
                <div className="absolute top-0 left-0 w-2 h-2 bg-white rounded-full animate-ping opacity-75" style={{ animationDelay: '0s' }}></div>
                <div className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-0 left-1/4 w-2 h-2 bg-white rounded-full animate-ping opacity-75" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-0 right-1/4 w-2 h-2 bg-white rounded-full animate-ping opacity-75" style={{ animationDelay: '1.5s' }}></div>
                
                {/* Content */}
                <div className="relative z-10 flex items-center gap-3 w-full justify-center">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                    <Radio className="w-6 h-6 text-white group-hover:rotate-180 transition-transform duration-500" />
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-white drop-shadow-lg group-hover:scale-105 transition-transform duration-300">
                        ASL MATCH
                      </span>
                      <Badge className="bg-white/30 text-white border-white/50 text-xs px-2 py-0.5 font-bold backdrop-blur-sm group-hover:bg-white/40 transition-all duration-300 animate-pulse">
                        BETA
                      </Badge>
                    </div>
                    <p className="text-xs text-white/90 font-semibold mt-0.5">
                      سیستم هوشمند اتصال تأمین‌کنندگان و ویزیتورها
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-white/80 group-hover:text-white transition-colors">
                    <span className="text-sm font-semibold">{isAuthenticated ? 'ورود' : 'مشاهده'}</span>
                    <ArrowLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </Button>
          </div>

          {/* Slider - Right side on desktop, full width on mobile */}
          <div className="w-full lg:w-2/3">
            <Slider />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">

        {/* ASL Match - برای همه (مهمان هم بنر را ببیند) */}
        <div className="mb-4 sm:mb-6 lg:hidden">
          <Button
            onClick={() => navigate('/asl-match')}
              className="w-full h-16 sm:h-20 md:h-24 bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 hover:from-orange-600 hover:via-orange-700 hover:to-red-700 text-white rounded-2xl sm:rounded-3xl shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 flex items-center justify-center gap-3 sm:gap-4 group relative overflow-hidden"
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/30 via-orange-500/30 to-red-500/30 animate-pulse"></div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              {/* Glowing particles */}
              <div className="absolute top-0 left-0 w-2 h-2 bg-white rounded-full animate-ping opacity-75" style={{ animationDelay: '0s' }}></div>
              <div className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute bottom-0 left-1/4 w-2 h-2 bg-white rounded-full animate-ping opacity-75" style={{ animationDelay: '1s' }}></div>
              <div className="absolute bottom-0 right-1/4 w-2 h-2 bg-white rounded-full animate-ping opacity-75" style={{ animationDelay: '1.5s' }}></div>
              
              {/* Content */}
              <div className="relative z-10 flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                  <Radio className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white group-hover:rotate-180 transition-transform duration-500" />
                </div>
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white drop-shadow-lg group-hover:scale-105 transition-transform duration-300">
                      ASL MATCH
                    </span>
                    <Badge className="bg-white/30 text-white border-white/50 text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 font-bold backdrop-blur-sm group-hover:bg-white/40 transition-all duration-300 animate-pulse">
                      BETA
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm md:text-base text-white/90 font-semibold mt-0.5 sm:mt-1">
                    سیستم هوشمند اتصال تأمین‌کنندگان و ویزیتورها
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-white/80 group-hover:text-white transition-colors">
                  <span className="text-sm font-semibold">{isAuthenticated ? 'ورود' : 'مشاهده'}</span>
                  <ArrowLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </Button>
        </div>

        {/* Navigation Menu - 9 Main Buttons */}
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
                <div className="text-center">
                  <span className={`text-xs sm:text-sm font-bold ${isActive ? "text-orange-600 dark:text-orange-400" : "text-gray-800 dark:text-foreground"} leading-tight block`}>
                    {item.label}
                  </span>
                  <span className={`text-[10px] sm:text-xs font-medium ${isActive ? "text-orange-500 dark:text-orange-300" : "text-gray-600 dark:text-muted-foreground"} leading-tight block mt-0.5`}>
                    {item.englishLabel}
                  </span>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Featured Suppliers Preview Slider (Dashboard) - برای همه (مهمان هم می‌بیند) */}
        {!loadingFeaturedSuppliers && featuredSuppliers.length > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-amber-900/20 via-orange-900/20 to-red-900/20 border-amber-500/40 rounded-3xl">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-amber-100" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-lg font-semibold text-foreground">
                      تأمین‌کنندگان برتر امروز
                    </h3>
                    <p className="text-[11px] sm:text-sm text-amber-100/80">
                      نگاهی سریع به برگزیده‌ترین تأمین‌کننده‌های فعال در پلتفرم
                    </p>
                  </div>
                </div>
                <Badge className="bg-amber-500/20 text-amber-100 border-amber-500/40 rounded-2xl text-xs">
                  {toFarsiNumber(featuredSuppliers.length)} تأمین‌کننده برگزیده
                </Badge>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory -mx-1 px-1">
                {featuredSuppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="min-w-[180px] sm:min-w-[220px] max-w-[230px] sm:max-w-[260px] bg-card/90 border border-amber-500/50 rounded-2xl p-3 flex-shrink-0 hover:border-orange-400/80 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 group cursor-pointer snap-start"
                    onClick={() => navigate('/aslsupplier')}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-2xl bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Building className="w-3 h-3 sm:w-4 sm:h-4 text-amber-100" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs sm:text-sm font-bold text-foreground line-clamp-1">
                          {supplier.brand_name || supplier.full_name}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-amber-100 flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-300 flex-shrink-0" />
                          <span>
                            {toFarsiNumber(
                              (supplier.average_rating && supplier.average_rating > 0
                                ? supplier.average_rating
                                : 5
                              ) || 5
                            )}★
                          </span>
                        </div>
                      </div>
                    </div>

                    {supplier.city && (
                      <div className="text-[10px] sm:text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="line-clamp-1">{supplier.city}</span>
                      </div>
                    )}

                    {(supplier.tag_first_class || supplier.tag_good_price) && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {supplier.tag_first_class && (
                          <Badge className="bg-emerald-500/20 text-emerald-100 border-emerald-500/40 rounded-xl text-[10px]">
                            دسته اول
                          </Badge>
                        )}
                        {supplier.tag_good_price && (
                          <Badge className="bg-sky-500/20 text-sky-100 border-sky-500/40 rounded-xl text-[10px]">
                            خوش قیمت
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-between text-[10px] sm:text-[11px] text-amber-100/90">
                      <span className="truncate">مشاهده همه تأمین‌کنندگان</span>
                      <ArrowLeft className="w-3 h-3 flex-shrink-0 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* PWA Install Prompt - Only for non-authenticated users */}
        {!isAuthenticated && <PWAInstallPrompt />}

        {/* Public Registration Section */}
        {!isAuthenticated && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">ثبت‌نام سریع</h2>
                <p className="text-muted-foreground">بدون نیاز به لایسنس، مستقیماً در پلتفرم عضو شوید</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  asChild
                  className="h-20 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <a href="/public/supplier-registration" className="flex items-center justify-center gap-3">
                    <Building className="w-8 h-8" />
                    <div className="text-right">
                      <div className="font-bold text-lg">ثبت‌نام تأمین‌کننده</div>
                      <div className="text-sm opacity-90">برای تولیدکنندگان ایرانی</div>
                    </div>
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </Button>

                <Button
                  asChild
                  className="h-20 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <a href="/public/visitor-registration" className="flex items-center justify-center gap-3">
                    <Globe className="w-8 h-8" />
                    <div className="text-right">
                      <div className="font-bold text-lg">ثبت‌نام ویزیتور</div>
                      <div className="text-sm opacity-90">برای نمایندگان در کشورهای عربی</div>
                    </div>
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </Button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  پس از ثبت‌نام، درخواست شما توسط ادمین بررسی شده و در صورت تأیید، 
                  اطلاعات شما در پلتفرم نمایش داده خواهد شد.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

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
