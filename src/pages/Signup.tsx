import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import HeaderAuth from "@/components/ui/HeaderAuth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, UserPlus, ArrowRight } from "lucide-react";

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const refCode = new URLSearchParams(location.search).get("ref") || "";
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "رمز عبور و تکرار آن باید یکسان باشند",
        duration: 5000,
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "خطا", 
        description: "رمز عبور باید حداقل ۶ کاراکتر باشد",
        duration: 5000,
      });
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(refCode ? { ...registerData, referral_code: refCode } : registerData);
      navigate("/");
    } catch (err) {
      // Error toast is handled in api.ts
      console.error("Registration error:", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <HeaderAuth />
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-sm sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">اصل مارکت</h1>
          <p className="text-sm sm:text-base text-muted-foreground">حساب کاربری جدید ایجاد کنید</p>
        </div>

        <Card className="bg-card/80 border-border rounded-2xl sm:rounded-3xl shadow-xl">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-center text-foreground flex items-center justify-center gap-2 text-lg sm:text-xl">
              <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
              ثبت‌نام
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
            {error && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-foreground">نام</Label>
                                      <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      placeholder="نام"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                      className="bg-background border-border text-foreground rounded-xl sm:rounded-2xl h-11 sm:h-10"
                      disabled={isLoading}
                    />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-foreground">نام خانوادگی</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    type="text"
                    placeholder="نام خانوادگی"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="bg-background border-border text-foreground rounded-2xl"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">شماره موبایل *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="09123456789"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="bg-background border-border text-foreground rounded-2xl"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">ایمیل (اختیاری)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-background border-border text-foreground rounded-2xl"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">رمز عبور</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="حداقل ۶ کاراکتر"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="bg-background border-border text-foreground rounded-2xl pl-12"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">تکرار رمز عبور</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="رمز عبور را مجدداً وارد کنید"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="bg-background border-border text-foreground rounded-2xl pl-12"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl h-12 font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    در حال ثبت‌نام...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    ثبت‌نام
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-muted-foreground">
                قبلاً ثبت‌نام کرده‌اید؟{" "}
                <Link
                  to="/login"
                  className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-colors"
                >
                  وارد شوید
                </Link>
              </p>
            </div>

            <div className="text-center">
              <Link
                to="/"
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                بازگشت به صفحه اصلی
              </Link>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default Signup; 