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
import { editWithdrawalSchema, type EditWithdrawalFormData } from '@/lib/validations/withdrawal';
import { toast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/api/adminApi';

interface Withdrawal {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  method: 'bank_transfer' | 'card' | 'wallet' | 'crypto';
  accountInfo: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  description?: string;
  requestedAt?: string;
  processedAt?: string | null;
  processedBy?: string | null;
}

interface EditWithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  withdrawal: Withdrawal | null;
  onSuccess?: () => void;
}

export function EditWithdrawalDialog({ open, onOpenChange, withdrawal, onSuccess }: EditWithdrawalDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditWithdrawalFormData>({
    resolver: zodResolver(editWithdrawalSchema),
    defaultValues: {
      id: '',
      userId: '',
      userName: '',
      amount: 0,
      method: 'bank_transfer',
      accountInfo: '',
      status: 'pending',
      description: '',
      requestedAt: '',
      processedAt: null,
      processedBy: null,
    },
  });

  // Update form when withdrawal changes
  useEffect(() => {
    if (withdrawal && open) {
      form.reset({
        id: withdrawal.id,
        userId: withdrawal.userId,
        userName: withdrawal.userName,
        amount: withdrawal.amount,
        method: withdrawal.method,
        accountInfo: withdrawal.accountInfo,
        status: withdrawal.status,
        description: withdrawal.description || '',
        requestedAt: withdrawal.requestedAt || '',
        processedAt: withdrawal.processedAt || null,
        processedBy: withdrawal.processedBy || null,
      });
    }
  }, [withdrawal, open, form]);

  const onSubmit = async (data: EditWithdrawalFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        amount: data.amount,
        account_info: data.accountInfo,
        admin_notes: data.description || '',
      };

      await adminApi.updateWithdrawal(Number(data.id), payload);
      toast({
        title: 'موفقیت',
        description: 'اطلاعات برداشت با موفقیت به‌روزرسانی شد.',
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

  if (!withdrawal) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wallet className="w-5 h-5 text-primary" />
            ویرایش درخواست برداشت
          </DialogTitle>
          <DialogDescription>
            اطلاعات درخواست برداشت را ویرایش کنید.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* نام کاربر (readonly) */}
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    کاربر
                  </FormLabel>
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
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      disabled={isSubmitting}
                      className="text-right"
                      min="10000"
                      step="1000"
                    />
                  </FormControl>
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
                      <SelectItem value="bank_transfer">انتقال بانکی</SelectItem>
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
                      {...field}
                      disabled={isSubmitting}
                      className="text-right"
                    />
                  </FormControl>
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
                      <SelectItem value="approved">تایید شده</SelectItem>
                      <SelectItem value="processing">در حال پردازش</SelectItem>
                      <SelectItem value="completed">تکمیل شده</SelectItem>
                      <SelectItem value="rejected">رد شده</SelectItem>
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
                    توضیحات
                  </FormLabel>
                  <FormControl>
                    <Textarea
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
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 ml-2" />
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

