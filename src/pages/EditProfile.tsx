import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Mail, Phone, Save, ArrowLeft } from 'lucide-react';
import { apiService } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import HeaderAuth from '@/components/ui/HeaderAuth';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export default function EditProfile() {
  const { user, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const updateFormData = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.phone) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "لطفا تمام فیلدهای الزامی را پر کنید",
      });
      return;
    }

    setSaving(true);
    try {
      await apiService.updateProfile(formData);
      
      toast({
        title: "موفقیت‌آمیز",
        description: "پروفایل با موفقیت به‌روزرسانی شد",
      });

      // Refresh user data
      await refreshUserData();
      
      // Navigate back to home page
      navigate('/');
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: error?.message || "خطا در به‌روزرسانی پروفایل. لطفا دوباره تلاش کنید",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            برای ویرایش پروفایل، ابتدا وارد حساب کاربری خود شوید.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <HeaderAuth />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-4 hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              بازگشت به صفحه اصلی
            </Button>
            
            <Card className="mb-6 shadow-lg border-border">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-t-lg">
                <div>
                  <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    ویرایش پروفایل
                  </CardTitle>
                  <p className="text-muted-foreground mt-2">
                    اطلاعات شخصی خود را به‌روزرسانی کنید
                  </p>
                </div>
              </CardHeader>
            </Card>
          </div>

          <Card className="shadow-lg border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <User className="h-5 w-5 text-blue-500" />
                اطلاعات شخصی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-foreground font-medium">
                      نام *
                    </Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => updateFormData('first_name', e.target.value)}
                      placeholder="نام خود را وارد کنید"
                      className="bg-background border-border"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-foreground font-medium">
                      نام خانوادگی *
                    </Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => updateFormData('last_name', e.target.value)}
                      placeholder="نام خانوادگی خود را وارد کنید"
                      className="bg-background border-border"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-foreground font-medium">
                    <Phone className="h-4 w-4 text-blue-500" />
                    شماره موبایل *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    placeholder="شماره موبایل خود را وارد کنید"
                    className="bg-background border-border"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-foreground font-medium">
                    <Mail className="h-4 w-4 text-blue-500" />
                    ایمیل (اختیاری)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="ایمیل خود را وارد کنید"
                    className="bg-background border-border"
                  />
                </div>

                <div className="flex gap-4 pt-6 border-t border-border">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        در حال ذخیره...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        ذخیره تغییرات
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/')}
                    disabled={saving}
                    className="rounded-xl border-border hover:bg-muted"
                  >
                    انصراف
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
