import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations/auth';
import { forgotPassword } from '@/lib/utils/auth';
import { toast } from '@/hooks/use-toast';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setIsSuccess(false);
    
    try {
      await forgotPassword(data.email);
      setIsSuccess(true);
      toast({
        title: 'موفقیت',
        description: 'لینک بازیابی رمز عبور به ایمیل شما ارسال شد.',
        variant: 'default',
      });
      
      // Auto close after 3 seconds
      setTimeout(() => {
        handleClose();
      }, 3000);
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

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      setIsSuccess(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Mail className="w-5 h-5 text-primary" />
            بازیابی رمز عبور
          </DialogTitle>
          <DialogDescription>
            ایمیل خود را وارد کنید تا لینک بازیابی رمز عبور برای شما ارسال شود.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-success/10 p-4">
                <CheckCircle2 className="w-12 h-12 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  ایمیل ارسال شد
                </h3>
                <p className="text-sm text-muted-foreground">
                  لینک بازیابی رمز عبور به ایمیل <span className="font-medium text-foreground">{form.getValues('email')}</span> ارسال شد.
                  <br />
                  لطفا صندوق ورودی خود را بررسی کنید.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        placeholder="example@example.com"
                        {...field}
                        disabled={isSubmitting}
                        dir="ltr"
                        className="text-left"
                      />
                    </FormControl>
                    <FormDescription>
                      ایمیل خود را وارد کنید
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
                      در حال ارسال...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 ml-2" />
                      ارسال لینک
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  انصراف
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

