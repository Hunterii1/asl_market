import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Settings,
  Globe,
  Mail,
  MessageSquare,
  Send,
  CreditCard,
  Shield,
  Monitor,
  Key,
  Loader2,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  generalSettingsSchema,
  emailSettingsSchema,
  smsSettingsSchema,
  telegramSettingsSchema,
  paymentSettingsSchema,
  securitySettingsSchema,
  displaySettingsSchema,
  apiSettingsSchema,
  type GeneralSettingsFormData,
  type EmailSettingsFormData,
  type SmsSettingsFormData,
  type TelegramSettingsFormData,
  type PaymentSettingsFormData,
  type SecuritySettingsFormData,
  type DisplaySettingsFormData,
  type ApiSettingsFormData,
} from '@/lib/validations/settings';

// Mock API functions
const loadSettings = async (key: string): Promise<any> => {
  const stored = localStorage.getItem(`asll-settings-${key}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
};

const saveSettings = async (key: string, data: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.1) {
        reject(new Error('خطا در ذخیره تنظیمات. لطفا دوباره تلاش کنید.'));
      } else {
        localStorage.setItem(`asll-settings-${key}`, JSON.stringify(data));
        resolve();
      }
    }, 500);
  });
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // General Settings Form
  const generalForm = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      siteName: '',
      siteDescription: '',
      siteUrl: '',
      siteLogo: '',
      siteFavicon: '',
      contactEmail: '',
      contactPhone: '',
      timezone: 'Asia/Tehran',
      language: 'fa',
      currency: 'IRR',
      currencySymbol: 'تومان',
    },
  });

  // Email Settings Form
  const emailForm = useForm<EmailSettingsFormData>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtpHost: '',
      smtpPort: 587,
      smtpUsername: '',
      smtpPassword: '',
      smtpEncryption: 'tls',
      fromEmail: '',
      fromName: '',
      enabled: true,
    },
  });

  // SMS Settings Form
  const smsForm = useForm<SmsSettingsFormData>({
    resolver: zodResolver(smsSettingsSchema),
    defaultValues: {
      provider: 'kavenegar',
      apiKey: '',
      senderNumber: '',
      templateId: '',
      enabled: true,
    },
  });

  // Telegram Settings Form
  const telegramForm = useForm<TelegramSettingsFormData>({
    resolver: zodResolver(telegramSettingsSchema),
    defaultValues: {
      botToken: '',
      chatId: '',
      enabled: true,
    },
  });

  // Payment Settings Form
  const paymentForm = useForm<PaymentSettingsFormData>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      gateway: 'zarinpal',
      merchantId: '',
      apiKey: '',
      sandbox: false,
      enabled: true,
    },
  });

  // Security Settings Form
  const securityForm = useForm<SecuritySettingsFormData>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      twoFactorEnabled: false,
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      passwordMinLength: 8,
      requireStrongPassword: true,
      ipWhitelist: [],
    },
  });

  // Display Settings Form
  const displayForm = useForm<DisplaySettingsFormData>({
    resolver: zodResolver(displaySettingsSchema),
    defaultValues: {
      theme: 'auto',
      itemsPerPage: 20,
      dateFormat: 'YYYY/MM/DD',
      timeFormat: '24',
      rtl: true,
      showNotifications: true,
      showBreadcrumbs: true,
    },
  });

  // API Settings Form
  const apiForm = useForm<ApiSettingsFormData>({
    resolver: zodResolver(apiSettingsSchema),
    defaultValues: {
      apiEnabled: true,
      apiKey: '',
      rateLimit: 100,
      rateLimitWindow: 60,
      allowedOrigins: [],
    },
  });

  // Load settings on mount
  useEffect(() => {
    const loadAllSettings = async () => {
      const general = await loadSettings('general');
      if (general) generalForm.reset(general);

      const email = await loadSettings('email');
      if (email) emailForm.reset(email);

      const sms = await loadSettings('sms');
      if (sms) smsForm.reset(sms);

      const telegram = await loadSettings('telegram');
      if (telegram) telegramForm.reset(telegram);

      const payment = await loadSettings('payment');
      if (payment) paymentForm.reset(payment);

      const security = await loadSettings('security');
      if (security) securityForm.reset(security);

      const display = await loadSettings('display');
      if (display) displayForm.reset(display);

      const api = await loadSettings('api');
      if (api) apiForm.reset(api);
    };

    loadAllSettings();
  }, []);

  const handleSave = async (form: any, key: string, formData: any) => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await saveSettings(key, formData);
      setSaveSuccess(true);
      toast({
        title: 'موفقیت',
        description: 'تنظیمات با موفقیت ذخیره شد.',
      });

      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      toast({
        title: 'خطا',
        description: error instanceof Error ? error.message : 'خطا در ذخیره تنظیمات',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            تنظیمات سیستم
          </h1>
          <p className="text-muted-foreground">مدیریت و پیکربندی تنظیمات سیستم</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">عمومی</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">ایمیل</span>
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">پیامک</span>
            </TabsTrigger>
            <TabsTrigger value="telegram" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">تلگرام</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">پرداخت</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">امنیتی</span>
            </TabsTrigger>
            <TabsTrigger value="display" className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">نمایش</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">API</span>
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>تنظیمات عمومی</CardTitle>
                <CardDescription>تنظیمات کلی سیستم</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...generalForm}>
                  <form
                    onSubmit={generalForm.handleSubmit((data) =>
                      handleSave(generalForm, 'general', data)
                    )}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={generalForm.control}
                        name="siteName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نام سایت *</FormLabel>
                            <FormControl>
                              <Input {...field} className="text-right" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={generalForm.control}
                        name="siteUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>آدرس سایت</FormLabel>
                            <FormControl>
                              <Input {...field} dir="ltr" className="text-left" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={generalForm.control}
                      name="siteDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>توضیحات سایت</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              className="min-h-[100px]"
                              placeholder="توضیحات کوتاه درباره سایت..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={generalForm.control}
                        name="siteLogo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>آدرس لوگو</FormLabel>
                            <FormControl>
                              <Input {...field} dir="ltr" className="text-left" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={generalForm.control}
                        name="siteFavicon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>آدرس Favicon</FormLabel>
                            <FormControl>
                              <Input {...field} dir="ltr" className="text-left" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={generalForm.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ایمیل تماس</FormLabel>
                            <FormControl>
                              <Input {...field} dir="ltr" className="text-left" type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={generalForm.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>شماره تماس</FormLabel>
                            <FormControl>
                              <Input {...field} className="text-right" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={generalForm.control}
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>منطقه زمانی</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Asia/Tehran">تهران (IRST)</SelectItem>
                                <SelectItem value="UTC">UTC</SelectItem>
                                <SelectItem value="America/New_York">نیویورک (EST)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={generalForm.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>زبان</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="fa">فارسی</SelectItem>
                                <SelectItem value="en">English</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={generalForm.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>واحد پول</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="IRR">ریال (IRR)</SelectItem>
                                <SelectItem value="USD">دلار (USD)</SelectItem>
                                <SelectItem value="EUR">یورو (EUR)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={generalForm.control}
                      name="currencySymbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نماد واحد پول</FormLabel>
                          <FormControl>
                            <Input {...field} className="text-right" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            در حال ذخیره...
                          </>
                        ) : saveSuccess ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 ml-2" />
                            ذخیره شد
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 ml-2" />
                            ذخیره تنظیمات
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>تنظیمات ایمیل</CardTitle>
                <CardDescription>پیکربندی SMTP برای ارسال ایمیل</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...emailForm}>
                  <form
                    onSubmit={emailForm.handleSubmit((data) =>
                      handleSave(emailForm, 'email', data)
                    )}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={emailForm.control}
                        name="smtpHost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>آدرس SMTP *</FormLabel>
                            <FormControl>
                              <Input {...field} dir="ltr" className="text-left" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={emailForm.control}
                        name="smtpPort"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>پورت SMTP *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 587)}
                                className="text-right"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={emailForm.control}
                        name="smtpUsername"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نام کاربری SMTP *</FormLabel>
                            <FormControl>
                              <Input {...field} dir="ltr" className="text-left" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={emailForm.control}
                        name="smtpPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رمز عبور SMTP *</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" dir="ltr" className="text-left" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={emailForm.control}
                        name="smtpEncryption"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نوع رمزنگاری</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">بدون رمزنگاری</SelectItem>
                                <SelectItem value="ssl">SSL</SelectItem>
                                <SelectItem value="tls">TLS</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={emailForm.control}
                        name="enabled"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2 pt-8">
                              <Checkbox
                                id="emailEnabled"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <Label htmlFor="emailEnabled" className="cursor-pointer">
                                فعال کردن ارسال ایمیل
                              </Label>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={emailForm.control}
                        name="fromEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ایمیل فرستنده</FormLabel>
                            <FormControl>
                              <Input {...field} dir="ltr" className="text-left" type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={emailForm.control}
                        name="fromName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نام فرستنده</FormLabel>
                            <FormControl>
                              <Input {...field} className="text-right" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            در حال ذخیره...
                          </>
                        ) : saveSuccess ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 ml-2" />
                            ذخیره شد
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 ml-2" />
                            ذخیره تنظیمات
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMS Settings */}
          <TabsContent value="sms" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>تنظیمات پیامک</CardTitle>
                <CardDescription>پیکربندی سرویس ارسال پیامک</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...smsForm}>
                  <form
                    onSubmit={smsForm.handleSubmit((data) =>
                      handleSave(smsForm, 'sms', data)
                    )}
                    className="space-y-6"
                  >
                    <FormField
                      control={smsForm.control}
                      name="provider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ارائه‌دهنده سرویس</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="kavenegar">کاوه نگار</SelectItem>
                              <SelectItem value="melipayamak">ملی پیامک</SelectItem>
                              <SelectItem value="smsir">پیامک آی آر</SelectItem>
                              <SelectItem value="custom">سفارشی</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={smsForm.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>کلید API *</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" dir="ltr" className="text-left" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={smsForm.control}
                        name="senderNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>شماره فرستنده</FormLabel>
                            <FormControl>
                              <Input {...field} className="text-right" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={smsForm.control}
                        name="templateId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>شناسه قالب</FormLabel>
                            <FormControl>
                              <Input {...field} className="text-right" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={smsForm.control}
                      name="enabled"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="smsEnabled"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <Label htmlFor="smsEnabled" className="cursor-pointer">
                              فعال کردن ارسال پیامک
                            </Label>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            در حال ذخیره...
                          </>
                        ) : saveSuccess ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 ml-2" />
                            ذخیره شد
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 ml-2" />
                            ذخیره تنظیمات
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Telegram Settings */}
          <TabsContent value="telegram" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>تنظیمات تلگرام</CardTitle>
                <CardDescription>پیکربندی ربات تلگرام</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...telegramForm}>
                  <form
                    onSubmit={telegramForm.handleSubmit((data) =>
                      handleSave(telegramForm, 'telegram', data)
                    )}
                    className="space-y-6"
                  >
                    <FormField
                      control={telegramForm.control}
                      name="botToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>توکن ربات *</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" dir="ltr" className="text-left" />
                          </FormControl>
                          <FormDescription>
                            توکن ربات را از @BotFather دریافت کنید
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={telegramForm.control}
                      name="chatId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>شناسه چت</FormLabel>
                          <FormControl>
                            <Input {...field} className="text-right" />
                          </FormControl>
                          <FormDescription>
                            شناسه چت یا کانال برای ارسال پیام
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={telegramForm.control}
                      name="enabled"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="telegramEnabled"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <Label htmlFor="telegramEnabled" className="cursor-pointer">
                              فعال کردن ارسال تلگرام
                            </Label>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            در حال ذخیره...
                          </>
                        ) : saveSuccess ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 ml-2" />
                            ذخیره شد
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 ml-2" />
                            ذخیره تنظیمات
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payment" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>تنظیمات پرداخت</CardTitle>
                <CardDescription>پیکربندی درگاه پرداخت</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...paymentForm}>
                  <form
                    onSubmit={paymentForm.handleSubmit((data) =>
                      handleSave(paymentForm, 'payment', data)
                    )}
                    className="space-y-6"
                  >
                    <FormField
                      control={paymentForm.control}
                      name="gateway"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>درگاه پرداخت</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="zarinpal">زرین‌پال</SelectItem>
                              <SelectItem value="idpay">آیدی پی</SelectItem>
                              <SelectItem value="saman">سامان</SelectItem>
                              <SelectItem value="custom">سفارشی</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={paymentForm.control}
                        name="merchantId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>شناسه مرchant *</FormLabel>
                            <FormControl>
                              <Input {...field} dir="ltr" className="text-left" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentForm.control}
                        name="apiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>کلید API *</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" dir="ltr" className="text-left" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={paymentForm.control}
                        name="sandbox"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="sandbox"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <Label htmlFor="sandbox" className="cursor-pointer">
                                حالت تست (Sandbox)
                              </Label>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentForm.control}
                        name="enabled"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="paymentEnabled"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <Label htmlFor="paymentEnabled" className="cursor-pointer">
                                فعال کردن درگاه پرداخت
                              </Label>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            در حال ذخیره...
                          </>
                        ) : saveSuccess ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 ml-2" />
                            ذخیره شد
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 ml-2" />
                            ذخیره تنظیمات
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>تنظیمات امنیتی</CardTitle>
                <CardDescription>پیکربندی امنیت سیستم</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...securityForm}>
                  <form
                    onSubmit={securityForm.handleSubmit((data) =>
                      handleSave(securityForm, 'security', data)
                    )}
                    className="space-y-6"
                  >
                    <FormField
                      control={securityForm.control}
                      name="twoFactorEnabled"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="twoFactor"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <Label htmlFor="twoFactor" className="cursor-pointer">
                              فعال کردن احراز هویت دو مرحله‌ای (2FA)
                            </Label>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={securityForm.control}
                        name="sessionTimeout"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>زمان انقضای Session (دقیقه)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 60)}
                                className="text-right"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={securityForm.control}
                        name="maxLoginAttempts"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>حداکثر تلاش برای ورود</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                                className="text-right"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={securityForm.control}
                        name="lockoutDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>مدت زمان قفل (دقیقه)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 15)}
                                className="text-right"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={securityForm.control}
                        name="passwordMinLength"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>حداقل طول رمز عبور</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 8)}
                                className="text-right"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={securityForm.control}
                      name="requireStrongPassword"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="strongPassword"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <Label htmlFor="strongPassword" className="cursor-pointer">
                              الزام به رمز عبور قوی
                            </Label>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            در حال ذخیره...
                          </>
                        ) : saveSuccess ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 ml-2" />
                            ذخیره شد
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 ml-2" />
                            ذخیره تنظیمات
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Display Settings */}
          <TabsContent value="display" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>تنظیمات نمایش</CardTitle>
                <CardDescription>پیکربندی ظاهر و نمایش سیستم</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...displayForm}>
                  <form
                    onSubmit={displayForm.handleSubmit((data) =>
                      handleSave(displayForm, 'display', data)
                    )}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={displayForm.control}
                        name="theme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تم</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="light">روشن</SelectItem>
                                <SelectItem value="dark">تاریک</SelectItem>
                                <SelectItem value="auto">خودکار</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={displayForm.control}
                        name="itemsPerPage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تعداد آیتم در صفحه</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 20)}
                                className="text-right"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={displayForm.control}
                        name="dateFormat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>فرمت تاریخ</FormLabel>
                            <FormControl>
                              <Input {...field} className="text-right" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={displayForm.control}
                        name="timeFormat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>فرمت زمان</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="12">12 ساعته</SelectItem>
                                <SelectItem value="24">24 ساعته</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={displayForm.control}
                        name="rtl"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="rtl"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <Label htmlFor="rtl" className="cursor-pointer">
                                راست به چپ (RTL)
                              </Label>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={displayForm.control}
                        name="showNotifications"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="showNotifications"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <Label htmlFor="showNotifications" className="cursor-pointer">
                                نمایش اعلان‌ها
                              </Label>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={displayForm.control}
                        name="showBreadcrumbs"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="showBreadcrumbs"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <Label htmlFor="showBreadcrumbs" className="cursor-pointer">
                                نمایش مسیر (Breadcrumbs)
                              </Label>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            در حال ذخیره...
                          </>
                        ) : saveSuccess ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 ml-2" />
                            ذخیره شد
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 ml-2" />
                            ذخیره تنظیمات
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Settings */}
          <TabsContent value="api" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>تنظیمات API</CardTitle>
                <CardDescription>پیکربندی API و دسترسی‌ها</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...apiForm}>
                  <form
                    onSubmit={apiForm.handleSubmit((data) =>
                      handleSave(apiForm, 'api', data)
                    )}
                    className="space-y-6"
                  >
                    <FormField
                      control={apiForm.control}
                      name="apiEnabled"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="apiEnabled"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <Label htmlFor="apiEnabled" className="cursor-pointer">
                              فعال کردن API
                            </Label>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={apiForm.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>کلید API</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" dir="ltr" className="text-left" />
                          </FormControl>
                          <FormDescription>
                            کلید API برای دسترسی به سرویس‌های خارجی
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={apiForm.control}
                        name="rateLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>محدودیت نرخ (درخواست)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 100)}
                                className="text-right"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={apiForm.control}
                        name="rateLimitWindow"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>بازه زمانی (دقیقه)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 60)}
                                className="text-right"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            در حال ذخیره...
                          </>
                        ) : saveSuccess ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 ml-2" />
                            ذخیره شد
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 ml-2" />
                            ذخیره تنظیمات
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

