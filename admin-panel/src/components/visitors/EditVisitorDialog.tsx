import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Edit, MapPin } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { adminApi } from '@/lib/api/adminApi';
import { toast } from '@/hooks/use-toast';

interface Visitor {
  id: string;
  full_name?: string;
  mobile?: string;
  email?: string;
  city_province?: string;
  destination_cities?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

interface EditVisitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitor: Visitor | null;
  onSuccess?: () => void;
}

interface EditVisitorFormData {
  full_name: string;
  mobile: string;
  email: string;
  city_province: string;
  destination_cities: string;
  admin_notes: string;
  status: 'pending' | 'approved' | 'rejected';
}

export function EditVisitorDialog({ open, onOpenChange, visitor, onSuccess }: EditVisitorDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditVisitorFormData>({
    defaultValues: {
      full_name: '',
      mobile: '',
      email: '',
      city_province: '',
      destination_cities: '',
      admin_notes: '',
      status: 'pending',
    },
  });

  // Update form when visitor changes
  useEffect(() => {
    if (visitor && open) {
      form.reset({
        full_name: visitor.full_name || '',
        mobile: visitor.mobile || '',
        email: visitor.email || '',
        city_province: visitor.city_province || '',
        destination_cities: visitor.destination_cities || '',
        admin_notes: '',
        status: visitor.status || 'pending',
      });
    }
  }, [visitor, open, form]);

  const onSubmit = async (data: EditVisitorFormData) => {
    if (!visitor) return;

    setIsSubmitting(true);
    try {
      await adminApi.updateVisitor(Number(visitor.id), {
        full_name: data.full_name,
        mobile: data.mobile,
        email: data.email,
        city_province: data.city_province,
        destination_cities: data.destination_cities,
        admin_notes: data.admin_notes,
        status: data.status,
      });

      toast({
        title: 'موفقیت',
        description: 'اطلاعات ویزیتور با موفقیت به‌روزرسانی شد.',
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در به‌روزرسانی اطلاعات ویزیتور',
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

  if (!visitor) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Edit className="w-5 h-5 text-primary" />
            ویرایش ویزیتور
          </DialogTitle>
          <DialogDescription>
            اطلاعات ویزیتور را ویرایش کنید.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Full Name */}
            <FormField
              control={form.control}
              name="full_name"
              rules={{ required: 'نام و نام خانوادگی الزامی است' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نام و نام خانوادگی *</FormLabel>
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
              {/* Mobile */}
              <FormField
                control={form.control}
                name="mobile"
                rules={{ required: 'شماره موبایل الزامی است' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شماره موبایل *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="09123456789"
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

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ایمیل</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* City Province */}
            <FormField
              control={form.control}
              name="city_province"
              rules={{ required: 'شهر و استان الزامی است' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    شهر و استان *</FormLabel>
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

            {/* Destination Cities */}
            <FormField
              control={form.control}
              name="destination_cities"
              rules={{ required: 'شهرهای مقصد الزامی است' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>شهرهای مقصد *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="دبی، ابوظبی، ریاض"
                      {...field}
                      disabled={isSubmitting}
                      className="text-right min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وضعیت</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="وضعیت را انتخاب کنید" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">در انتظار</SelectItem>
                      <SelectItem value="approved">تأیید شده</SelectItem>
                      <SelectItem value="rejected">رد شده</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Admin Notes */}
            <FormField
              control={form.control}
              name="admin_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>یادداشت ادمین</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="یادداشت‌های ادمین..."
                      {...field}
                      disabled={isSubmitting}
                      className="text-right min-h-[100px]"
                    />
                  </FormControl>
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
                    <Edit className="w-4 h-4 ml-2" />
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

