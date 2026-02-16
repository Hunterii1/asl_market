import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, User, Phone, Mail, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { affiliateApi } from "@/lib/affiliateApi";

export default function Register() {
  const [searchParams] = useSearchParams();
  const promoterId = searchParams.get("promoter");
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!promoterId) {
      toast.error("لینک ثبت‌نام نامعتبر است");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }
  }, [promoterId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!promoterId) {
      toast.error("لینک ثبت‌نام نامعتبر است");
      return;
    }

    // Validation
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error("نام و نام خانوادگی را وارد کنید");
      return;
    }

    if (!formData.phone.trim()) {
      toast.error("شماره موبایل را وارد کنید");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("رمز عبور باید حداقل ۶ کاراکتر باشد");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("رمز عبور و تکرار آن باید یکسان باشند");
      return;
    }

    setLoading(true);
    try {
      await affiliateApi.registerWithPromoter({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim(),
        password: formData.password,
        promoter_id: parseInt(promoterId),
      });
      
      setSuccess(true);
      toast.success("ثبت‌نام با موفقیت انجام شد!");
      
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطا در ثبت‌نام");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!promoterId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4" dir="rtl">
        <Card className="rounded-2xl shadow-xl border-border/50 max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive mb-4">لینک ثبت‌نام نامعتبر است</p>
              <Button onClick={() => navigate("/login")}>بازگشت به صفحه ورود</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4" dir="rtl">
        <Card className="rounded-2xl shadow-xl border-border/50 max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">ثبت‌نام موفق!</h2>
              <p className="text-muted-foreground">حساب کاربری شما با موفقیت ایجاد شد.</p>
              <p className="text-sm text-muted-foreground">در حال انتقال به صفحه ورود...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Link2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">ثبت‌نام</h1>
          <p className="text-muted-foreground">حساب کاربری جدید ایجاد کنید</p>
        </div>
        <Card className="rounded-2xl shadow-xl border-border/50">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">فرم ثبت‌نام</CardTitle>
            <CardDescription className="text-center">اطلاعات خود را وارد کنید</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    نام
                  </Label>
                  <Input
                    type="text"
                    name="first_name"
                    placeholder="نام"
                    value={formData.first_name}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-11 text-right"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    نام خانوادگی
                  </Label>
                  <Input
                    type="text"
                    name="last_name"
                    placeholder="نام خانوادگی"
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-11 text-right"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  شماره موبایل
                </Label>
                <Input
                  type="tel"
                  name="phone"
                  placeholder="09123456789"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                  className="h-11 text-right dir-ltr"
                  dir="ltr"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  ایمیل (اختیاری)
                </Label>
                <Input
                  type="email"
                  name="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className="h-11 text-right dir-ltr"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  رمز عبور
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="حداقل ۶ کاراکتر"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-11 text-right pr-10 dir-ltr"
                    dir="ltr"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-0 top-0 h-11 w-10"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  تکرار رمز عبور
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="تکرار رمز عبور"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-11 text-right pr-10 dir-ltr"
                    dir="ltr"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-0 top-0 h-11 w-10"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground mt-4">
          قبلاً ثبت‌نام کرده‌اید؟{" "}
          <a href="/login" className="underline hover:text-foreground">ورود</a>
        </p>
      </div>
    </div>
  );
}
