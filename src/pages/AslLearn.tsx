import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Play,
  CheckCircle,
  Clock,
  TrendingUp,
  Monitor,
  Package,
  ShoppingCart,
  GraduationCap,
  ArrowRight,
  Video,
  FileText,
  Award
} from "lucide-react";
import { LicenseGate } from '@/components/LicenseGate';

const AslLearn = () => {
  const [selectedCategory, setSelectedCategory] = useState("platform");
  const [searchTerm, setSearchTerm] = useState("");

  const trainingCategories = [
    { 
      id: "platform", 
      name: "آموزش کار با پلتفرم", 
      count: 12,
      icon: Monitor,
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      description: "نحوه استفاده از امکانات سایت و پنل کاربری"
    },
    { 
      id: "wholesale", 
      name: "آموزش صادرات عمده", 
      count: 18,
      icon: Package,
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      description: "تکنیک‌های فروش عمده و صادرات به کشورهای هدف"
    },
    { 
      id: "retail", 
      name: "آموزش فروش تکی محصول", 
      count: 15,
      icon: ShoppingCart,
      color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      description: "استراتژی‌های فروش خرده و بازاریابی آنلاین"
    },
    { 
      id: "sales", 
      name: "دوره‌های آموزشی فروش", 
      count: 24,
      icon: GraduationCap,
      color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      description: "آموزش‌های تخصصی مذاکره، بازاریابی و فروش"
    }
  ];



  const trainingModules = {
    platform: [
      {
        id: 1,
        title: "آشنایی با پنل کاربری",
        duration: "۳۰ دقیقه",
        lessons: 5,
        completed: false,
        difficulty: "مقدماتی",
        type: "video"
      },
      {
        id: 2,
        title: "ثبت‌نام تأمین‌کننده و ویزیتور",
        duration: "۲۵ دقیقه",
        lessons: 4,
        completed: false,
        difficulty: "مقدماتی",
        type: "video"
      },
      {
        id: 3,
        title: "استفاده از محدودیت‌های روزانه",
        duration: "۲۰ دقیقه",
        lessons: 3,
        completed: false,
        difficulty: "مقدماتی",
        type: "guide"
      }
    ],
    wholesale: [
      {
        id: 4,
        title: "شناخت بازار کشورهای عربی",
        duration: "۴۵ دقیقه",
        lessons: 6,
        completed: false,
        difficulty: "متوسط",
        type: "video"
      },
      {
        id: 5,
        title: "تکنیک‌های صادرات عمده",
        duration: "۶۰ دقیقه",
        lessons: 8,
        completed: false,
        difficulty: "متوسط",
        type: "course"
      },
      {
        id: 6,
        title: "مدیریت زنجیره تأمین",
        duration: "۵۰ دقیقه",
        lessons: 7,
        completed: false,
        difficulty: "پیشرفته",
        type: "video"
      }
    ],
    retail: [
      {
        id: 7,
        title: "فروش آنلاین محصولات ایرانی",
        duration: "۴۰ دقیقه",
        lessons: 6,
        completed: false,
        difficulty: "مقدماتی",
        type: "video"
      },
      {
        id: 8,
        title: "بازاریابی شبکه‌های اجتماعی",
        duration: "۵۵ دقیقه",
        lessons: 8,
        completed: false,
        difficulty: "متوسط",
        type: "course"
      },
      {
        id: 9,
        title: "مدیریت موجودی و انبار",
        duration: "۳۵ دقیقه",
        lessons: 5,
        completed: false,
        difficulty: "متوسط",
        type: "guide"
      }
    ],
    sales: [
      {
        id: 10,
        title: "مذاکره و قرارداد نویسی",
        duration: "۹۰ دقیقه",
        lessons: 12,
        completed: false,
        difficulty: "پیشرفته",
        type: "course"
      },
      {
        id: 11,
        title: "بازاریابی دیجیتال در خاورمیانه",
        duration: "۷۵ دقیقه",
        lessons: 10,
        completed: false,
        difficulty: "متوسط",
        type: "course"
      },
      {
        id: 12,
        title: "روانشناسی فروش",
        duration: "۶۵ دقیقه",
        lessons: 9,
        completed: false,
        difficulty: "متوسط",
        type: "video"
      }
    ]
  };



  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "آسان": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "متوسط": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "پیشرفته": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };



  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="w-4 h-4" />;
      case "course": return <BookOpen className="w-4 h-4" />;
      case "guide": return <FileText className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "video": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "course": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "guide": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const currentModules = trainingModules[selectedCategory] || [];

  return (
    <LicenseGate>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-100/40 to-blue-200/40 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200/70 dark:border-blue-700/50 rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-200/40 dark:bg-blue-500/20 rounded-3xl flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">آموزش اصل مارکت</h2>
                <p className="text-blue-600 dark:text-blue-300">آموزش جامع کار با پلتفرم و تکنیک‌های فروش</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Training Categories */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-400" />
            دسته‌بندی آموزش‌ها
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {trainingCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Card 
                  key={category.id} 
                  className={`cursor-pointer transition-all hover:scale-105 rounded-3xl ${
                    selectedCategory === category.id 
                      ? "border-blue-500/50 bg-blue-500/10" 
                      : "bg-card/80 border-border hover:border-accent"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${category.color}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-foreground mb-1 text-sm">{category.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{category.description}</p>
                    <Badge className={`${category.color} rounded-full text-xs`}>
                      {category.count} آموزش
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Current Category Training Modules */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Play className="w-6 h-6 text-blue-400" />
            {trainingCategories.find(cat => cat.id === selectedCategory)?.name || "آموزش‌ها"}
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {currentModules.map((module) => (
              <Card key={module.id} className="bg-card/80 border-border hover:border-accent transition-all rounded-3xl">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground mb-2">{module.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {module.duration}
                        </div>
                        <div className="flex items-center gap-1">
                          {getTypeIcon(module.type)}
                          {module.lessons} {module.type === "guide" ? "بخش" : "درس"}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={`${getDifficultyColor(module.difficulty)} rounded-2xl text-xs`}>
                        {module.difficulty}
                      </Badge>
                      <Badge className={`${getTypeColor(module.type)} rounded-2xl text-xs`}>
                        {module.type === "video" ? "ویدئو" : module.type === "course" ? "دوره" : "راهنما"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {module.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Play className="w-5 h-5 text-orange-400" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {module.completed ? "تکمیل شده" : "شروع نشده"}
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      variant={module.completed ? "outline" : "default"}
                      className={`rounded-2xl ${
                        module.completed 
                          ? "border-border text-foreground hover:bg-muted" 
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}
                    >
                      <ArrowRight className="w-4 h-4 ml-2" />
                      {module.completed ? "مرور" : "شروع"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
            آمار آموزش‌ها
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card/80 border-border rounded-3xl">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-blue-200/40 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-foreground">۶۹</div>
                <p className="text-sm text-muted-foreground">مجموع آموزش‌ها</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/80 border-border rounded-3xl">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-green-200/40 dark:bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Video className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-2xl font-bold text-foreground">۳۵</div>
                <p className="text-sm text-muted-foreground">ویدئوی آموزشی</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/80 border-border rounded-3xl">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-orange-200/40 dark:bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Award className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-2xl font-bold text-foreground">۲۱</div>
                <p className="text-sm text-muted-foreground">دوره تخصصی</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/80 border-border rounded-3xl">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-purple-200/40 dark:bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <FileText className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-foreground">۱۳</div>
                <p className="text-sm text-muted-foreground">راهنمای عملی</p>
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
    </LicenseGate>
  );
};

export default AslLearn;