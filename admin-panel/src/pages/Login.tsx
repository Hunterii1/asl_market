import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Lock, Mail, Eye, EyeOff, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { login, setSession } from '@/lib/utils/auth';
import { toast } from '@/hooks/use-toast';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';
import { cn } from '@/lib/utils';

export default function Login() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    
    try {
      const { user, token } = await login(data.email, data.password, data.rememberMe);
      
      // Set session
      setSession(user, token, data.rememberMe);
      
      toast({
        title: 'خوش آمدید',
        description: `به پنل مدیریت خوش آمدید، ${user.name}`,
        variant: 'default',
      });

      // Redirect to intended page or dashboard
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error) {
      toast({
        title: 'خطا در ورود',
        description: error instanceof Error ? error.message : 'ایمیل یا رمز عبور اشتباه است',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">پنل مدیریت</h1>
          <p className="text-muted-foreground">ورود به حساب کاربری</p>
        </div>

        {/* Login Card */}
        <Card className="rounded-2xl shadow-xl border-border/50">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">ورود</CardTitle>
            <CardDescription className="text-center">
              ایمیل و رمز عبور خود را وارد کنید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Email/Username */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        ایمیل یا نام کاربری
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="admin@example.com یا admin"
                          {...field}
                          disabled={isSubmitting}
                          className="h-12 text-right"
                          dir="ltr"
                          autoComplete="username"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        رمز عبور
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="رمز عبور خود را وارد کنید"
                            {...field}
                            disabled={isSubmitting}
                            className="h-12 pr-10 text-right"
                            autoComplete="current-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute left-0 top-0 h-full w-10 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isSubmitting}
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="rememberMe"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSubmitting}
                          />
                          <Label
                            htmlFor="rememberMe"
                            className="text-sm cursor-pointer"
                          >
                            مرا به خاطر بسپار
                          </Label>
                        </div>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-sm"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    disabled={isSubmitting}
                  >
                    رمز عبور را فراموش کرده‌ام؟
                  </Button>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                      در حال ورود...
                    </>
                  ) : (
                    <>
                      ورود
                      <ArrowRight className="w-5 h-5 mr-2" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs font-semibold text-foreground mb-2">اطلاعات ورود آزمایشی:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  <span className="font-medium">مدیر سیستم:</span> admin@example.com / admin123
                </p>
                <p>
                  <span className="font-medium">مدیر محتوا:</span> content@example.com / content123
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>© ۱۴۰۳ تمامی حقوق محفوظ است</p>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <ForgotPasswordDialog
        open={isForgotPasswordOpen}
        onOpenChange={setIsForgotPasswordOpen}
      />
    </div>
  );
}

