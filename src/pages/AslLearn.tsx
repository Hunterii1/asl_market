import { useState, useEffect } from "react";
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
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

const AslLearn = () => {
  const [spotPlayerLicense, setSpotPlayerLicense] = useState<any>(null);
  const [isGeneratingLicense, setIsGeneratingLicense] = useState(false);
  const [isLoadingLicense, setIsLoadingLicense] = useState(true);
  const { toast } = useToast();

  // Load SpotPlayer license on component mount
  useEffect(() => {
    const loadSpotPlayerLicense = async () => {
      try {
        setIsLoadingLicense(true);
        const response = await apiService.getSpotPlayerLicense();
        if (response.success) {
          setSpotPlayerLicense(response.data);
        }
      } catch (error) {
        console.error('Error loading SpotPlayer license:', error);
        // License not found, user needs to generate one
      } finally {
        setIsLoadingLicense(false);
      }
    };

    loadSpotPlayerLicense();
  }, []);

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
                <h2 className="text-2xl font-bold text-foreground">آموزش های اصل مارکت</h2>
                <p className="text-blue-600 dark:text-blue-300">راهنمای کامل استفاده از آموزش های پلتفرم در SpotPlayer</p>
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
                        <p className="text-foreground mb-2">آی دی تلگرام پشتیبانی جهت هر گونه مشکل دسترسی به آموزش ها 👇</p>
                        <a 
                          href="https://t.me/incoming_center" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors font-mono font-bold"
                        >
                          @incoming_center
                          <ExternalLink className="w-4 h-4" />
                        </a>
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
      </div>
    </LicenseGate>
  );
};

export default AslLearn;