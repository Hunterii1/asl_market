import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Bell, FileText, AlertCircle, Users, Calendar, Link, Image, Volume2, Vibrate, VolumeX } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { editNotificationSchema, type EditNotificationFormData } from '@/lib/validations/notification';
import { toast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'email' | 'sms' | 'telegram' | 'push';
  status: 'sent' | 'pending' | 'failed' | 'draft';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recipientType: 'all' | 'specific' | 'group';
  recipientIds?: string[];
  scheduledAt?: string;
  actionUrl?: string;
  actionText?: string;
  icon?: string;
  imageUrl?: string;
  sound: boolean;
  vibrate: boolean;
  silent: boolean;
  expiresAt?: string;
  metadata?: Record<string, any>;
  sentAt?: string | null;
  readCount?: number;
  clickCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface EditNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification: Notification | null;
  onSuccess?: () => void;
}

// Mock API function
const updateNotification = async (data: EditNotificationFormData): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.1) {
        reject(new Error('خطا در ارتباط با سرور. لطفا دوباره تلاش کنید.'));
      } else {
        const notifications = JSON.parse(localStorage.getItem('asll-notifications') || '[]');
        const index = notifications.findIndex((n: Notification) => n.id === data.id);
        if (index !== -1) {
          notifications[index] = { ...notifications[index], ...data };
          notifications[index].updatedAt = new Date().toLocaleDateString('fa-IR');
          if (data.status === 'sent' && notifications[index].sentAt === null) {
            notifications[index].sentAt = new Date().toLocaleDateString('fa-IR');
          }
          localStorage.setItem('asll-notifications', JSON.stringify(notifications));
        }
        resolve();
      }
    }, 1000);
  });
};

export function EditNotificationDialog({ open, onOpenChange, notification, onSuccess }: EditNotificationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');

  const form = useForm<EditNotificationFormData>({
    resolver: zodResolver(editNotificationSchema),
    defaultValues: {
      id: '',
      title: '',
      content: '',
      type: 'system',
      status: 'draft',
      priority: 'medium',
      recipientType: 'all',
      recipientIds: [],
      scheduledAt: '',
      actionUrl: '',
      actionText: '',
      icon: '',
      imageUrl: '',
      sound: false,
      vibrate: false,
      silent: false,
      expiresAt: '',
      metadata: {},
    },
  });

  // Update form when notification changes
  useEffect(() => {
    if (notification && open) {
      form.reset({
        id: notification.id,
        title: notification.title,
        content: notification.content,
        type: notification.type,
        status: notification.status,
        priority: notification.priority,
        recipientType: notification.recipientType,
        recipientIds: notification.recipientIds || [],
        scheduledAt: notification.scheduledAt || '',
        actionUrl: notification.actionUrl || '',
        actionText: notification.actionText || '',
        icon: notification.icon || '',
        imageUrl: notification.imageUrl || '',
        sound: notification.sound,
        vibrate: notification.vibrate,
        silent: notification.silent,
        expiresAt: notification.expiresAt || '',
        metadata: notification.metadata || {},
      });
      setCurrentTab('basic');
    }
  }, [notification, open, form]);

  const { watch } = form;
  const recipientType = watch('recipientType');

  const onSubmit = async (data: EditNotificationFormData) => {
    setIsSubmitting(true);
    try {
      await updateNotification(data);
      toast({
        title: 'موفقیت',
        description: 'اطلاعات اعلان با موفقیت به‌روزرسانی شد.',
        variant: 'default',
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'خطا',
        description: error instanceof Error ? error.message : 'خطایی رخ داد. لطفا دوباره تلاش کنید.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      if (!newOpen) {
        form.reset();
        setCurrentTab('basic');
      }
      onOpenChange(newOpen);
    }
  };

  if (!notification) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bell className="w-5 h-5 text-primary" />
            ویرایش اعلان
          </DialogTitle>
          <DialogDescription>
            اطلاعات اعلان را ویرایش کنید.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">اطلاعات پایه</TabsTrigger>
                <TabsTrigger value="recipients">گیرنده‌ها</TabsTrigger>
                <TabsTrigger value="settings">تنظیمات</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        عنوان *
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isSubmitting}
                          className="text-right"
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0} / 200 کاراکتر
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>محتوا *</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-[150px]"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0} / 5000 کاراکتر
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-muted-foreground" />
                          نوع اعلان *
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger className="text-right">
                              <SelectValue placeholder="نوع را انتخاب کنید" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="system">سیستمی</SelectItem>
                            <SelectItem value="email">ایمیل</SelectItem>
                            <SelectItem value="sms">پیامک</SelectItem>
                            <SelectItem value="telegram">تلگرام</SelectItem>
                            <SelectItem value="push">Push Notification</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>وضعیت</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger className="text-right">
                              <SelectValue placeholder="وضعیت را انتخاب کنید" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">پیش‌نویس</SelectItem>
                            <SelectItem value="pending">در انتظار</SelectItem>
                            <SelectItem value="sent">ارسال شده</SelectItem>
                            <SelectItem value="failed">ناموفق</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-muted-foreground" />
                          اولویت
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger className="text-right">
                              <SelectValue placeholder="اولویت را انتخاب کنید" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">پایین</SelectItem>
                            <SelectItem value="medium">متوسط</SelectItem>
                            <SelectItem value="high">بالا</SelectItem>
                            <SelectItem value="urgent">فوری</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Image className="w-4 h-4 text-muted-foreground" />
                        آدرس تصویر
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isSubmitting}
                          dir="ltr"
                          className="text-left"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="actionText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Link className="w-4 h-4 text-muted-foreground" />
                          متن دکمه
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isSubmitting}
                            className="text-right"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="actionUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>آدرس دکمه</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isSubmitting}
                            dir="ltr"
                            className="text-left"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="recipients" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="recipientType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        نوع گیرنده
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className="text-right">
                            <SelectValue placeholder="نوع گیرنده را انتخاب کنید" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">همه کاربران</SelectItem>
                          <SelectItem value="specific">کاربران خاص</SelectItem>
                          <SelectItem value="group">گروه خاص</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {recipientType === 'specific' && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      انتخاب کاربران خاص در نسخه بعدی اضافه خواهد شد
                    </p>
                  </div>
                )}

                {recipientType === 'group' && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      انتخاب گروه در نسخه بعدی اضافه خواهد شد
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="scheduledAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        زمان‌بندی ارسال
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          disabled={isSubmitting}
                          className="text-right"
                        />
                      </FormControl>
                      <FormDescription>
                        در صورت خالی بودن، بلافاصله ارسال می‌شود
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        تاریخ انقضا
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          disabled={isSubmitting}
                          className="text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sound"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="sound"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor="sound" className="cursor-pointer flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-muted-foreground" />
                          پخش صدا
                        </Label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vibrate"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="vibrate"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor="vibrate" className="cursor-pointer flex items-center gap-2">
                          <Vibrate className="w-4 h-4 text-muted-foreground" />
                          لرزش
                        </Label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="silent"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="silent"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor="silent" className="cursor-pointer flex items-center gap-2">
                          <VolumeX className="w-4 h-4 text-muted-foreground" />
                          بی‌صدا
                        </Label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 ml-2" />
                    ذخیره تغییرات
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                انصراف
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

