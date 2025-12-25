import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Truck, Building2, Mail, Phone, MapPin, Globe, User, Star, FileText } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { addSupplierSchema, type AddSupplierFormData } from '@/lib/validations/supplier';
import { toast } from '@/hooks/use-toast';

interface AddSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Mock API function
const createSupplier = async (data: AddSupplierFormData): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.1) {
        reject(new Error('خطا در ارتباط با سرور. لطفا دوباره تلاش کنید.'));
      } else {
        const suppliers = JSON.parse(localStorage.getItem('asll-suppliers') || '[]');
        const newSupplier = {
          id: Date.now().toString(),
          ...data,
          createdAt: new Date().toLocaleDateString('fa-IR'),
          updatedAt: new Date().toLocaleDateString('fa-IR'),
        };
        suppliers.push(newSupplier);
        localStorage.setItem('asll-suppliers', JSON.stringify(suppliers));
        resolve();
      }
    }, 1500);
  });
};

export function AddSupplierDialog({ open, onOpenChange, onSuccess }: AddSupplierDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');

  const form = useForm<AddSupplierFormData>({
    resolver: zodResolver(addSupplierSchema),
    defaultValues: {
      name: '',
      companyName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'ایران',
      postalCode: '',
      taxId: '',
      website: '',
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
      category: 'other',
      status: 'active',
      rating: 0,
      notes: '',
      totalOrders: 0,
      totalAmount: 0,
    },
  });

  const onSubmit = async (data: AddSupplierFormData) => {
    setIsSubmitting(true);
    try {
      await createSupplier(data);
      toast({
        title: 'موفقیت',
        description: 'تامین‌کننده با موفقیت ایجاد شد.',
        variant: 'default',
      });
      form.reset();
      setCurrentTab('basic');
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Truck className="w-5 h-5 text-primary" />
            افزودن تامین‌کننده جدید
          </DialogTitle>
          <DialogDescription>
            اطلاعات تامین‌کننده جدید را وارد کنید.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">اطلاعات پایه</TabsTrigger>
                <TabsTrigger value="contact">اطلاعات تماس</TabsTrigger>
                <TabsTrigger value="additional">اطلاعات تکمیلی</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                {/* نام */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        نام تامین‌کننده *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: شرکت فناوری اطلاعات"
                          {...field}
                          disabled={isSubmitting}
                          className="text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* نام شرکت */}
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        نام شرکت
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="نام شرکت (در صورت وجود)"
                          {...field}
                          disabled={isSubmitting}
                          className="text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            placeholder="example@domain.com"
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

                  {/* تلفن */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          شماره تلفن *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="09123456789"
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

                {/* آدرس */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        آدرس
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="آدرس کامل..."
                          className="min-h-[80px]"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* شهر */}
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>شهر</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="تهران"
                            {...field}
                            disabled={isSubmitting}
                            className="text-right"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* کشور */}
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>کشور</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ایران"
                            {...field}
                            disabled={isSubmitting}
                            className="text-right"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* کد پستی */}
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>کد پستی</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="1234567890"
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
              </TabsContent>

              <TabsContent value="contact" className="space-y-4 mt-4">
                {/* شخص تماس */}
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        نام شخص تماس
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="نام و نام خانوادگی"
                          {...field}
                          disabled={isSubmitting}
                          className="text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* تلفن تماس */}
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          شماره تلفن تماس
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="09123456789"
                            {...field}
                            disabled={isSubmitting}
                            className="text-right"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* ایمیل تماس */}
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          ایمیل تماس
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="example@domain.com"
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

                {/* وب‌سایت */}
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        وب‌سایت
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
              </TabsContent>

              <TabsContent value="additional" className="space-y-4 mt-4">
                {/* دسته‌بندی */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>دسته‌بندی</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className="text-right">
                            <SelectValue placeholder="دسته‌بندی را انتخاب کنید" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="electronics">الکترونیک</SelectItem>
                          <SelectItem value="clothing">پوشاک</SelectItem>
                          <SelectItem value="food">غذا</SelectItem>
                          <SelectItem value="books">کتاب</SelectItem>
                          <SelectItem value="furniture">مبلمان</SelectItem>
                          <SelectItem value="automotive">خودرو</SelectItem>
                          <SelectItem value="other">سایر</SelectItem>
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
                          <SelectItem value="inactive">غیرفعال</SelectItem>
                          <SelectItem value="suspended">معلق</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* شناسه مالیاتی */}
                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شناسه مالیاتی</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="شناسه مالیاتی"
                          {...field}
                          disabled={isSubmitting}
                          className="text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* امتیاز */}
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-muted-foreground" />
                        امتیاز (۰ تا ۵)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          disabled={isSubmitting}
                          className="text-right"
                          min="0"
                          max="5"
                          step="0.1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* یادداشت */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        یادداشت
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="یادداشت‌های اضافی..."
                          className="min-h-[100px]"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0} / 2000 کاراکتر
                      </FormDescription>
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
                    در حال ایجاد...
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4 ml-2" />
                    ایجاد تامین‌کننده
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

