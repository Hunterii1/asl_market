import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/Logo";
import { 
  Calculator, 
  FileText, 
  TrendingUp, 
  Package, 
  CreditCard, 
  Truck, 
  Users,
  Download,
  ExternalLink,
  Star,
  Clock,
  Zap,
  Shield,
  Target,
  BarChart3,
  MessageSquare
} from "lucide-react";

const ToolsSection = () => {
  // Convert numbers to Farsi
  const toFarsiNumber = (num: number) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, (digit) => farsiDigits[parseInt(digit)]);
  };

  const toolCategories = [
    {
      title: "ابزارهای تحلیل بازار",
      icon: TrendingUp,
      color: "blue",
      tools: [
        {
          name: "تحلیلگر رقبا",
          description: "تحلیل جامع رقبا در بازارهای عربی",
          type: "آنلاین",
          rating: 4.8,
          price: "رایگان",
          icon: Target,
          features: ["تحلیل قیمت", "استراتژی رقبا", "نقاط قوت و ضعف"]
        },
        {
          name: "گزارش بازار محصولات",
          description: "آخرین آمار و ارقام بازار کشورهای عربی",
          type: "PDF",
          rating: 4.9,
          price: "۵۰ هزار تومان",
          icon: BarChart3,
          features: ["آمار فروش", "ترندهای بازار", "پیش‌بینی رشد"]
        },
        {
          name: "ماشین حساب سود",
          description: "محاسبه دقیق سود و زیان پروژه",
          type: "آنلاین",
          rating: 4.7,
          price: "رایگان",
          icon: Calculator,
          features: ["محاسبه هزینه", "تحلیل سود", "نمودار ROI"]
        }
      ]
    },
    {
      title: "مدارک و قراردادها",
      icon: FileText,
      color: "green",
      tools: [
        {
          name: "نمونه قرارداد تأمین‌کننده",
          description: "قرارداد آماده با تأمین‌کنندگان",
          type: "Template",
          rating: 4.6,
          price: "رایگان",
          icon: FileText,
          features: ["قابل ویرایش", "حقوقی معتبر", "چندزبانه"]
        },
        {
          name: "مدارک صادراتی",
          description: "تمام مدارک مورد نیاز برای صادرات",
          type: "Package",
          rating: 4.8,
          price: "۱۰۰ هزار تومان",
          icon: Package,
          features: ["فاکتور تجاری", "بارنامه", "گواهی مبدأ"]
        },
        {
          name: "راهنمای گمرک",
          description: "راهنمای کامل تشریفات گمرکی",
          type: "PDF",
          rating: 4.5,
          price: "۳۰ هزار تومان",
          icon: Shield,
          features: ["مرحله به مرحله", "نکات مهم", "فرم‌های آماده"]
        }
      ]
    },
    {
      title: "ابزارهای پرداخت و حمل",
      icon: CreditCard,
      color: "purple",
      tools: [
        {
          name: "درگاه پرداخت عربی",
          description: "اتصال به درگاه‌های پرداخت کشورهای عربی",
          type: "سرویس",
          rating: 4.9,
          price: "کمیسیونی",
          icon: CreditCard,
          features: ["چند ارزه", "ایمن", "سریع"]
        },
        {
          name: "شرکت‌های حمل",
          description: "لیست شرکت‌های حمل معتبر",
          type: "دایرکتوری",
          rating: 4.7,
          price: "رایگان",
          icon: Truck,
          features: ["قیمت مناسب", "تحویل سریع", "قابل اعتماد"]
        },
        {
          name: "ردیاب محموله",
          description: "سیستم ردیابی لحظه‌ای محموله",
          type: "اپلیکیشن",
          rating: 4.8,
          price: "۲۰ هزار تومان/ماه",
          icon: Package,
          features: ["ردیابی زنده", "اطلاع‌رسانی", "گزارش تحلیلی"]
        }
      ]
    },
    {
      title: "ابزارهای بازاریابی",
      icon: Logo,
      color: "orange",
      tools: [
        {
          name: "مدیریت شبکه‌های اجتماعی",
          description: "مدیریت محتوا در پلتفرم‌های عربی",
          type: "نرم‌افزار",
          rating: 4.6,
          price: "۵۰ هزار تومان/ماه",
          icon: Users,
          features: ["جدولة پست", "تحلیل عملکرد", "مدیریت کامنت"]
        },
        {
          name: "ترجمه تخصصی",
          description: "ترجمه محتوا به عربی تجاری",
          type: "سرویس",
          rating: 4.9,
          price: "۱۰ هزار تومان/صفحه",
          icon: Logo,
          features: ["ترجمه تخصصی", "ویرایش", "تأیید بومی"]
        },
        {
          name: "طراح محتوای تبلیغاتی",
          description: "ابزار طراحی گرافیک تبلیغاتی",
          type: "آنلاین",
          rating: 4.5,
          price: "رایگان",
          icon: Zap,
          features: ["قالب آماده", "فونت عربی", "ویرایش آسان"]
        }
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: string } = {
      blue: "from-blue-900/30 to-blue-800/20 border-blue-700/50",
      green: "from-green-900/30 to-green-800/20 border-green-700/50",
      purple: "from-purple-900/30 to-purple-800/20 border-purple-700/50",
      orange: "from-orange-900/30 to-orange-800/20 border-orange-700/50"
    };
    return colors[color] || colors.blue;
  };

  const getIconColorClasses = (color: string) => {
    const colors: { [key: string]: string } = {
      blue: "bg-blue-500/20 text-blue-400",
      green: "bg-green-500/20 text-green-400",
      purple: "bg-purple-500/20 text-purple-400",
      orange: "bg-orange-500/20 text-orange-400"
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-8 transition-colors duration-300">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">جعبه ابزار حرفه‌ای</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          مجموعه کاملی از ابزارها، قالب‌ها و منابع مورد نیاز برای موفقیت در فروش بین‌المللی
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{toFarsiNumber(24)}+</div>
            <p className="text-sm text-muted-foreground">ابزار تخصصی</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{toFarsiNumber(12)}+</div>
            <p className="text-sm text-muted-foreground">قالب آماده</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{toFarsiNumber(8)}+</div>
            <p className="text-sm text-muted-foreground">سرویس پرمیوم</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{toFarsiNumber(50)}+</div>
            <p className="text-sm text-muted-foreground">راهنمای جامع</p>
          </CardContent>
        </Card>
      </div>

      {/* Tools Categories */}
      {toolCategories.map((category, categoryIndex) => {
        const CategoryIcon = category.icon;
        return (
          <Card key={categoryIndex} className={`bg-gradient-to-r ${getColorClasses(category.color)} rounded-3xl`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-foreground">
                <div className={`w-10 h-10 ${getIconColorClasses(category.color)} rounded-2xl flex items-center justify-center`}>
                  <CategoryIcon className="w-5 h-5" />
                </div>
                {category.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.tools.map((tool, toolIndex) => {
                  const ToolIcon = tool.icon;
                  return (
                    <Card key={toolIndex} className="bg-card/80 border-border hover:border-border transition-all group rounded-3xl">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 bg-muted rounded-2xl flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                            <ToolIcon className="w-5 h-5 text-muted group-hover:text-orange-400 transition-colors" />
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-muted-foreground">{tool.rating.toString().replace('.', '.')}</span>
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-foreground mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors">
                          {tool.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">{tool.description}</p>
                        
                        <div className="space-y-2 mb-4">
                          {tool.features.map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
                              <span className="text-xs text-muted-foreground">{feature}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="secondary" className="bg-muted text-muted-foreground rounded-2xl">
                            {tool.type}
                          </Badge>
                          <span className="font-bold text-orange-400">{tool.price}</span>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full border-border text-muted-foreground hover:bg-orange-500/10 hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-300 rounded-2xl"
                        >
                          {tool.price === "رایگان" ? (
                            <>
                              <Download className="w-4 h-4 ml-2" />
                              دانلود رایگان
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-4 h-4 ml-2" />
                              مشاهده جزئیات
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-orange-900/30 to-orange-800/20 border-orange-700/50 rounded-3xl">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-orange-500/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">نیاز به ابزار خاصی دارید؟</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            تیم ما آماده ساخت ابزارهای تخصصی متناسب با نیاز کسب‌وکار شماست
          </p>
          <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-3xl">
            <MessageSquare className="w-5 h-5 ml-2" />
            درخواست ابزار جدید
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ToolsSection;
