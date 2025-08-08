import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { apiService } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { 
  Eye, 
  Phone, 
  Mail, 
  Lock, 
  AlertTriangle, 
  CheckCircle, 
  User,
  Building
} from 'lucide-react';

interface ContactInfo {
  id: number;
  name: string;
  mobile: string;
  email: string;
  type: 'supplier' | 'visitor';
}

interface ContactViewButtonProps {
  targetType: 'supplier' | 'visitor';
  targetId: number;
  targetName: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const ContactViewButton: React.FC<ContactViewButtonProps> = ({
  targetType,
  targetId,
  targetName,
  className = "",
  variant = "outline",
  size = "sm"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [canView, setCanView] = useState(true);
  const [hasViewed, setHasViewed] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [limits, setLimits] = useState({
    remaining_views: 0,
    total_views: 0,
    max_views: 5,
    view_count: 0
  });

  // Check if user can view this contact when component mounts
  useEffect(() => {
    checkViewPermission();
    loadContactLimits();
  }, [targetType, targetId]);

  const checkViewPermission = async () => {
    try {
      const response = await apiService.checkCanViewContact(targetType, targetId);
      setCanView(response.can_view);
      setHasViewed(response.has_viewed);
      setLimits(prev => ({
        ...prev,
        view_count: response.view_count
      }));
    } catch (error) {
      console.error('خطا در بررسی مجوز دیدن اطلاعات تماس:', error);
    }
  };

  const loadContactLimits = async () => {
    try {
      const response = await apiService.getContactLimits();
      setLimits(prev => ({
        ...prev,
        remaining_views: response.remaining_views,
        total_views: response.total_views_today,
        max_views: response.max_daily_views
      }));
    } catch (error) {
      console.error('خطا در دریافت محدودیت‌های تماس:', error);
    }
  };

  const handleViewContact = async () => {
    if (!canView) {
      toast({
        variant: "destructive",
        title: "محدودیت دیدن اطلاعات",
        description: "محدودیت روزانه شما به پایان رسیده است",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.viewContactInfo(targetType, targetId);
      
      if (response.response.success) {
        setContactInfo(response.contact_info);
        setLimits(prev => ({
          remaining_views: response.response.remaining_views,
          total_views: response.response.total_views,
          max_views: response.response.max_views,
          view_count: prev.view_count + 1
        }));
        setHasViewed(true);
        
        // Update canView status
        if (response.response.remaining_views <= 0) {
          setCanView(false);
        }

        toast({
          title: "اطلاعات تماس دریافت شد",
          description: `باقی‌مانده: ${response.response.remaining_views} از ${response.response.max_views}`,
        });
      }
    } catch (error: any) {
      if (error.message.includes('محدودیت روزانه')) {
        setCanView(false);
        toast({
          variant: "destructive",
          title: "محدودیت دیدن اطلاعات",
          description: "محدودیت روزانه شما به پایان رسیده است",
        });
      } else {
        toast({
          variant: "destructive",
          title: "خطا",
          description: "خطا در دریافت اطلاعات تماس",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getButtonIcon = () => {
    if (hasViewed) return <CheckCircle className="w-4 h-4" />;
    if (!canView) return <Lock className="w-4 h-4" />;
    return <Eye className="w-4 h-4" />;
  };

  const getButtonText = () => {
    if (hasViewed) return `دیده شده (${limits.view_count}×)`;
    if (!canView) return "محدودیت تمام";
    return "دیدن اطلاعات";
  };

  const getButtonVariant = () => {
    if (hasViewed) return "secondary";
    if (!canView) return "destructive";
    return variant;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={getButtonVariant()}
          size={size}
          className={`gap-2 ${className}`}
          disabled={loading}
        >
          {getButtonIcon()}
          {getButtonText()}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {targetType === 'supplier' ? (
              <Building className="w-5 h-5 text-orange-400" />
            ) : (
              <User className="w-5 h-5 text-blue-400" />
            )}
            اطلاعات تماس - {targetName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Limits Display */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">محدودیت روزانه</span>
                <Badge variant={canView ? "default" : "destructive"}>
                  {limits.remaining_views} از {limits.max_views} باقی‌مانده
                </Badge>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    canView ? 'bg-blue-500' : 'bg-red-500'
                  }`}
                  style={{
                    width: `${(limits.remaining_views / limits.max_views) * 100}%`
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {!canView && !hasViewed && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                محدودیت روزانه شما برای دیدن اطلاعات تماس به پایان رسیده است.
                فردا می‌توانید مجدداً از این امکان استفاده کنید.
              </AlertDescription>
            </Alert>
          )}

          {/* Contact Information */}
          {contactInfo ? (
            <Card className="bg-background border-border">
              <CardContent className="p-4 space-y-3">
                <div className="text-center mb-3">
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    اطلاعات تماس آشکار شد
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-muted-foreground">شماره تماس:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{contactInfo.mobile}</span>
                </div>
                
                <Separator />
                
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-muted-foreground">ایمیل:</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">{contactInfo.email}</span>
                </div>

                {hasViewed && limits.view_count > 1 && (
                  <>
                    <Separator />
                    <div className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {limits.view_count} بار دیده‌اید
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Preview of Hidden Contact Info */}
              <Card className="bg-muted/30 border-border border-dashed">
                <CardContent className="p-4 space-y-3">
                  <div className="text-center mb-3">
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                      <Lock className="w-3 h-3 mr-1" />
                      اطلاعات مخفی
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">شماره تماس:</span>
                    <span className="font-medium text-muted-foreground">+98xxxxxxxxxx</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">ایمیل:</span>
                    <span className="font-medium text-muted-foreground">xxx@xxxx.xxx</span>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center space-y-3">
                {canView ? (
                  <>
                    <p className="text-muted-foreground text-sm">
                      برای آشکار کردن اطلاعات تماس کلیک کنید
                    </p>
                    <Button 
                      onClick={handleViewContact}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? "در حال دریافت..." : "آشکار کردن اطلاعات تماس"}
                    </Button>
                  </>
                ) : (
                  <Alert variant="destructive">
                    <Lock className="h-4 w-4" />
                    <AlertDescription>
                      محدودیت روزانه به پایان رسیده است
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
