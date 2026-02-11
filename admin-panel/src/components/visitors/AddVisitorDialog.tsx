import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, User, Phone, Mail, MapPin, FileText, Shield } from 'lucide-react';
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
import { addAdminVisitorSchema, type AddAdminVisitorFormData } from '@/lib/validations/admin-visitor';
import { toast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/api/adminApi';

interface AddVisitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddVisitorDialog({ open, onOpenChange, onSuccess }: AddVisitorDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await adminApi.getUsers({ page: 1, per_page: 100 });
        const usersData = response.users || response.data?.users || [];
        setUsers(usersData);
      } catch (error: any) {
        toast({
          title: 'خطا',
          description: error?.message || 'خطا در بارگذاری فهرست کاربران',
          variant: 'destructive',
        });
      }
    };

    if (open) {
      loadUsers();
    }
  }, [open]);

  const form = useForm<AddAdminVisitorFormData>({
    resolver: zodResolver(addAdminVisitorSchema),
    defaultValues: {
      userId: '',
      full_name: '',
      national_id: '',
      passport_number: '',
      birth_date: '',
      mobile: '',
      whatsapp_number: '',
      email: '',
      residence_address: '',
      city_province: '',
      destination_cities: '',
      has_local_contact: false,
      local_contact_details: '',
      bank_account_iban: '',
      bank_name: '',
      account_holder_name: '',
      has_marketing_experience: false,
      marketing_experience_desc: '',
      language_level: 'good',
      special_skills: '',
      interested_products: '',
      agrees_to_use_approved_products: true,
      agrees_to_violation_consequences: true,
      agrees_to_submit_reports: true,
      digital_signature: '',
      signature_date: '',
    },
  });

  const onSubmit = async (data: AddAdminVisitorFormData) => {
    setIsSubmitting(true);
    try {
      await adminApi.createVisitor({
        user_id: Number(data.userId),
        full_name: data.full_name,
        national_id: data.national_id,
        passport_number: data.passport_number || '',
        birth_date: data.birth_date,
        mobile: data.mobile,
        whatsapp_number: data.whatsapp_number || '',
        email: data.email || '',
        residence_address: data.residence_address,
        city_province: data.city_province,
        destination_cities: data.destination_cities,
        has_local_contact: data.has_local_contact || false,
        local_contact_details: data.local_contact_details || '',
        bank_account_iban: data.bank_account_iban,
        bank_name: data.bank_name,
        account_holder_name: data.account_holder_name || '',
        has_marketing_experience: data.has_marketing_experience || false,
        marketing_experience_desc: data.marketing_experience_desc || '',
        language_level: data.language_level,
        special_skills: data.special_skills || '',
        interested_products: data.interested_products || '',
        agrees_to_use_approved_products: data.agrees_to_use_approved_products,
        agrees_to_violation_consequences: data.agrees_to_violation_consequences,
        agrees_to_submit_reports: data.agrees_to_submit_reports,
        digital_signature: data.digital_signature,
        signature_date: data.signature_date,
      });
      toast({
        title: 'موفقیت',
        description: 'ویزیتور با موفقیت ایجاد شد.',
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
            <User className="w-5 h-5 text-primary" />
            ثبت ویزیتور جدید
          </DialogTitle>
          <DialogDescription>
            اطلاعات ویزیتور جدید را وارد کنید.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* User */}
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    کاربر مرتبط *
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="کاربر را انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.first_name && user.last_name
                              ? `${user.first_name} ${user.last_name}`
                              : user.name || `کاربر #${user.id}`}
                            {user.email ? ` - ${user.email}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Full name & National ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="full_name"
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

              <FormField
                control={form.control}
                name="national_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      کد ملی *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="کد ملی"
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

            {/* موبایل و ایمیل */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mobile"
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

            {/* شهر/استان و شهرهای مقصد */}
            <FormField
              control={form.control}
              name="city_province"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    شهر و کشور محل سکونت *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="مثال: دبی - امارات متحده عربی"
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
              name="destination_cities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>شهرهای مقصد *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="مثال: دبی، ابوظبی، ریاض"
                      {...field}
                      disabled={isSubmitting}
                      className="text-right min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* آدرس محل سکونت */}
            <FormField
              control={form.control}
              name="residence_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>آدرس محل سکونت *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="آدرس کامل محل سکونت..."
                      {...field}
                      disabled={isSubmitting}
                      className="text-right min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* اطلاعات بانکی */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bank_account_iban"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شماره شبا / حساب *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="IRxxxxxxxxxxxxxxxxxxxx"
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
                name="bank_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام بانک *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="نام بانک"
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

            {/* سطح زبان */}
            <FormField
              control={form.control}
              name="language_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>سطح زبان *</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="سطح زبان را انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">عالی</SelectItem>
                        <SelectItem value="good">خوب</SelectItem>
                        <SelectItem value="weak">ضعیف</SelectItem>
                        <SelectItem value="none">ندارد</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* امضای دیجیتال و تاریخ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="digital_signature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>امضای دیجیتال *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="نام و نام خانوادگی به‌عنوان امضا"
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
                name="signature_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاریخ امضا *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="مثال: 1403/01/01"
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

            {/* محصولات مورد علاقه و مهارت‌ها */}
            <FormField
              control={form.control}
              name="interested_products"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>محصولات مورد علاقه</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="لیست محصولات یا دسته‌بندی‌های مورد علاقه..."
                      {...field}
                      disabled={isSubmitting}
                      className="text-right min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="special_skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مهارت‌های ویژه</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="توضیح مهارت‌ها و تجربیات مرتبط..."
                      {...field}
                      disabled={isSubmitting}
                      className="text-right min-h-[80px]"
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
                    در حال ثبت...
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 ml-2" />
                    ثبت ویزیتور
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

