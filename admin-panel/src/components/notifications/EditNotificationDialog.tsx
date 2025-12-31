import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Bell, FileText, AlertCircle, Users, Calendar, Link, CheckCircle } from 'lucide-react';
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
import { editNotificationSchema, type EditNotificationFormData } from '@/lib/validations/notification';
import { toast } from '@/hooks/use-toast';
import { Notification } from '@/types/notification';
import { adminApi } from '@/lib/api/adminApi';

interface EditNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification: Notification | null;
  onSuccess?: () => void;
}

export function EditNotificationDialog({ open, onOpenChange, notification, onSuccess }: EditNotificationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditNotificationFormData>({
    resolver: zodResolver(editNotificationSchema),
    defaultValues: {
      id: 0,
      title: '',
      message: '',
      type: 'info',
      priority: 'normal',
      user_id: null,
      expires_at: '',
      action_url: '',
      action_text: '',
      is_active: true,
    },
  });

  // Update form when notification changes
  useEffect(() => {
    if (notification && open) {
      form.reset({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        user_id: notification.user_id,
        expires_at: notification.expires_at ? new Date(notification.expires_at).toISOString().slice(0, 16) : '',
        action_url: notification.action_url || '',
        action_text: notification.action_text || '',
        is_active: notification.is_active,
      });
    }
  }, [notification, open, form]);

  const onSubmit = async (data: EditNotificationFormData) => {
    setIsSubmitting(true);
    try {
      // Transform data for backend
      const payload: any = {};

      if (data.title !== undefined) payload.title = data.title;
      if (data.message !== undefined) payload.message = data.message;
      if (data.type !== undefined) payload.type = data.type;
      if (data.priority !== undefined) payload.priority = data.priority;
      if (data.is_active !== undefined) payload.is_active = data.is_active;
      if (data.action_url !== undefined) payload.action_url = data.action_url || '';
      if (data.action_text !== undefined) payload.action_text = data.action_text || '';
      
      if (data.user_id !== undefined) {
        payload.user_id = data.user_id;
      }

      if (data.expires_at) {
        payload.expires_at = new Date(data.expires_at).toISOString();
      } else if (data.expires_at === null) {
        payload.expires_at = null;
      }

      await adminApi.updateNotification(data.id, payload);
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
      }
      onOpenChange(newOpen);
    }
  };

  if (!notification) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
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
            {/* Title */}
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
                    {field.value?.length || 0} / 255 کاراکتر
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Message */}
            <FormField
              control={form.control}
              name="message"
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
              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-muted-foreground" />
                      نوع اعلان
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="انتخاب نوع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="info">اطلاعات</SelectItem>
                        <SelectItem value="warning">هشدار</SelectItem>
                        <SelectItem value="success">موفقیت</SelectItem>
                        <SelectItem value="error">خطا</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اولویت</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="انتخاب اولویت" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">پایین</SelectItem>
                        <SelectItem value="normal">عادی</SelectItem>
                        <SelectItem value="high">بالا</SelectItem>
                        <SelectItem value="urgent">فوری</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* User ID (optional - null = broadcast) */}
            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    شناسه کاربر (اختیاری)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="خالی بگذارید برای ارسال به همه کاربران"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value ? parseInt(value) : null);
                      }}
                      value={field.value || ''}
                      disabled={isSubmitting}
                      className="text-right"
                    />
                  </FormControl>
                  <FormDescription>
                    اگر خالی بگذارید، اعلان به همه کاربران ارسال می‌شود
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Action URL */}
              <FormField
                control={form.control}
                name="action_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Link className="w-4 h-4 text-muted-foreground" />
                      آدرس لینک
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com"
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

              {/* Action Text */}
              <FormField
                control={form.control}
                name="action_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>متن دکمه</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="مثال: مشاهده"
                        {...field}
                        disabled={isSubmitting}
                        className="text-right"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Expires At */}
              <FormField
                control={form.control}
                name="expires_at"
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
                        value={field.value || ''}
                        disabled={isSubmitting}
                        className="text-right"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Is Active */}
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2 pt-8">
                      <Checkbox
                        id="is_active"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor="is_active" className="cursor-pointer flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        اعلان فعال است
                      </Label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
