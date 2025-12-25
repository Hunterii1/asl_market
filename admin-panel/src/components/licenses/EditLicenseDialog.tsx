import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Key, User, Package, Calendar, Hash, MessageSquare } from 'lucide-react';
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
import { editLicenseSchema, type EditLicenseFormData } from '@/lib/validations/license';
import { toast } from '@/hooks/use-toast';

interface License {
  id: string;
  licenseKey: string;
  userId: string;
  userName: string;
  productId: string;
  productName: string;
  licenseType: 'trial' | 'monthly' | 'yearly' | 'lifetime';
  activatedAt?: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  maxActivations: number;
  currentActivations: number;
  notes?: string;
}

interface EditLicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  license: License | null;
  onSuccess?: () => void;
}

// Mock API function
const updateLicense = async (data: EditLicenseFormData): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.1) {
        reject(new Error('خطا در ارتباط با سرور. لطفا دوباره تلاش کنید.'));
      } else {
        const licenses = JSON.parse(localStorage.getItem('asll-licenses') || '[]');
        const index = licenses.findIndex((l: License) => l.id === data.id);
        if (index !== -1) {
          licenses[index] = { ...licenses[index], ...data };
          localStorage.setItem('asll-licenses', JSON.stringify(licenses));
        }
        resolve();
      }
    }, 1000);
  });
};

export function EditLicenseDialog({ open, onOpenChange, license, onSuccess }: EditLicenseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditLicenseFormData>({
    resolver: zodResolver(editLicenseSchema),
    defaultValues: {
      id: '',
      licenseKey: '',
      userId: '',
      userName: '',
      productId: '',
      productName: '',
      licenseType: 'monthly',
      activatedAt: '',
      expiresAt: '',
      status: 'active',
      maxActivations: 1,
      currentActivations: 0,
      notes: '',
    },
  });

  // Update form when license changes
  useEffect(() => {
    if (license && open) {
      form.reset({
        id: license.id,
        licenseKey: license.licenseKey,
        userId: license.userId,
        userName: license.userName,
        productId: license.productId,
        productName: license.productName,
        licenseType: license.licenseType,
        activatedAt: license.activatedAt || '',
        expiresAt: license.expiresAt || '',
        status: license.status,
        maxActivations: license.maxActivations,
        currentActivations: license.currentActivations,
        notes: license.notes || '',
      });
    }
  }, [license, open, form]);

  const onSubmit = async (data: EditLicenseFormData) => {
    setIsSubmitting(true);
    try {
      await updateLicense(data);
      toast({
        title: 'موفقیت',
        description: 'اطلاعات لایسنس با موفقیت به‌روزرسانی شد.',
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

  if (!license) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Key className="w-5 h-5 text-primary" />
            ویرایش لایسنس
          </DialogTitle>
          <DialogDescription>
            اطلاعات لایسنس را ویرایش کنید.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* کد لایسنس */}
            <FormField
              control={form.control}
              name="licenseKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    کد لایسنس
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      dir="ltr"
                      className="text-left font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* نام محصول (readonly) */}
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      محصول
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* نوع لایسنس */}
              <FormField
                control={form.control}
                name="licenseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع لایسنس</FormLabel>
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
                        <SelectItem value="trial">آزمایشی</SelectItem>
                        <SelectItem value="monthly">ماهانه</SelectItem>
                        <SelectItem value="yearly">سالانه</SelectItem>
                        <SelectItem value="lifetime">مادام‌العمر</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="active">فعال</SelectItem>
                        <SelectItem value="expired">منقضی شده</SelectItem>
                        <SelectItem value="suspended">تعلیق شده</SelectItem>
                        <SelectItem value="revoked">لغو شده</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* تاریخ فعال‌سازی */}
              <FormField
                control={form.control}
                name="activatedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      تاریخ فعال‌سازی
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

              {/* تاریخ انقضا */}
              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاریخ انقضا</FormLabel>
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

              {/* حداکثر فعال‌سازی */}
              <FormField
                control={form.control}
                name="maxActivations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>حداکثر فعال‌سازی</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        disabled={isSubmitting}
                        className="text-right"
                        min="1"
                        max="100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* یادداشت */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    یادداشت
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
                    <Key className="w-4 h-4 ml-2" />
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

