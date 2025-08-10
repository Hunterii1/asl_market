
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CheckCircle, 
  Circle, 
  PlayCircle, 
  BookOpen, 
  Target, 
  Users, 
  Package, 
  Palette, 
  Megaphone, 
  Truck, 
  CreditCard, 
  Repeat,
  ArrowLeft,
  Clock,
  Award,
  Download,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const StepsSection = () => {
  const [completedSteps, setCompletedSteps] = useState([0, 1]);
  const [selectedStep, setSelectedStep] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  const steps = [
    {
      id: 0,
      title: "انتخاب محصول مناسب",
      description: "یافتن محصول مناسب برای بازار عربی",
      icon: Target,
      color: "orange",
      duration: "۳۰ دقیقه",
      videoUrl: "https://example.com/video1.mp4",
      videoDuration: "05:30",
      tasks: [
        "تحقیق در مورد محصولات پرفروش در کشورهای عربی",
        "بررسی قوانین واردات کشور هدف",
        "تعیین حاشیه سود مناسب",
        "انتخاب نهایی محصول"
      ],
      resources: [
        { name: "گزارش بازار محصولات ایرانی", type: "pdf" },
        { name: "لیست محصولات پرفروش", type: "excel" },
        { name: "راهنمای قوانین واردات", type: "link" }
      ]
    },
    {
      id: 1,
      title: "اعتبارسنجی بازار",
      description: "بررسی و انتخاب کشور هدف مناسب",
      icon: Users,
      color: "blue",
      duration: "۴۵ دقیقه",
      videoUrl: "https://example.com/video2.mp4",
      videoDuration: "08:15",
      tasks: [
        "تحلیل رقبا در کشور هدف",
        "بررسی قدرت خرید مشتریان",
        "تعیین قیمت رقابتی",
        "تست اولیه بازار"
      ],
      resources: [
        { name: "ابزار تحلیل رقبا", type: "tool" },
        { name: "آمار بازار کشورهای عربی", type: "excel" },
        { name: "نمونه تست بازار", type: "template" }
      ]
    },
    {
      id: 2,
      title: "یافتن تأمین‌کننده",
      description: "پیدا کردن تولیدکننده یا تأمین‌کننده مطمئن",
      icon: Package,
      color: "green",
      duration: "۶۰ دقیقه",
      videoUrl: "https://example.com/video3.mp4",
      videoDuration: "12:45",
      tasks: [
        "جستجو در پلتفرم‌های تأمین‌کننده",
        "بررسی سوابق و اعتبار تأمین‌کننده",
        "مذاکره قیمت و شرایط",
        "بستن قرارداد اولیه"
      ],
      resources: [
        { name: "لیست تأمین‌کنندگان معتبر", type: "pdf" },
        { name: "نمونه قرارداد", type: "template" },
        { name: "چک‌لیست ارزیابی تأمین‌کننده", type: "checklist" }
      ]
    },
    {
      id: 3,
      title: "برندسازی و بسته‌بندی",
      description: "آماده‌سازی بسته برندینگ و فروش",
      icon: Palette,
      color: "purple",
      duration: "۹۰ دقیقه",
      videoUrl: "https://example.com/video4.mp4",
      videoDuration: "15:20",
      tasks: [
        "طراحی لوگو و هویت بصری",
        "انتخاب بسته‌بندی مناسب",
        "ترجمه محتوا به عربی",
        "تهیه کاتالوگ محصول"
      ],
      resources: [
        { name: "نمونه طرح‌های برند", type: "template" },
        { name: "راهنمای بسته‌بندی", type: "pdf" },
        { name: "خدمات ترجمه", type: "link" }
      ]
    },
    {
      id: 4,
      title: "کمپین فروش",
      description: "اجرای کمپین فروش ساده و مؤثر",
      icon: Megaphone,
      color: "red",
      duration: "۱۲۰ دقیقه",
      videoUrl: "https://example.com/video5.mp4",
      videoDuration: "18:30",
      tasks: [
        "ایجاد کانال‌های فروش آنلاین",
        "طراحی محتوای تبلیغاتی",
        "راه‌اندازی کمپین در شبکه‌های اجتماعی",
        "پیگیری و بهینه‌سازی"
      ],
      resources: [
        { name: "نمونه محتوای تبلیغاتی", type: "template" },
        { name: "راهنمای شبکه‌های اجتماعی عربی", type: "pdf" },
        { name: "ابزار مدیریت کمپین", type: "tool" }
      ]
    },
    {
      id: 5,
      title: "ارسال محصول",
      description: "ارسال ایمن و سریع به کشور هدف",
      icon: Truck,
      color: "indigo",
      duration: "۶۰ دقیقه",
      videoUrl: "https://example.com/video6.mp4",
      videoDuration: "10:15",
      tasks: [
        "انتخاب شرکت حمل‌ونقل",
        "تنظیم مدارک گمرکی",
        "بیمه محموله",
        "پیگیری ارسال"
      ],
      resources: [
        { name: "لیست شرکت‌های حمل معتبر", type: "excel" },
        { name: "نمونه مدارک گمرکی", type: "template" },
        { name: "راهنمای بیمه محموله", type: "pdf" }
      ]
    },
    {
      id: 6,
      title: "دریافت پول",
      description: "دریافت ایمن پول از مشتری",
      icon: CreditCard,
      color: "yellow",
      duration: "۳۰ دقیقه",
      videoUrl: "https://example.com/video7.mp4",
      videoDuration: "06:45",
      tasks: [
        "تنظیم درگاه پرداخت",
        "تأیید دریافت پول",
        "تبدیل ارز و انتقال",
        "ثبت در سیستم حسابداری"
      ],
      resources: [
        { name: "راهنمای درگاه‌های پرداخت", type: "pdf" },
        { name: "قوانین تبدیل ارز", type: "link" },
        { name: "نرم‌افزار حسابداری", type: "tool" }
      ]
    },
    {
      id: 7,
      title: "سیستم تکرار و رشد",
      description: "ساخت سیستم تکرار فروش و توسعه",
      icon: Repeat,
      color: "pink",
      duration: "۱۸۰ دقیقه",
      videoUrl: "https://example.com/video8.mp4",
      videoDuration: "22:10",
      tasks: [
        "ایجاد سیستم CRM",
        "برنامه‌ریزی فروش تکراری",
        "توسعه شبکه توزیع",
        "برنامه وفاداری مشتری"
      ],
      resources: [
        { name: "نرم‌افزار CRM رایگان", type: "tool" },
        { name: "نمونه برنامه وفاداری", type: "template" },
        { name: "استراتژی‌های رشد", type: "pdf" }
      ]
    }
  ];

  const totalSteps = steps.length;
  const progressPercentage = (completedSteps.length / totalSteps) * 100;

  const toggleStepCompletion = (stepId: number) => {
    if (completedSteps.includes(stepId)) {
      setCompletedSteps(completedSteps.filter(id => id !== stepId));
    } else {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const selectedStepData = steps[selectedStep];

  const getStepStatusIcon = (stepId: number) => {
    if (completedSteps.includes(stepId)) {
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    } else {
      return <Circle className="w-5 h-5 text-gray-600 dark:text-gray-500" />;
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <BookOpen className="w-4 h-4" />;
      case 'excel': return <Target className="w-4 h-4" />;
      case 'template': return <Palette className="w-4 h-4" />;
      case 'tool': return <Package className="w-4 h-4" />;
      case 'link': return <ExternalLink className="w-4 h-4" />;
      case 'checklist': return <CheckCircle className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const goToNextStep = () => {
    if (selectedStep < steps.length - 1) {
      setSelectedStep(selectedStep + 1);
    }
  };

  const goToPrevStep = () => {
    if (selectedStep > 0) {
      setSelectedStep(selectedStep - 1);
    }
  };

  const toggleVideoPlay = () => {
    setIsVideoPlaying(!isVideoPlaying);
  };

  const toggleVideoMute = () => {
    setIsVideoMuted(!isVideoMuted);
  };

  const restartVideo = () => {
    setVideoProgress(0);
    setIsVideoPlaying(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-orange-900/20 to-orange-800/20 border-orange-700/50 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">مسیر یادگیری شما</h2>
              <p className="text-orange-300">۸ مرحله تا اولین فروش موفق</p>
            </div>
            <div className="text-left">
              <div className="text-3xl font-bold text-white">{completedSteps.length}/{totalSteps}</div>
              <p className="text-orange-300">مراحل تکمیل شده</p>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-3 mb-4 rounded-full" />
          <div className="flex items-center gap-4 text-sm text-orange-300">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              پیشرفت: {Math.round(progressPercentage)}%
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              باقی‌مانده: {(8 - completedSteps.length) * 60} دقیقه
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Mobile Navigation */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevStep}
            disabled={selectedStep === 0}
            className="rounded-xl border-gray-700"
          >
            <ChevronRight className="w-4 h-4" />
            قبلی
          </Button>
          <div className="text-center">
            <p className="text-white font-medium">مرحله {selectedStep + 1} از {totalSteps}</p>
            <p className="text-gray-400 text-sm">{selectedStepData.title}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextStep}
            disabled={selectedStep === steps.length - 1}
            className="rounded-xl border-gray-700"
          >
            بعدی
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Steps List - Hidden on mobile, visible on larger screens */}
        <div className="hidden lg:block lg:col-span-1">
          <Card className="bg-gray-900/50 border-gray-800 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-white">مراحل آموزش</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {steps.map((step) => {
                  const Icon = step.icon;
                  const isCompleted = completedSteps.includes(step.id);
                  const isSelected = selectedStep === step.id;
                  
                  return (
                    <div
                      key={step.id}
                      className={`p-4 cursor-pointer transition-all border-r-4 rounded-r-xl ${
                        isSelected
                          ? 'bg-orange-500/10 border-orange-500'
                          : 'hover:bg-gray-800/50 border-transparent'
                      }`}
                      onClick={() => setSelectedStep(step.id)}
                    >
                      <div className="flex items-center gap-3">
                        {getStepStatusIcon(step.id)}
                        <Icon className={`w-5 h-5 ${isCompleted ? 'text-green-400' : 'text-orange-400'}`} />
                        <div className="flex-1">
                          <h3 className={`font-medium ${isCompleted ? 'text-green-400' : 'text-white'}`}>
                            {step.title}
                          </h3>
                          <p className="text-xs text-gray-400">{step.description}</p>
                        </div>
                        {isCompleted && (
                          <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30 rounded-full">
                            ✓
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Step Details */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900/50 border-gray-800 rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-2xl flex items-center justify-center`}>
                    <selectedStepData.icon className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">{selectedStepData.title}</CardTitle>
                    <p className="text-gray-400">{selectedStepData.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{selectedStepData.duration}</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Video Player */}
              <div className="relative">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-orange-400" />
                  ویدئوی آموزشی
                </h3>
                <div className="relative bg-gray-800 rounded-2xl overflow-hidden aspect-video">
                  {/* Video Placeholder */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Play className="w-8 h-8 text-orange-400" />
                      </div>
                      <p className="text-white font-medium">ویدئوی آموزش {selectedStepData.title}</p>
                      <p className="text-gray-400 text-sm">مدت زمان: {selectedStepData.videoDuration}</p>
                    </div>
                  </div>
                  
                  {/* Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={toggleVideoPlay}
                        className="text-white hover:bg-white/20 rounded-xl p-2"
                      >
                        {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={restartVideo}
                        className="text-white hover:bg-white/20 rounded-xl p-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      
                      <div className="flex-1 mx-3">
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${videoProgress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={toggleVideoMute}
                        className="text-white hover:bg-white/20 rounded-xl p-2"
                      >
                        {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20 rounded-xl p-2"
                      >
                        <Maximize className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tasks Checklist */}
              <div>
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-orange-400" />
                  کارهای این مرحله
                </h3>
                <div className="space-y-3">
                  {selectedStepData.tasks.map((task, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-2xl hover:bg-gray-800/50 transition-colors">
                      <Checkbox className="border-gray-600 rounded" />
                      <span className="text-gray-300 flex-1">{task}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div>
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Download className="w-5 h-5 text-orange-400" />
                  فایل‌ها و ابزارها
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {selectedStepData.resources.map((resource, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-2xl hover:bg-gray-800/50 transition-colors cursor-pointer group">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                        {getResourceIcon(resource.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-white group-hover:text-orange-100 transition-colors font-medium">{resource.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{resource.type}</p>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-orange-400 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation and Action Buttons */}
              <div className="pt-4 border-t border-gray-700 space-y-4">
                {/* Action Button */}
                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl h-12"
                  onClick={() => toggleStepCompletion(selectedStep)}
                >
                  {completedSteps.includes(selectedStep) ? (
                    <>
                      <CheckCircle className="w-5 h-5 ml-2" />
                      این مرحله تکمیل شده
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-5 h-5 ml-2" />
                      شروع این مرحله
                    </>
                  )}
                </Button>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={goToPrevStep}
                    disabled={selectedStep === 0}
                    className="rounded-xl border-gray-700"
                  >
                    <ChevronRight className="w-4 h-4 ml-2" />
                    مرحله قبل
                  </Button>
                  
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">مرحله {selectedStep + 1} از {totalSteps}</p>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={goToNextStep}
                    disabled={selectedStep === steps.length - 1}
                    className="rounded-xl border-gray-700"
                  >
                    مرحله بعد
                    <ChevronLeft className="w-4 h-4 mr-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StepsSection;
