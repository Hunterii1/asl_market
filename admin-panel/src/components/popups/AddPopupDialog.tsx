import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Megaphone, FileText, Calendar, Link, CheckCircle } from 'lucide-react';
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
import { addPopupSchema, type AddPopupFormData } from '@/lib/validations/popup';
import { toast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/api/adminApi';

interface AddPopupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddPopupDialog({ open, onOpenChange, onSuccess }: AddPopupDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddPopupFormData>({
    resolver: zodResolver(addPopupSchema),
    defaultValues: {
      title: '',
      message: '',
      discount_url: '',
      button_text: '',
      is_active: true,
      start_date: '',
      end_date: '',
      priority: 1,
    },
  });

  const onSubmit = async (data: AddPopupFormData) => {
    setIsSubmitting(true);
    try {
      // Transform data for backend
      const payload: any = {
        title: data.title,
        message: data.message,
        discount_url: data.discount_url || '',
        button_text: data.button_text || '',
        is_active: data.is_active,
        priority: data.priority,
      };

      if (data.start_date) {
        payload.start_date = new Date(data.start_date).toISOString();
      }
      if (data.end_date) {
        payload.end_date = new Date(data.end_date).toISOString();
      }

      await adminApi.createPopup(payload);
      toast({
        title: 'موفقیت',
        description: 'پاپ‌آپ با موفقیت ایجاد شد.',
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
            <Megaphone className="w-5 h-5 text-primary" />
            ایجاد پاپ‌آپ جدید
          </DialogTitle>
          <DialogDescription>
            اطلاعات پاپ‌آپ جدید را وارد کنید.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    عنوان *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="مثال: تخفیف ویژه!"
                      {...field}
                      disabled={isSubmitting}
                      className="text-right"
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0} / 255 کاراکتر
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>محتوا *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="متن پاپ‌آپ..."
                      className="min-h-[150px]"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0} / 5000 کاراکتر
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Button Text */}
              <FormField
                control={form.control}
                name="button_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>متن دکمه</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="مثال: مشاهده تخفیف"
                        {...field}
                        disabled={isSubmitting}
                        className="text-right"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Discount URL */}
              <FormField
                control={form.control}
                name="discount_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Link className="w-4 h-4 text-muted-foreground" />
                      آدرس لینک
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      تاریخ شروع
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        disabled={isSubmitting}
                        className="text-right"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      تاریخ پایان
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
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
              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اولویت</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        disabled={isSubmitting}
                        className="text-right"
                        min="1"
                      />
                    </FormControl>
                    <FormDescription>
                      عدد بالاتر = اولویت بیشتر
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Is Active */}
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2 pt-8">
                      <Checkbox
                        id="is_active"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor="is_active" className="cursor-pointer flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        پاپ‌آپ فعال است
                      </Label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                    <Megaphone className="w-4 h-4 ml-2" />
                    ایجاد پاپ‌آپ
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
