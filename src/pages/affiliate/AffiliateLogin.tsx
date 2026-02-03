import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, Lock, User, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { affiliateApi, setAffiliateSession, clearAffiliateSession } from "@/services/affiliateApi";

export default function AffiliateLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast({ variant: "destructive", title: "خطا", description: "نام کاربری و رمز عبور را وارد کنید" });
      return;
    }
    setLoading(true);
    clearAffiliateSession();
    try {
      const data = await affiliateApi.login(username.trim(), password);
      const user = data.user;
      const token = data.token;
      if (!token || !user) throw new Error("پاسخ سرور نامعتبر است");
      setAffiliateSession(user, token);
      toast({ title: "خوش آمدید", description: `سلام ${user.name}` });
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/affiliate/dashboard";
      navigate(from, { replace: true });
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطا در ورود", description: err?.message || "نام کاربری یا رمز عبور اشتباه است" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Link2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">پنل افیلیت</h1>
          <p className="text-muted-foreground">ورود به حساب افیلیت</p>
        </div>
        <Card className="rounded-2xl shadow-xl border-border/50">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">ورود</CardTitle>
            <CardDescription className="text-center">نام کاربری و رمز عبور خود را وارد کنید</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  نام کاربری
                </Label>
                <Input
                  type="text"
                  placeholder="نام کاربری"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="h-12 text-right"
                  dir="ltr"
                  autoComplete="username"
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
                    placeholder="رمز عبور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="h-12 text-right pr-10"
                    dir="ltr"
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-0 top-0 h-12 w-10"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? "در حال ورود..." : "ورود"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground mt-4">
          <a href="/" className="underline hover:text-foreground">بازگشت به سایت</a>
        </p>
      </div>
    </div>
  );
}
