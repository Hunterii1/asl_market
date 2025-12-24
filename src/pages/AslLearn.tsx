import { useState, useEffect } from "react";
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
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
  Award,
  Eye,
  Download,
  Copy,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Info,
  Phone,
  Mail
} from "lucide-react";
import { LicenseGate } from '@/components/LicenseGate';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

const AslLearn = () => {
  const [spotPlayerLicense, setSpotPlayerLicense] = useState<any>(null);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const { toast } = useToast();
  const [isGeneratingLicense, setIsGeneratingLicense] = useState(false);
  const [isLoadingLicense, setIsLoadingLicense] = useState(true);
  const [licenseInfo, setLicenseInfo] = useState<any>(null);
  const { licenseStatus } = useAuth();

  // Handle file download with error handling
  const handleDownload = async (fileName: string, displayName: string) => {
    setDownloadingFile(fileName);
    
    try {
      // Try to fetch the file
      const response = await fetch(`/${fileName}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "فایل یافت نشد",
            description: `فایل ${displayName} در حال حاضر در دسترس نیست. لطفاً با پشتیبانی تماس بگیرید.\n\nپشتیبانی تلفنی مجموعه:\nساعت پاسخگویی 9 تا 17\n09939408346`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "خطا در دانلود",
            description: `خطا در دانلود فایل ${displayName}. لطفاً دوباره تلاش کنید.`,
            variant: "destructive"
          });
        }
        return;
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "دانلود موفق",
        description: `فایل ${displayName} با موفقیت دانلود شد.`,
        variant: "default"
      });

    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "خطا در دانلود",
        description: `خطا در دانلود فایل ${displayName}. لطفاً اتصال اینترنت خود را بررسی کنید.`,
        variant: "destructive"
      });
    } finally {
      setDownloadingFile(null);
    }
  };

  // Load license information and SpotPlayer license on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingLicense(true);
        
        // Load license information
        if (licenseStatus?.is_approved) {
          try {
            const licenseResponse = await apiService.getLicenseInfo();
            setLicenseInfo(licenseResponse);
          } catch (error) {
            console.error('Error loading license info:', error);
          }
        }
        
        // Load SpotPlayer license
        // Note: SpotPlayer license is separate from main ASL Market license
        // 404 is normal if user doesn't have SpotPlayer license yet
        try {
          const response = await apiService.getSpotPlayerLicense();
          if (response.success) {
            setSpotPlayerLicense(response.data);
          }
        } catch (spotPlayerError: any) {
          // Silently handle SpotPlayer license errors - it's optional and only for education section
          // 404 means user doesn't have SpotPlayer license yet, which is normal
          if (spotPlayerError?.response?.status !== 404) {
            console.error('Error loading SpotPlayer license:', spotPlayerError);
          }
          // License not found, user needs to generate one - this is expected behavior
        }
      } catch (error) {
        console.error('Error loading license info:', error);
      } finally {
        setIsLoadingLicense(false);
      }
    };

    loadData();
  }, [licenseStatus]);

  const handleGenerateLicense = async () => {
    try {
      setIsGeneratingLicense(true);
      const response = await apiService.generateSpotPlayerLicense();
      
      if (response.success) {
        setSpotPlayerLicense(response.data);
        toast({
          title: "موفقیت",
          description: "لایسنس SpotPlayer با موفقیت ایجاد شد",
        });
      } else {
        toast({
          variant: "destructive",
          title: "خطا",
          description: response.message || "خطا در ایجاد لایسنس",
        });
      }
    } catch (error: any) {
      console.error('Error generating license:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در ایجاد لایسنس",
      });
    } finally {
      setIsGeneratingLicense(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "کپی شد",
      description: "متن در کلیپ‌بورد کپی شد",
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'نامشخص';
    }
  };

  // Check if user has plus4 license
  const isPlus4License = licenseInfo?.type === 'plus4';

  return (
    <LicenseGate>
      <div className="space-y-6 animate-fade-in">
        {/* PWA Install Prompt */}
        <PWAInstallPrompt />

        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-100/40 to-blue-200/40 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200/70 dark:border-blue-700/50 rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-200/40 dark:bg-blue-500/20 rounded-3xl flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">آموزش های اصل مارکت</h2>
                <p className="text-blue-600 dark:text-blue-300">راهنمای کامل استفاده از آموزش های پلتفرم در SpotPlayer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Tutorial Video - Mobile Optimized */}
        <Card className="bg-gradient-to-br from-indigo-100/40 via-purple-100/40 to-pink-100/40 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-indigo-200/70 dark:border-indigo-700/50 rounded-3xl overflow-hidden shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/30 dark:to-purple-500/30 rounded-2xl flex items-center justify-center shadow-lg">
                <Video className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-1">ویدیو آموزش کامل پلتفرم</h3>
                <p className="text-sm text-muted-foreground">آموزش گام به گام بخش‌های مختلف پلتفرم اصل مارکت</p>
              </div>
            </div>
            
            {/* Video Container - Mobile Optimized */}
            <div className="relative bg-black/95 dark:bg-black rounded-2xl overflow-hidden shadow-2xl">
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none z-10"></div>
              
              {/* Video Player */}
              <div className="relative w-full mx-auto" style={{ maxWidth: '400px' }}>
                <video 
                  controls 
                  className="w-full h-auto"
                  playsInline
                  preload="metadata"
                  style={{ 
                    aspectRatio: '9/16',
                    objectFit: 'contain'
                  }}
                >
                  <source src="/amoozesh.mp4" type="video/mp4" />
                  مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
                </video>
              </div>
            </div>
            
            {/* Video Info */}
            <div className="mt-6 space-y-4">
              <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200/50 dark:border-indigo-700/50">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-semibold text-foreground">درباره این ویدیو:</p>
                    <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                      <li>آموزش کامل بخش‌های مختلف پلتفرم اصل مارکت</li>
                      <li>راهنمای استفاده از تمام امکانات و ویژگی‌ها</li>
                      <li>پیشنهاد می‌شود قبل از شروع کار، این ویدیو را کامل مشاهده کنید</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-indigo-200/30 dark:border-indigo-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                      <Play className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">پخش خودکار</span>
                  </div>
                  <p className="text-xs text-muted-foreground">ویدیو به صورت خودکار پخش می‌شود</p>
                </div>
                
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-pink-200/30 dark:border-pink-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">آموزش کامل</span>
                  </div>
                  <p className="text-xs text-muted-foreground">پوشش تمام بخش‌های پلتفرم</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ASL Market Platform Tutorial */}
        <Card className="bg-gradient-to-r from-purple-100/40 to-purple-200/40 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200/70 dark:border-purple-700/50 rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-200/40 dark:bg-purple-500/20 rounded-2xl flex items-center justify-center">
                <Monitor className="w-6 h-6 text-purple-500 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">ویدیو آموزش اصل مارکت</h3>
                <p className="text-purple-600 dark:text-purple-300">راهنمای کامل استفاده از پلتفرم اصل مارکت</p>
              </div>
            </div>
            
            <div className="bg-black rounded-2xl overflow-hidden">
              <video 
                controls 
                className="w-full h-auto"
                poster="/api/placeholder/800/450"
              >
                <source src="/intro.mp4" type="video/mp4" />
                مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
              </video>
            </div>
            
            <div className="mt-4 p-4 bg-muted/50 rounded-xl">
              <p className="text-sm text-muted-foreground text-center mb-4">
                این ویدیو نحوه استفاده از پلتفرم اصل مارکت را به طور کامل آموزش می‌دهد
              </p>
              
              {/* Platform Instructions */}
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-4 border border-purple-200/50 dark:border-purple-700/50">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-purple-600 dark:text-purple-400 text-lg">🏢</span>
                    <p className="text-foreground">پلتفرم اصل مارکت شامل بخش‌های مختلفی برای تجارت و کسب‌وکار است.</p>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 text-lg">📊</span>
                    <p className="text-foreground">بخش‌های اصلی شامل: اصل لرن، اصل ساپلایر، اصل اکسپرس، اصل ویزیت، اصل پی و اصل آی.</p>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 text-lg">🔐</span>
                    <p className="text-foreground">برای دسترسی به تمام امکانات، ابتدا باید لایسنس معتبر خود را فعال کنید.</p>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600 dark:text-orange-400 text-lg">💡</span>
                    <p className="text-foreground">هر بخش دارای آموزش‌ها و راهنمای مخصوص به خود است که در این ویدیو به تفصیل توضیح داده شده.</p>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400 text-lg">⚡</span>
                    <p className="text-foreground">توصیه می‌شود قبل از شروع کار، این ویدیو آموزشی را به طور کامل مشاهده کنید.</p>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400 text-lg">🎯</span>
                    <p className="text-foreground">با استفاده صحیح از پلتفرم، می‌توانید به اهداف تجاری خود برسید.</p>
                  </div>
                  
                  <div className="text-center pt-2">
                    <p className="text-purple-600 dark:text-purple-400 font-semibold">پلتفرم اصل مارکت</p>
                  </div>
                  
                  {/* Support Information */}
                  <div className="mt-4 pt-4 border-t border-purple-200/50 dark:border-purple-700/50">
                    <div className="flex items-start gap-2">
                      <span className="text-purple-600 dark:text-purple-400 text-lg">🆘</span>
                      <div className="flex-1">
                        <p className="text-foreground mb-2">تیم پشتیبانی اصل مارکت همواره در خدمت شماست 👇</p>
                        <div className="space-y-2">
                          <a 
                            href="https://t.me/incoming_center" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors font-mono font-bold"
                          >
                            incoming_center
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200/50 dark:border-purple-700/50">
                            <p className="text-sm font-semibold text-foreground mb-1">پشتیبانی تلفنی مجموعه:</p>
                            <p className="text-xs text-muted-foreground mb-1">ساعت پاسخگویی 9 تا 17</p>
                            <a href="tel:09939408346" className="text-purple-600 dark:text-purple-400 hover:underline font-mono font-bold text-sm">09939408346</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video Tutorial */}
        <Card className="bg-gradient-to-r from-green-100/40 to-green-200/40 dark:from-green-900/20 dark:to-green-800/20 border-green-200/70 dark:border-green-700/50 rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-200/40 dark:bg-green-500/20 rounded-2xl flex items-center justify-center">
                <Play className="w-6 h-6 text-green-500 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">ویدیو آموزشی</h3>
                <p className="text-green-600 dark:text-green-300">راهنمای کامل استفاده از SpotPlayer</p>
              </div>
            </div>
            
            <div className="bg-black rounded-2xl overflow-hidden">
              <video 
                controls 
                className="w-full h-auto"
                poster="/api/placeholder/800/450"
              >
                <source src="https://spotplayer.ir/assets/img/index/vid/v1.mp4" type="video/mp4" />
                مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
              </video>
            </div>
            
            <div className="mt-4 p-4 bg-muted/50 rounded-xl">
              <p className="text-sm text-muted-foreground text-center mb-4">
                این ویدیو نحوه استفاده از پلتفرم SpotPlayer را به طور کامل آموزش می‌دهد
              </p>
              
              {/* Educational Instructions */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/50">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 text-lg">📚</span>
                    <p className="text-foreground">مطالب آموزشی این دوره در پلتفرم اسپات پلیر قابل دسترسی است.</p>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 text-lg">✴️</span>
                    <p className="text-foreground">لطفاً به ترتیب، آموزش‌ها رو مشاهده بفرمایید.</p>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600 dark:text-orange-400 text-lg">✳️</span>
                    <p className="text-foreground">برای مشاهده آموزش‌ها، لطفاً نسخه مناسب دستگاه خود را از وب‌سایت <a href="https://spotplayer.ir" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">spotplayer.ir</a> (قسمت پایین صفحه سایت) دریافت و نصب نمایید.</p>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400 text-lg">🍎</span>
                    <p className="text-foreground">دوستانی که iOS یا Mac دارند باید از نسخه وب اپلیکیشن SpotPlayer استفاده کنند.</p>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <span className="text-purple-600 dark:text-purple-400 text-lg">🔑</span>
                    <p className="text-foreground">کد لایسنس برای ورود به پنل آموزشی اسپات پلیر 👇</p>
                  </div>
                  
                  {spotPlayerLicense ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-2 border-dashed border-purple-300 dark:border-purple-600">
                      <code className="text-lg font-mono text-purple-600 dark:text-purple-400 break-all">
                        {spotPlayerLicense.license_key}
                      </code>
                    </div>
                  ) : (
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <code className="text-lg font-mono text-gray-500 dark:text-gray-400">
                        ۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰
                      </code>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400 text-lg">✨</span>
                    <p className="text-foreground">با آرزوی موفقیت و سربلندی در مسیر آموزش و توسعه.</p>
                  </div>
                  
                  <div className="text-center pt-2">
                    <p className="text-blue-600 dark:text-blue-400 font-semibold">مرکز اینکامینگ ایران</p>
                  </div>
                  
                  {/* Support Information */}
                  <div className="mt-4 pt-4 border-t border-blue-200/50 dark:border-blue-700/50">
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400 text-lg">❇️</span>
                      <div className="flex-1">
                        <p className="text-foreground mb-2">تیم پشتیبانی اصل مارکت همواره در خدمت شماست 👇</p>
                        <div className="space-y-2">
                          <a 
                            href="https://t.me/incoming_center" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors font-mono font-bold"
                          >
                            incoming_center
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200/50 dark:border-green-700/50">
                            <p className="text-sm font-semibold text-foreground mb-1">پشتیبانی تلفنی مجموعه:</p>
                            <p className="text-xs text-muted-foreground mb-1">ساعت پاسخگویی 9 تا 17</p>
                            <a href="tel:09939408346" className="text-green-600 dark:text-green-400 hover:underline font-mono font-bold text-sm">09939408346</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* License Section */}
        <Card className="bg-gradient-to-r from-orange-100/40 to-orange-200/40 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200/70 dark:border-orange-700/50 rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-orange-200/40 dark:bg-orange-500/20 rounded-2xl flex items-center justify-center">
                <Award className="w-6 h-6 text-orange-500 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">لایسنس SpotPlayer</h3>
                <p className="text-orange-600 dark:text-orange-300">لایسنس اختصاصی شما برای دسترسی به محتوا</p>
              </div>
            </div>

            {isLoadingLicense ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="mr-2 text-muted-foreground">در حال بارگذاری...</span>
              </div>
            ) : spotPlayerLicense ? (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    لایسنس شما با موفقیت ایجاد شده است و آماده استفاده می‌باشد.
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">کلید لایسنس:</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-sm font-mono break-all">
                          {spotPlayerLicense.license_key}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(spotPlayerLicense.license_key)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">لینک دانلود:</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-sm font-mono break-all">
                          {spotPlayerLicense.license_url}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(spotPlayerLicense.license_url)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(spotPlayerLicense.license_url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">تاریخ ایجاد:</label>
                      <p className="text-sm bg-muted px-3 py-2 rounded-lg">
                        {formatDate(spotPlayerLicense.created_at)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">وضعیت:</label>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        فعال
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <h4 className="font-semibold text-foreground mb-2">نحوه استفاده:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>کلید لایسنس را کپی کنید</li>
                    <li>در نرم‌افزار SpotPlayer وارد کنید</li>
                    <li>از لینک دانلود برای دریافت فایل استفاده کنید</li>
                    <li>حالا می‌توانید به محتوای آموزشی دسترسی داشته باشید</li>
                  </ol>
                </div>
              </div>
            ) : isPlus4License ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-orange-500 dark:text-orange-400" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">لایسنس SpotPlayer</h4>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 mb-6 border border-orange-200 dark:border-orange-800">
                  <p className="text-orange-800 dark:text-orange-200 mb-3">
                    کاربران با لایسنس 4 ماهه نمی‌توانند لایسنس SpotPlayer جدید درخواست کنند
                  </p>
                  <p className="text-orange-700 dark:text-orange-300 text-sm">
                    لطفاً از لایسنس SpotPlayer قبلی که برای شما ارسال شده است استفاده کنید
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">راهنمای دسترسی:</h5>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 text-right">
                    <li>• لایسنس SpotPlayer قبلی خود را از پیام‌های تلگرام دریافت کنید</li>
                    <li>• در صورت عدم دسترسی، با پشتیبانی تماس بگیرید</li>
                    <li>• آی دی پشتیبانی: <span className="font-mono font-bold">incoming_center</span></li>
                    <li>• پشتیبانی تلفنی مجموعه: <a href="tel:09939408346" className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline">09939408346</a> (ساعت پاسخگویی 9 تا 17)</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">لایسنس ایجاد نشده</h4>
                <p className="text-muted-foreground mb-6">
                  برای دسترسی به محتوای آموزشی، ابتدا باید لایسنس SpotPlayer خود را ایجاد کنید.
                </p>
                <Button
                  onClick={handleGenerateLicense}
                  disabled={isGeneratingLicense}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  {isGeneratingLicense ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      در حال ایجاد...
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4 mr-2" />
                      ایجاد لایسنس
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resources Section */}
        <Card className="bg-gradient-to-r from-purple-100/40 to-purple-200/40 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200/70 dark:border-purple-700/50 rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-purple-200/40 dark:bg-purple-500/20 rounded-2xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-500 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">منابع و مستندات</h3>
                <p className="text-purple-600 dark:text-purple-300">فایل‌های کمکی و راهنماهای تکمیلی</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* CRM Template */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-purple-200/50 dark:border-purple-700/50 hover:border-purple-400/50 dark:hover:border-purple-500/50 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">قالب CRM</h4>
                    <p className="text-xs text-muted-foreground">Excel Template</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  قالب آماده برای مدیریت مشتریان و فروش
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full rounded-lg"
                  onClick={() => handleDownload('CRM_Template_ASL_Market.xlsx', 'قالب CRM')}
                  disabled={downloadingFile === 'CRM_Template_ASL_Market.xlsx'}
                >
                  {downloadingFile === 'CRM_Template_ASL_Market.xlsx' ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 ml-2" />
                  )}
                  {downloadingFile === 'CRM_Template_ASL_Market.xlsx' ? 'در حال دانلود...' : 'دانلود'}
                </Button>
              </div>

              {/* Mega Prompt */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-purple-200/50 dark:border-purple-700/50 hover:border-purple-400/50 dark:hover:border-purple-500/50 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">مگا پرامپت</h4>
                    <p className="text-xs text-muted-foreground">Word Document</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  راهنمای کامل استفاده از هوش مصنوعی
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full rounded-lg"
                  onClick={() => handleDownload('mega prompt ASL MARKET.docx', 'مگا پرامپت')}
                  disabled={downloadingFile === 'mega prompt ASL MARKET.docx'}
                >
                  {downloadingFile === 'mega prompt ASL MARKET.docx' ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 ml-2" />
                  )}
                  {downloadingFile === 'mega prompt ASL MARKET.docx' ? 'در حال دانلود...' : 'دانلود'}
                </Button>
              </div>

              {/* Script */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-purple-200/50 dark:border-purple-700/50 hover:border-purple-400/50 dark:hover:border-purple-500/50 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">اسکریپت</h4>
                    <p className="text-xs text-muted-foreground">Word Document</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  اسکپریت کامل پلتفرم اصل مارکت
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full rounded-lg"
                  onClick={() => handleDownload('Script ASL MARKET.docx', 'اسکریپت')}
                  disabled={downloadingFile === 'Script ASL MARKET.docx'}
                >
                  {downloadingFile === 'Script ASL MARKET.docx' ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 ml-2" />
                  )}
                  {downloadingFile === 'Script ASL MARKET.docx' ? 'در حال دانلود...' : 'دانلود'}
                </Button>
              </div>
            </div>

            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">راهنمای استفاده از فایل‌ها:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>قالب CRM برای مدیریت مشتریان و فروش استفاده می‌شود</li>
                    <li>مگا پرامپت راهنمای کامل استفاده از هوش مصنوعی است</li>
                    <li>اسکریپت کامل پلتفرم اصل مارکت می‌باشد</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Notice about file availability */}
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">توجه:</h4>
                  <p className="text-sm text-muted-foreground">
                    فایل‌های ضمیمه در حال حاضر در حال آماده‌سازی هستند. در صورت عدم دسترسی، 
                    لطفاً با پشتیبانی تماس بگیرید یا از طریق تلگرام درخواست کنید.
                  </p>
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => window.open('https://t.me/aslmarket_support', '_blank')}
                      >
                        <Phone className="w-3 h-3 ml-1" />
                        پشتیبانی تلگرام
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => window.open('mailto:support@asllmarket.com', '_blank')}
                      >
                        <Mail className="w-3 h-3 ml-1" />
                        ایمیل پشتیبانی
                      </Button>
                    </div>
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200/50 dark:border-yellow-700/50">
                      <p className="text-xs font-semibold text-foreground mb-1">پشتیبانی تلفنی مجموعه:</p>
                      <p className="text-xs text-muted-foreground mb-1">ساعت پاسخگویی 9 تا 17</p>
                      <a href="tel:09939408346" className="text-yellow-700 dark:text-yellow-300 hover:underline font-mono font-bold text-sm">09939408346</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </LicenseGate>
  );
};

export default AslLearn;