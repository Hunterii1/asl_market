import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, UserPlus, Mail, Phone, MessageSquare, Wallet, Shield } from 'lucide-react';
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { addUserSchema, type AddUserFormData } from '@/lib/validations/user';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { adminApi } from '@/lib/api/adminApi';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddUserDialog({ open, onOpenChange, onSuccess }: AddUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      telegramId: '',
      balance: 0,
      status: 'active',
    },
  });

  const onSubmit = async (data: AddUserFormData) => {
    setIsSubmitting(true);
    try {
      // Prepare data for API
      const apiData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        telegram_id: data.telegramId,
        balance: data.balance || 0,
        is_active: data.status === 'active',
      };

      await adminApi.createUser(apiData);
      
      toast({
        title: 'موفقیت',
        description: 'کاربر با موفقیت افزوده شد.',
        variant: 'default',
      });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error?.message || 'خطایی رخ داد. لطفا دوباره تلاش کنید.',
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="w-5 h-5 text-primary" />
            افزودن کاربر جدید
          </DialogTitle>
          <DialogDescription className="text-right">
            اطلاعات کاربر جدید را وارد کنید. تمام فیلدها الزامی هستند.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* نام */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    نام و نام خانوادگی
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="مثال: علی محمدی"
                      {...field}
                      disabled={isSubmitting}
                      className="text-right"
                    />
                  </FormControl>
                  <FormDescription>
                    نام کاربر باید به فارسی و حداقل ۲ کاراکتر باشد
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ایمیل */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    ایمیل
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      {...field}
                      disabled={isSubmitting}
                      dir="ltr"
                      className="text-left"
                    />
                  </FormControl>
                  <FormDescription>
                    آدرس ایمیل معتبر کاربر
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* شماره تلفن */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    شماره تلفن
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      {...field}
                      disabled={isSubmitting}
                      className="text-right"
                    />
                  </FormControl>
                  <FormDescription>
                    شماره تلفن همراه کاربر (۱۰ یا ۱۱ رقم)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* آیدی تلگرام */}
            <FormField
              control={form.control}
              name="telegramId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    آیدی تلگرام
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="@username یا username"
                      {...field}
                      disabled={isSubmitting}
                      dir="ltr"
                      className="text-left"
                    />
                  </FormControl>
                  <FormDescription>
                    آیدی تلگرام کاربر (با یا بدون @)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* موجودی */}
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-muted-foreground" />
                    موجودی اولیه (تومان)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="۰"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      disabled={isSubmitting}
                      className="text-right"
                      min="0"
                      step="1000"
                    />
                  </FormControl>
                  <FormDescription>
                    موجودی اولیه حساب کاربر (می‌تواند صفر باشد)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* وضعیت */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وضعیت کاربر</FormLabel>
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
                      <SelectItem value="active">فعال</SelectItem>
                      <SelectItem value="inactive">غیرفعال</SelectItem>
                      <SelectItem value="banned">مسدود</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    وضعیت حساب کاربر در سیستم
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    در حال افزودن...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 ml-2" />
                    افزودن کاربر
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

