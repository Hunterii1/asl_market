import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Shield, Mail, Phone, User, Lock, Key, Eye, EyeOff } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { addAdminSchema, type AddAdminFormData } from '@/lib/validations/admin';
import { toast } from '@/hooks/use-toast';

interface AddAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Mock API function
const createAdmin = async (data: AddAdminFormData): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.1) {
        reject(new Error('خطا در ارتباط با سرور. لطفا دوباره تلاش کنید.'));
      } else {
        const admins = JSON.parse(localStorage.getItem('asll-admins') || '[]');
        const newAdmin = {
          id: Date.now().toString(),
          ...data,
          createdAt: new Date().toLocaleDateString('fa-IR'),
          lastLogin: null,
          loginCount: 0,
        };
        admins.push(newAdmin);
        localStorage.setItem('asll-admins', JSON.stringify(admins));
        resolve();
      }
    }, 1500);
  });
};

const roles = [
  { value: 'super_admin', label: 'مدیر کل', description: 'دسترسی کامل به تمام بخش‌ها' },
  { value: 'admin', label: 'مدیر', description: 'دسترسی به بخش‌های اصلی' },
  { value: 'moderator', label: 'ناظر', description: 'دسترسی محدود' },
];

const availablePermissions = [
  { id: 'users.manage', label: 'مدیریت کاربران' },
  { id: 'users.view', label: 'مشاهده کاربران' },
  { id: 'products.manage', label: 'مدیریت محصولات' },
  { id: 'products.view', label: 'مشاهده محصولات' },
  { id: 'orders.manage', label: 'مدیریت سفارشات' },
  { id: 'orders.view', label: 'مشاهده سفارشات' },
  { id: 'reports.view', label: 'مشاهده گزارش‌ها' },
  { id: 'settings.manage', label: 'مدیریت تنظیمات' },
];

export function AddAdminDialog({ open, onOpenChange, onSuccess }: AddAdminDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<AddAdminFormData>({
    resolver: zodResolver(addAdminSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      role: 'admin',
      permissions: [],
      status: 'active',
    },
  });

  const { watch, setValue } = form;
  const selectedPermissions = watch('permissions') || [];

  const handleTogglePermission = (permissionId: string) => {
    const current = selectedPermissions;
    if (current.includes(permissionId)) {
      setValue('permissions', current.filter(p => p !== permissionId));
    } else {
      setValue('permissions', [...current, permissionId]);
    }
  };

  const onSubmit = async (data: AddAdminFormData) => {
    setIsSubmitting(true);
    try {
      await createAdmin(data);
      toast({
        title: 'موفقیت',
        description: 'مدیر با موفقیت افزوده شد.',
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
        setShowPassword(false);
      }
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="w-5 h-5 text-primary" />
            افزودن مدیر جدید
          </DialogTitle>
          <DialogDescription>
            اطلاعات مدیر جدید را وارد کنید. تمام فیلدها الزامی هستند.
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
                    <User className="w-4 h-4 text-muted-foreground" />
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
                    نام مدیر باید به فارسی و حداقل ۲ کاراکتر باشد
                  </FormDescription>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* نام کاربری */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      نام کاربری
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="username"
                        {...field}
                        disabled={isSubmitting}
                        dir="ltr"
                        className="text-left"
                      />
                    </FormControl>
                    <FormDescription>
                      فقط حروف انگلیسی، اعداد و _
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* رمز عبور */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      رمز عبور
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="حداقل ۸ کاراکتر"
                          {...field}
                          disabled={isSubmitting}
                          dir="ltr"
                          className="text-left pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      حداقل ۸ کاراکتر، شامل حروف بزرگ، کوچک و عدد
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* نقش */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-muted-foreground" />
                      نقش
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="نقش را انتخاب کنید" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div>
                              <div className="font-medium">{role.label}</div>
                              <div className="text-xs text-muted-foreground">{role.description}</div>
                            </div>
                          </SelectItem>
                        ))}
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
                        <SelectItem value="suspended">تعلیق شده</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* دسترسی‌ها */}
            <FormField
              control={form.control}
              name="permissions"
              render={() => (
                <FormItem>
                  <FormLabel>دسترسی‌ها</FormLabel>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {availablePermissions.map((permission) => (
                      <div key={permission.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`permission-${permission.id}`}
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={() => handleTogglePermission(permission.id)}
                          disabled={isSubmitting}
                        />
                        <Label
                          htmlFor={`permission-${permission.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {permission.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <FormDescription>
                    دسترسی‌های مورد نظر را انتخاب کنید
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
                    <Shield className="w-4 h-4 ml-2" />
                    افزودن مدیر
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

