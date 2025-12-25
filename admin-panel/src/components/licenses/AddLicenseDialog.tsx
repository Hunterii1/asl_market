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
import { addLicenseSchema, type AddLicenseFormData } from '@/lib/validations/license';
import { toast } from '@/hooks/use-toast';

interface AddLicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Mock API function
const createLicense = async (data: AddLicenseFormData): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.1) {
        reject(new Error('خطا در ارتباط با سرور. لطفا دوباره تلاش کنید.'));
      } else {
        const licenses = JSON.parse(localStorage.getItem('asll-licenses') || '[]');
        const newLicense = {
          id: Date.now().toString(),
          ...data,
          createdAt: new Date().toLocaleDateString('fa-IR'),
        };
        licenses.push(newLicense);
        localStorage.setItem('asll-licenses', JSON.stringify(licenses));
        resolve();
      }
    }, 1500);
  });
};

// Generate random license key
const generateLicenseKey = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  return segments.join('-');
};

// Mock users and products
const getUsers = () => {
  const stored = localStorage.getItem('asll-users');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
};

const getProducts = () => {
  const stored = localStorage.getItem('asll-products');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
};

export function AddLicenseDialog({ open, onOpenChange, onSuccess }: AddLicenseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    setUsers(getUsers());
    setProducts(getProducts());
  }, [open]);

  const form = useForm<AddLicenseFormData>({
    resolver: zodResolver(addLicenseSchema),
    defaultValues: {
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

  const { watch, setValue } = form;
  const selectedUserId = watch('userId');
  const selectedProductId = watch('productId');
  const licenseType = watch('licenseType');

  useEffect(() => {
    if (selectedUserId) {
      const user = users.find(u => u.id === selectedUserId);
      if (user) {
        setValue('userName', user.name);
      }
    }
  }, [selectedUserId, users, setValue]);

  useEffect(() => {
    if (selectedProductId) {
      const product = products.find(p => p.id === selectedProductId);
      if (product) {
        setValue('productName', product.name);
      }
    }
  }, [selectedProductId, products, setValue]);

  // Calculate expiration date based on license type
  useEffect(() => {
    if (licenseType && !form.getValues('expiresAt')) {
      const today = new Date();
      let expiresDate = new Date();
      
      if (licenseType === 'trial') {
        expiresDate.setDate(today.getDate() + 7); // 7 days trial
      } else if (licenseType === 'monthly') {
        expiresDate.setMonth(today.getMonth() + 1);
      } else if (licenseType === 'yearly') {
        expiresDate.setFullYear(today.getFullYear() + 1);
      } else if (licenseType === 'lifetime') {
        expiresDate.setFullYear(today.getFullYear() + 100); // 100 years = lifetime
      }
      
      setValue('expiresAt', expiresDate.toLocaleDateString('fa-IR'));
      setValue('activatedAt', today.toLocaleDateString('fa-IR'));
    }
  }, [licenseType, setValue, form]);

  const handleGenerateKey = () => {
    setValue('licenseKey', generateLicenseKey());
  };

  const onSubmit = async (data: AddLicenseFormData) => {
    setIsSubmitting(true);
    try {
      await createLicense(data);
      toast({
        title: 'موفقیت',
        description: 'لایسنس با موفقیت ایجاد شد.',
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Key className="w-5 h-5 text-primary" />
            ایجاد لایسنس جدید
          </DialogTitle>
          <DialogDescription>
            اطلاعات لایسنس جدید را وارد کنید.
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
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        {...field}
                        disabled={isSubmitting}
                        dir="ltr"
                        className="text-left font-mono"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateKey}
                      disabled={isSubmitting}
                    >
                      تولید خودکار
                    </Button>
                  </div>
                  <FormDescription>
                    کد لایسنس منحصر به فرد (فقط حروف بزرگ، اعداد و خط تیره)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            {user.name}
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* انتخاب محصول */}
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      محصول
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="محصول را انتخاب کنید" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <FormLabel>نام محصول</FormLabel>
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
                        <SelectItem value="trial">آزمایشی (۷ روز)</SelectItem>
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
                        placeholder="۱۴۰۳/۰۹/۲۰"
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
                        placeholder="۱۴۰۳/۱۰/۲۰"
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
                    یادداشت (اختیاری)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="یادداشت اضافی..."
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
                    در حال ایجاد...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 ml-2" />
                    ایجاد لایسنس
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

