import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
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
      setError(err instanceof Error ? err.message : "خطا در ورود");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">اصل مارکت</h1>
          <p className="text-muted-foreground">به پنل کاربری خود وارد شوید</p>
        </div>

        <Card className="bg-card/80 border-border rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-foreground flex items-center justify-center gap-2">
              <LogIn className="w-6 h-6 text-orange-400" />
              ورود به حساب کاربری
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                    placeholder="رمز عبور خود را وارد کنید"
                    value={formData.password}
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
                  className="text-orange-400 hover:text-orange-300 font-medium transition-colors"
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

        {/* Demo Account Info */}
        <Card className="mt-4 bg-blue-500/10 border-blue-500/30 rounded-2xl">
          <CardContent className="p-4">
            <p className="text-blue-400 text-sm text-center">
              💡 برای تست: ahmad@example.com / password123
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login; 