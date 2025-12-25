import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Eye, Globe, Monitor, Smartphone, Tablet, Bot, Clock, FileText } from 'lucide-react';
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
import { addVisitorSchema, type AddVisitorFormData } from '@/lib/validations/visitor';
import { toast } from '@/hooks/use-toast';

interface AddVisitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Mock API function
const createVisitor = async (data: AddVisitorFormData): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.1) {
        reject(new Error('خطا در ارتباط با سرور. لطفا دوباره تلاش کنید.'));
      } else {
        const visitors = JSON.parse(localStorage.getItem('asll-visitors') || '[]');
        const newVisitor = {
          id: Date.now().toString(),
          ...data,
          visitedAt: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR'),
          createdAt: new Date().toLocaleDateString('fa-IR'),
        };
        visitors.push(newVisitor);
        localStorage.setItem('asll-visitors', JSON.stringify(visitors));
        resolve();
      }
    }, 1500);
  });
};

export function AddVisitorDialog({ open, onOpenChange, onSuccess }: AddVisitorDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddVisitorFormData>({
    resolver: zodResolver(addVisitorSchema),
    defaultValues: {
      ip: '',
      userAgent: '',
      browser: '',
      os: '',
      device: 'desktop',
      country: '',
      city: '',
      page: '/',
      referrer: '',
      sessionId: '',
      duration: 0,
      isBot: false,
      language: 'fa',
    },
  });

  const onSubmit = async (data: AddVisitorFormData) => {
    setIsSubmitting(true);
    try {
      await createVisitor(data);
      toast({
        title: 'موفقیت',
        description: 'بازدیدکننده با موفقیت ثبت شد.',
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
            <Eye className="w-5 h-5 text-primary" />
            ثبت بازدیدکننده جدید
          </DialogTitle>
          <DialogDescription>
            اطلاعات بازدیدکننده را وارد کنید.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* IP Address */}
            <FormField
              control={form.control}
              name="ip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    آدرس IP *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="192.168.1.1"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Browser */}
              <FormField
                control={form.control}
                name="browser"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مرورگر</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Chrome, Firefox, Safari..."
                        {...field}
                        disabled={isSubmitting}
                        className="text-right"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* OS */}
              <FormField
                control={form.control}
                name="os"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سیستم عامل</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Windows, macOS, Linux..."
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

            {/* Device */}
            <FormField
              control={form.control}
              name="device"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع دستگاه</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="نوع دستگاه را انتخاب کنید" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="desktop">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4" />
                          دسکتاپ
                        </div>
                      </SelectItem>
                      <SelectItem value="mobile">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          موبایل
                        </div>
                      </SelectItem>
                      <SelectItem value="tablet">
                        <div className="flex items-center gap-2">
                          <Tablet className="w-4 h-4" />
                          تبلت
                        </div>
                      </SelectItem>
                      <SelectItem value="other">سایر</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Country */}
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

              {/* City */}
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
            </div>

            {/* Page */}
            <FormField
              control={form.control}
              name="page"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    صفحه بازدید شده *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="/products"
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

            {/* Referrer */}
            <FormField
              control={form.control}
              name="referrer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مرجع (Referrer)</FormLabel>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Duration */}
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      مدت زمان (ثانیه)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={isSubmitting}
                        className="text-right"
                        min="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Language */}
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>زبان</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="fa"
                        {...field}
                        disabled={isSubmitting}
                        className="text-right"
                        maxLength={10}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Is Bot */}
            <FormField
              control={form.control}
              name="isBot"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isBot"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="isBot" className="cursor-pointer flex items-center gap-2">
                      <Bot className="w-4 h-4 text-muted-foreground" />
                      ربات / Crawler
                    </Label>
                  </div>
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
                    <Eye className="w-4 h-4 ml-2" />
                    ثبت بازدیدکننده
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

