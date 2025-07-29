import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import HeaderAuth from "@/components/ui/HeaderAuth";
import { Eye, EyeOff, LogIn, ArrowRight } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(formData);
      navigate("/");
    } catch (err) {
      // Error toast is handled in api.ts
      console.error("Login error:", err);
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
          <p className="text-sm sm:text-base text-muted-foreground">به پنل کاربری خود وارد شوید</p>
        </div>

        <Card className="bg-card/80 border-border rounded-2xl sm:rounded-3xl shadow-xl">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-center text-foreground flex items-center justify-center gap-2 text-lg sm:text-xl">
              <LogIn className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
              ورود به حساب کاربری
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
            {error && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">ایمیل</Label>
                                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="bg-background border-border text-foreground rounded-xl sm:rounded-2xl h-11 sm:h-10"
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
                      placeholder="رمز عبور خود را وارد کنید"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="bg-background border-border text-foreground rounded-xl sm:rounded-2xl pl-12 h-11 sm:h-10"
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

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl h-12 font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    در حال ورود...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    ورود
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-muted-foreground">
                حساب کاربری ندارید؟{" "}
                <Link
                  to="/signup"
                  className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-colors"
                >
                  ثبت‌نام کنید
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

export default Login; 