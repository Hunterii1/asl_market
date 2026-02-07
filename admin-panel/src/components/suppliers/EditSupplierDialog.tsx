import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { editSupplierSchema, type EditSupplierFormData } from '@/lib/validations/supplier';
import { toast } from '@/hooks/use-toast';

interface Supplier {
  id: string;
  name: string;
  companyName?: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  website?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  category?: 'electronics' | 'clothing' | 'food' | 'books' | 'furniture' | 'automotive' | 'other';
  status: 'active' | 'inactive' | 'suspended';
  rating?: number;
  notes?: string;
  totalOrders: number;
  totalAmount: number;
  tag_first_class?: boolean;
  tag_good_price?: boolean;
  tag_export_experience?: boolean;
  tag_export_packaging?: boolean;
  tag_supply_without_capital?: boolean;
}

interface EditSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onSuccess?: () => void;
}

import { adminApi } from '@/lib/api/adminApi';

export function EditSupplierDialog({ open, onOpenChange, supplier, onSuccess }: EditSupplierDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');

  const form = useForm<EditSupplierFormData>({
    resolver: zodResolver(editSupplierSchema),
    defaultValues: {
      id: '',
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
      tag_first_class: false,
      tag_good_price: false,
      tag_export_experience: false,
      tag_export_packaging: false,
      tag_supply_without_capital: false,
    },
  });

  // Update form when supplier changes
  useEffect(() => {
    if (supplier && open) {
      form.reset({
        id: supplier.id,
        name: supplier.name,
        companyName: supplier.companyName || '',
        email: supplier.email || '',
        phone: supplier.phone,
        address: supplier.address || '',
        city: supplier.city || '',
        country: supplier.country || 'ایران',
        postalCode: supplier.postalCode || '',
        taxId: supplier.taxId || '',
        website: supplier.website || '',
        contactPerson: supplier.contactPerson || '',
        contactPhone: supplier.contactPhone || '',
        contactEmail: supplier.contactEmail || '',
        category: supplier.category || 'other',
        status: supplier.status,
        rating: supplier.rating || 0,
        notes: supplier.notes || '',
        totalOrders: supplier.totalOrders || 0,
        totalAmount: supplier.totalAmount || 0,
        tag_first_class: supplier.tag_first_class ?? false,
        tag_good_price: supplier.tag_good_price ?? false,
        tag_export_experience: supplier.tag_export_experience ?? false,
        tag_export_packaging: supplier.tag_export_packaging ?? false,
        tag_supply_without_capital: supplier.tag_supply_without_capital ?? false,
      });
      setCurrentTab('basic');
    }
  }, [supplier, open, form]);

  const onSubmit = async (data: EditSupplierFormData) => {
    setIsSubmitting(true);
    try {
      // Map frontend form data to backend API format
      const apiData: any = {};
      if (data.name) apiData.full_name = data.name;
      if (data.companyName !== undefined) apiData.brand_name = data.companyName || '';
      if (data.phone) apiData.mobile = data.phone;
      if (data.address !== undefined) apiData.address = data.address || '';
      if (data.city !== undefined) apiData.city = data.city || '';
      if (data.notes !== undefined) apiData.admin_notes = data.notes || '';
      if (data.status) {
        apiData.status = data.status === 'active' ? 'approved' : data.status === 'inactive' ? 'pending' : 'rejected';
      }
      if (data.tag_first_class !== undefined) apiData.tag_first_class = data.tag_first_class;
      if (data.tag_good_price !== undefined) apiData.tag_good_price = data.tag_good_price;
      if (data.tag_export_experience !== undefined) apiData.tag_export_experience = data.tag_export_experience;
      if (data.tag_export_packaging !== undefined) apiData.tag_export_packaging = data.tag_export_packaging;
      if (data.tag_supply_without_capital !== undefined) apiData.tag_supply_without_capital = data.tag_supply_without_capital;

      await adminApi.updateSupplier(parseInt(data.id), apiData);
      toast({
        title: 'موفقیت',
        description: 'اطلاعات تامین‌کننده با موفقیت به‌روزرسانی شد.',
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

  if (!supplier) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Truck className="w-5 h-5 text-primary" />
            ویرایش تامین‌کننده
          </DialogTitle>
          <DialogDescription>
            اطلاعات تامین‌کننده را ویرایش کنید.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">اطلاعات پایه</TabsTrigger>
                <TabsTrigger value="contact">اطلاعات تماس</TabsTrigger>
                <TabsTrigger value="tags">تگ‌ها</TabsTrigger>
                <TabsTrigger value="additional">اطلاعات تکمیلی</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
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
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        نام شرکت
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>شهر</FormLabel>
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
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>کشور</FormLabel>
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
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>کد پستی</FormLabel>
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
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4 mt-4">
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

              <TabsContent value="tags" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground mb-4">تگ‌های تأمین‌کننده را برای نمایش در سایت انتخاب کنید.</p>
                <FormField
                  control={form.control}
                  name="tag_first_class"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-x-reverse">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-0.5">
                        <FormLabel>تأمین‌کننده دسته اول</FormLabel>
                        <FormDescription className="text-xs">مزرعه، باغدار، کارخانه‌دار، تولیدکننده دسته اول</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tag_good_price"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-x-reverse">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-0.5">
                        <FormLabel>تأمین‌کننده خوش قیمت</FormLabel>
                        <FormDescription className="text-xs">جنس با کیفیت و قیمت مناسب، تخفیف‌های مناسب</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tag_export_experience"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-x-reverse">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-0.5">
                        <FormLabel>تأمین‌کننده سابقه صادرات</FormLabel>
                        <FormDescription className="text-xs">پیشینه صادرات به کشورهای دیگر</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tag_export_packaging"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-x-reverse">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-0.5">
                        <FormLabel>دارایی بسته‌بندی صادراتی</FormLabel>
                        <FormDescription className="text-xs">ارائه محصول با بسته‌بندی صادراتی</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tag_supply_without_capital"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-x-reverse">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-0.5">
                        <FormLabel>تأمین بدون سرمایه</FormLabel>
                        <FormDescription className="text-xs">از طریق تأمین‌کنندگان بالا محصول را فراهم می‌کنند</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="additional" className="space-y-4 mt-4">
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

                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شناسه مالیاتی</FormLabel>
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
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4 ml-2" />
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

