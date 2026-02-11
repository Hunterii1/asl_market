import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Wallet, User, DollarSign, CreditCard, Building2, MessageSquare } from 'lucide-react';
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { addWithdrawalSchema, type AddWithdrawalFormData } from '@/lib/validations/withdrawal';
import { toast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/api/adminApi';

interface AddWithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddWithdrawalDialog({ open, onOpenChange, onSuccess }: AddWithdrawalDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string; balance?: number }[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await adminApi.getUsers({ per_page: 100 });
        const usersData = response.users || response.data?.users || [];
        const transformed = usersData.map((u: any) => ({
          id: u.id?.toString() || u.ID?.toString() || '',
          name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'بدون نام',
          balance: u.balance || 0,
        }));
        setUsers(transformed);
      } catch (error: any) {
        toast({
          title: 'خطا',
          description: error?.message || 'خطا در بارگذاری کاربران',
          variant: 'destructive',
        });
      }
    };

    if (open) {
      loadUsers();
    }
  }, [open]);

  const form = useForm<AddWithdrawalFormData>({
    resolver: zodResolver(addWithdrawalSchema),
    defaultValues: {
      userId: '',
      userName: '',
      amount: 0,
      method: 'bank_transfer',
      accountInfo: '',
      status: 'pending',
      description: '',
      requestedAt: new Date().toLocaleDateString('fa-IR'),
    },
  });

  const { watch, setValue } = form;
  const selectedUserId = watch('userId');

  useEffect(() => {
    if (selectedUserId) {
      const user = users.find(u => u.id === selectedUserId);
      if (user) {
        setValue('userName', user.name);
      }
    }
  }, [selectedUserId, users, setValue]);

  const onSubmit = async (data: AddWithdrawalFormData) => {
    setIsSubmitting(true);
    try {
      // Map form data to API payload
      const payload = {
        user_id: Number(data.userId),
        amount: data.amount,
        account_info: data.accountInfo,
        admin_notes: data.description || '',
      };

      await adminApi.createWithdrawal(payload);
      toast({
        title: 'موفقیت',
        description: 'درخواست برداشت با موفقیت ثبت شد.',
        variant: 'default',
      });
      form.reset();
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wallet className="w-5 h-5 text-primary" />
            ثبت درخواست برداشت جدید
          </DialogTitle>
          <DialogDescription>
            اطلاعات درخواست برداشت را وارد کنید.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* انتخاب کاربر */}
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    کاربر
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="کاربر را انتخاب کنید" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} - موجودی: {user.balance?.toLocaleString('fa-IR') || 0} تومان
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* نام کاربر (readonly) */}
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نام کاربر</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled
                      className="text-right bg-muted"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* مبلغ */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    مبلغ (تومان)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="مثال: ۱۰۰۰۰۰"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      disabled={isSubmitting}
                      className="text-right"
                      min="10000"
                      step="1000"
                    />
                  </FormControl>
                  <FormDescription>
                    حداقل مبلغ: ۱۰,۰۰۰ تومان
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* روش برداشت */}
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    روش برداشت
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="روش را انتخاب کنید" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bank_transfer">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          انتقال بانکی
                        </div>
                      </SelectItem>
                      <SelectItem value="card">کارت به کارت</SelectItem>
                      <SelectItem value="wallet">کیف پول</SelectItem>
                      <SelectItem value="crypto">ارز دیجیتال</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* اطلاعات حساب */}
            <FormField
              control={form.control}
              name="accountInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اطلاعات حساب</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="شماره حساب، کارت یا آدرس کیف پول"
                      {...field}
                      disabled={isSubmitting}
                      className="text-right"
                    />
                  </FormControl>
                  <FormDescription>
                    شماره حساب، کارت یا آدرس کیف پول مقصد
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
                      <SelectItem value="pending">در انتظار</SelectItem>
                      <SelectItem value="processing">در حال پردازش</SelectItem>
                      <SelectItem value="completed">تکمیل شده</SelectItem>
                      <SelectItem value="rejected">رد شده</SelectItem>
                      <SelectItem value="cancelled">لغو شده</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* توضیحات */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    توضیحات (اختیاری)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="توضیحات اضافی..."
                      className="min-h-[100px]"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0} / 500 کاراکتر
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
                    در حال ثبت...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 ml-2" />
                    ثبت درخواست
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

