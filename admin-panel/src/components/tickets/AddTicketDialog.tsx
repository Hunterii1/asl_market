import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, MessageSquare, User, Tag, AlertTriangle, FileText } from 'lucide-react';
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
import { addTicketSchema, type AddTicketFormData } from '@/lib/validations/ticket';
import { toast } from '@/hooks/use-toast';

interface AddTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Mock API function
const createTicket = async (data: AddTicketFormData): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.1) {
        reject(new Error('خطا در ارتباط با سرور. لطفا دوباره تلاش کنید.'));
      } else {
        const tickets = JSON.parse(localStorage.getItem('asll-tickets') || '[]');
        const newTicket = {
          id: Date.now().toString(),
          ...data,
          createdAt: new Date().toLocaleDateString('fa-IR'),
          updatedAt: new Date().toLocaleDateString('fa-IR'),
          replies: [],
          assignedTo: null,
        };
        tickets.push(newTicket);
        localStorage.setItem('asll-tickets', JSON.stringify(tickets));
        resolve();
      }
    }, 1500);
  });
};

// Mock users list
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

export function AddTicketDialog({ open, onOpenChange, onSuccess }: AddTicketDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    setUsers(getUsers());
  }, [open]);

  const form = useForm<AddTicketFormData>({
    resolver: zodResolver(addTicketSchema),
    defaultValues: {
      userId: '',
      userName: '',
      subject: '',
      category: 'general',
      priority: 'medium',
      message: '',
      status: 'open',
      attachments: [],
    },
  });

  const { watch, setValue } = form;
  const selectedUserId = watch('userId');
  const message = watch('message');

  useEffect(() => {
    if (selectedUserId) {
      const user = users.find(u => u.id === selectedUserId);
      if (user) {
        setValue('userName', user.name);
      }
    }
  }, [selectedUserId, users, setValue]);

  const onSubmit = async (data: AddTicketFormData) => {
    setIsSubmitting(true);
    try {
      await createTicket(data);
      toast({
        title: 'موفقیت',
        description: 'تیکت با موفقیت ایجاد شد.',
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
            <MessageSquare className="w-5 h-5 text-primary" />
            ایجاد تیکت جدید
          </DialogTitle>
          <DialogDescription>
            اطلاعات تیکت جدید را وارد کنید.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            {/* موضوع */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    موضوع
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="مثال: مشکل در ورود به سیستم"
                      {...field}
                      disabled={isSubmitting}
                      className="text-right"
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0} / 200 کاراکتر
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* دسته‌بندی */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      دسته‌بندی
                    </FormLabel>
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
                        <SelectItem value="technical">فنی</SelectItem>
                        <SelectItem value="billing">مالی</SelectItem>
                        <SelectItem value="general">عمومی</SelectItem>
                        <SelectItem value="bug">باگ</SelectItem>
                        <SelectItem value="feature">ویژگی جدید</SelectItem>
                        <SelectItem value="other">سایر</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* اولویت */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                      اولویت
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="اولویت را انتخاب کنید" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">پایین</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="high">بالا</SelectItem>
                        <SelectItem value="urgent">فوری</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* پیام */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    پیام
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="توضیحات کامل مشکل یا درخواست..."
                      className="min-h-[150px]"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    {message?.length || 0} / 5000 کاراکتر
                  </FormDescription>
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
                      <SelectItem value="open">باز</SelectItem>
                      <SelectItem value="in_progress">در حال بررسی</SelectItem>
                      <SelectItem value="resolved">حل شده</SelectItem>
                      <SelectItem value="closed">بسته شده</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <MessageSquare className="w-4 h-4 ml-2" />
                    ایجاد تیکت
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

