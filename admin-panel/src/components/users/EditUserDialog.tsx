import { useState, useEffect } from 'react';
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
import { editUserSchema, type EditUserFormData } from '@/lib/validations/user';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  telegramId: string;
  balance: number;
  status: 'active' | 'inactive' | 'banned';
}

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess?: () => void;
}

// Mock API function
const updateUser = async (data: EditUserFormData): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.1) {
        reject(new Error('خطا در ارتباط با سرور. لطفا دوباره تلاش کنید.'));
      } else {
        // Update in localStorage
        const users = JSON.parse(localStorage.getItem('asll-users') || '[]');
        const index = users.findIndex((u: User) => u.id === data.id);
        if (index !== -1) {
          users[index] = { ...users[index], ...data };
          localStorage.setItem('asll-users', JSON.stringify(users));
        }
        resolve();
      }
    }, 1000);
  });
};

export function EditUserDialog({ open, onOpenChange, user, onSuccess }: EditUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      id: '',
      name: '',
      email: '',
      phone: '',
      telegramId: '',
      balance: 0,
      status: 'active',
    },
  });

  // Update form when user changes
  useEffect(() => {
    if (user && open) {
      form.reset({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        telegramId: user.telegramId,
        balance: user.balance,
        status: user.status,
      });
    }
  }, [user, open, form]);

  const onSubmit = async (data: EditUserFormData) => {
    setIsSubmitting(true);
    try {
      await updateUser(data);
      toast({
        title: 'موفقیت',
        description: 'اطلاعات کاربر با موفقیت به‌روزرسانی شد.',
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

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="w-5 h-5 text-primary" />
            ویرایش کاربر
          </DialogTitle>
          <DialogDescription>
            اطلاعات کاربر را ویرایش کنید. تمام فیلدها الزامی هستند.
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
                    موجودی (تومان)
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
                    موجودی حساب کاربر
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
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 ml-2" />
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

