import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  Key, 
  Calendar, 
  RefreshCw, 
  AlertTriangle,
  Shield,
  Info,
  ArrowUp,
  Loader2
} from 'lucide-react';
import { apiService, type LicenseInfo, type LicenseStatus } from '@/services/api';
import { licenseStorage } from '@/utils/licenseStorage';

export function LicenseInfo() {
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upgradeRequests, setUpgradeRequests] = useState([]);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeNote, setUpgradeNote] = useState('');
  const [upgradingLoading, setUpgradingLoading] = useState(false);
  const { toast } = useToast();

  const fetchLicenseData = async () => {
    try {
      setLoading(true);
      
      // دریافت وضعیت لایسنس
      const status = await apiService.checkLicenseStatus();
      setLicenseStatus(status);
      
      if (status.has_license && status.is_active) {
        // دریافت اطلاعات تفصیلی لایسنس
        try {
          const info = await apiService.getLicenseInfo();
          setLicenseInfo(info);
          
          // ذخیره در storage محلی
          licenseStorage.storeLicenseInfo(
            info.license_code,
            info.activated_at
          );
        } catch (err) {
          console.error('Failed to fetch license info:', err);
          
          // در صورت خطا، از storage محلی استفاده کن
          const storedInfo = licenseStorage.getStoredLicenseInfo();
                  if (storedInfo) {
          setLicenseInfo({
            license_code: storedInfo.license_code,
            activated_at: storedInfo.activated_at,
            expires_at: '',
            type: 'plus',
            duration: 12,
            remaining_days: 0,
            remaining_hours: 0,
            is_active: true
          });
        }
        }
      }
    } catch (error) {
      console.error('Error fetching license data:', error);
      
      // در صورت خطا، بررسی storage محلی
      if (licenseStorage.hasStoredLicense() && licenseStorage.isStoredLicenseValid()) {
        const storedInfo = licenseStorage.getStoredLicenseInfo();
        if (storedInfo) {
          setLicenseInfo({
            license_code: storedInfo.license_code,
            activated_at: storedInfo.activated_at,
            expires_at: '',
            type: 'plus',
            duration: 12,
            remaining_days: 0,
            remaining_hours: 0,
            is_active: true
          });
          setLicenseStatus({
            has_license: true,
            is_approved: true,
            is_active: true
          });
        }
      }
      
      toast({
        variant: "destructive",
        title: "خطا",
        description: "خطا در دریافت اطلاعات لایسنس",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLicenseData();
    setRefreshing(false);
    
    toast({
      title: "بروزرسانی شد",
      description: "اطلاعات لایسنس بروزرسانی شد",
    });
  };

  const fetchUpgradeRequests = async () => {
    try {
      const response = await apiService.getUserUpgradeRequests();
      setUpgradeRequests(response.requests || []);
    } catch (error) {
      console.error('Error fetching upgrade requests:', error);
    }
  };

  const handleUpgradeRequest = async () => {
    setUpgradingLoading(true);
    try {
      await apiService.createUpgradeRequest({
        to_plan: 'Pro',
        request_note: upgradeNote
      });
      
      toast({
        title: "درخواست ارتقا ارسال شد",
        description: "درخواست شما برای ارتقا به پلن پرو ارسال شد و در انتظار بررسی ادمین است.",
      });
      
      setUpgradeDialogOpen(false);
      setUpgradeNote('');
      await fetchUpgradeRequests(); // Refresh requests
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در ارسال درخواست ارتقا",
      });
    } finally {
      setUpgradingLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenseData();
    fetchUpgradeRequests();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            اطلاعات لایسنس
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!licenseStatus?.has_license) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            اطلاعات لایسنس
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              شما هنوز لایسنس فعالی ندارید. برای استفاده از تمام امکانات سایت، لطفا لایسنس خود را فعال کنید.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

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

  const getUpgradeStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'در انتظار بررسی';
      case 'approved': return 'تایید شد';
      case 'rejected': return 'رد شد';
      default: return status;
    }
  };

  const getUpgradeStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const canUpgrade = licenseInfo?.type === 'plus' && !upgradeRequests.some((req: any) => req.status === 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          اطلاعات لایسنس
          <Badge variant="secondary" className="mr-auto">
            <CheckCircle className="h-3 w-3 mr-1" />
            فعال
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {licenseInfo && (
          <>
            <div className="flex items-center gap-3">
              <Key className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">کد لایسنس</p>
                <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded mt-1">
                  {licenseInfo.license_code}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">تاریخ فعال‌سازی</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(licenseInfo.activated_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">نوع لایسنس</p>
                <Badge variant={licenseInfo.type === 'pro' ? 'default' : 'secondary'} className="mt-1">
                  {licenseInfo.type === 'pro' ? '💎 پرو' : '🔑 پلاس'} ({licenseInfo.duration || 12} ماه)
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">زمان باقی‌مانده</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {licenseInfo.remaining_days || 0} روز
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {licenseInfo.remaining_hours || 0} ساعت
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  انقضا: {formatDate(licenseInfo.expires_at)}
                </p>
              </div>
            </div>
          </>
        )}

        <div className="flex items-center gap-3">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-sm font-medium">وضعیت</p>
            <p className="text-xs text-green-600">
              {licenseInfo?.is_active ? 'فعال و قابل استفاده' : 'منقضی شده'}
            </p>
          </div>
        </div>

        {/* نمایش اطلاعات storage محلی */}
        {licenseStorage.hasStoredLicense() && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="text-xs">
                اطلاعات لایسنس در مرورگر شما ذخیره شده است تا در صورت پاک شدن cache دسترسی خود را از دست ندهید.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Upgrade Section */}
        {licenseInfo?.type === 'plus' && (
          <Card className="border-dashed border-blue-300 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3 mb-3">
                <ArrowUp className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">ارتقا به پلن پرو</h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    دسترسی به امکانات پیشرفته با مدت زمان بیشتر (30 ماه)
                  </p>
                </div>
              </div>
              
              {canUpgrade ? (
                <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full">
                      <ArrowUp className="h-4 w-4 mr-2" />
                      درخواست ارتقا به پرو
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <ArrowUp className="h-5 w-5" />
                        درخواست ارتقا به پلن پرو
                      </DialogTitle>
                      <DialogDescription>
                        لطفاً دلیل درخواست ارتقا خود را بنویسید. ادمین با شما تماس خواهد گرفت.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">یادداشت (اختیاری)</label>
                        <Textarea
                          placeholder="مثال: نیاز به مدت زمان بیشتر لایسنس برای پروژه‌های بزرگ دارم..."
                          value={upgradeNote}
                          onChange={(e) => setUpgradeNote(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setUpgradeDialogOpen(false)}
                        disabled={upgradingLoading}
                      >
                        لغو
                      </Button>
                      <Button
                        onClick={handleUpgradeRequest}
                        disabled={upgradingLoading}
                      >
                        {upgradingLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            در حال ارسال...
                          </>
                        ) : (
                          <>
                            <ArrowUp className="h-4 w-4 mr-2" />
                            ارسال درخواست
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    شما درخواست ارتقا در انتظار بررسی دارید.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upgrade Requests History */}
        {upgradeRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">تاریخچه درخواست‌های ارتقا</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upgradeRequests.map((request: any) => (
                  <div key={request.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="text-sm font-medium">{request.from_plan} → {request.to_plan}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(request.created_at)}
                      </p>
                    </div>
                    <Badge className={getUpgradeStatusColor(request.status)}>
                      {getUpgradeStatusText(request.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="pt-2">
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            variant="outline" 
            size="sm"
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'در حال بروزرسانی...' : 'بروزرسانی اطلاعات'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}