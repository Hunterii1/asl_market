import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import HeaderAuth from "@/components/ui/HeaderAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Smartphone, ArrowRight } from "lucide-react";
import { apiService } from "@/services/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine API base URL based on environment
  const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'asllmarket.com' || hostname === 'www.asllmarket.com') {
        return 'https://asllmarket.com/backend/api/v1';
      }
    }
    return 'https://asllmarket.com/backend/api/v1';
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "کد ارسال شد",
          description: "کد بازیابی به شماره موبایل شما ارسال شد",
          duration: 5000,
        });
        setStep("reset");
      } else {
        setError(data.error || "خطا در ارسال کد");
      }
    } catch (err) {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("رمز عبور و تکرار آن باید یکسان باشند");
      return;
    }

    if (newPassword.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشد");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          code,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "رمز عبور تغییر یافت",
          description: "رمز عبور شما با موفقیت تغییر یافت",
          duration: 5000,
        });
        navigate("/login");
      } else {
        setError(data.error || "خطا در تغییر رمز عبور");
      }
    } catch (err) {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <HeaderAuth />
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-sm sm:max-w-md">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">اصل مارکت</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {step === "request" ? "بازیابی رمز عبور" : "تغییر رمز عبور"}
            </p>
          </div>

          <Card className="bg-card/80 border-border rounded-2xl sm:rounded-3xl shadow-xl">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-center text-foreground flex items-center justify-center gap-2 text-lg sm:text-xl">
                <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                {step === "request" ? "درخواست کد بازیابی" : "تغییر رمز عبور"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <AlertDescription className="text-blue-400">
                  <strong>توجه:</strong> بازیابی رمز عبور فقط برای کاربرانی که شماره موبایل ثبت شده‌ای دارند امکان‌پذیر است. 
                  اگر با ایمیل ثبت‌نام کرده‌اید، لطفاً با پشتیبانی تماس بگیرید.
                </AlertDescription>
              </Alert>

              {error && (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              {step === "request" ? (
                <form onSubmit={handleRequestCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground">شماره موبایل</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="09123456789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="bg-background border-border text-foreground rounded-2xl"
                      disabled={isLoading}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl h-12 font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        در حال ارسال...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4" />
                        ارسال کد بازیابی
                      </div>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-foreground">کد بازیابی</Label>
                    <Input
                      id="code"
                      name="code"
                      type="text"
                      placeholder="کد ۶ رقمی"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      maxLength={6}
                      className="bg-background border-border text-foreground rounded-2xl"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-foreground">رمز عبور جدید</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      placeholder="حداقل ۶ کاراکتر"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-background border-border text-foreground rounded-2xl"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-foreground">تکرار رمز عبور جدید</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="رمز عبور را مجدداً وارد کنید"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-background border-border text-foreground rounded-2xl"
                      disabled={isLoading}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl h-12 font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        در حال تغییر...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4" />
                        تغییر رمز عبور
                      </div>
                    )}
                  </Button>
                </form>
              )}

              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => setStep("request")}
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  disabled={step === "request"}
                >
                  <ArrowLeft className="w-4 h-4 ml-2" />
                  بازگشت
                </Button>
              </div>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-colors"
                >
                  بازگشت به صفحه ورود
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
