import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  MessageSquare,
  User,
  Tag,
  AlertTriangle,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  FileText,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { replyTicketSchema, type ReplyTicketFormData } from '@/lib/validations/ticket';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

interface TicketReply {
  id: string;
  message: string;
  author: string;
  authorType: 'user' | 'admin';
  createdAt: string;
  isInternal: boolean;
}

interface TicketData {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  category: 'technical' | 'billing' | 'general' | 'license' | 'bug' | 'feature' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  replies: TicketReply[];
  assignedTo?: string | null;
}

interface ViewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: TicketData | null;
  onReply?: () => void;
}

const statusConfig = {
  open: {
    label: 'باز',
    className: 'bg-info/10 text-info border-info/20',
    icon: Clock,
  },
  in_progress: {
    label: 'در حال بررسی',
    className: 'bg-warning/10 text-warning border-warning/20',
    icon: AlertTriangle,
  },
  resolved: {
    label: 'حل شده',
    className: 'bg-success/10 text-success border-success/20',
    icon: CheckCircle,
  },
  closed: {
    label: 'بسته شده',
    className: 'bg-muted text-muted-foreground border-border',
    icon: XCircle,
  },
};

const priorityConfig = {
  low: {
    label: 'پایین',
    className: 'bg-muted text-muted-foreground',
  },
  medium: {
    label: 'متوسط',
    className: 'bg-info/10 text-info',
  },
  high: {
    label: 'بالا',
    className: 'bg-warning/10 text-warning',
  },
  urgent: {
    label: 'فوری',
    className: 'bg-destructive/10 text-destructive',
  },
};

const categoryConfig = {
  technical: { label: 'فنی', className: 'bg-primary/10 text-primary' },
  billing: { label: 'مالی', className: 'bg-success/10 text-success' },
  general: { label: 'عمومی', className: 'bg-info/10 text-info' },
  bug: { label: 'باگ', className: 'bg-destructive/10 text-destructive' },
  feature: { label: 'ویژگی جدید', className: 'bg-warning/10 text-warning' },
  other: { label: 'سایر', className: 'bg-muted text-muted-foreground' },
};

// Mock API function
const addReply = async (data: ReplyTicketFormData): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.1) {
        reject(new Error('خطا در ارتباط با سرور. لطفا دوباره تلاش کنید.'));
      } else {
        const tickets = JSON.parse(localStorage.getItem('asll-tickets') || '[]');
        const index = tickets.findIndex((t: TicketData) => t.id === data.ticketId);
        if (index !== -1) {
          const newReply: TicketReply = {
            id: Date.now().toString(),
            message: data.message,
            author: 'مدیر سیستم',
            authorType: 'admin',
            createdAt: new Date().toLocaleDateString('fa-IR'),
            isInternal: data.isInternal || false,
          };
          tickets[index].replies = [...(tickets[index].replies || []), newReply];
          tickets[index].updatedAt = new Date().toLocaleDateString('fa-IR');
          localStorage.setItem('asll-tickets', JSON.stringify(tickets));
        }
        resolve();
      }
    }, 1000);
  });
};

export function ViewTicketDialog({ open, onOpenChange, ticket, onReply }: ViewTicketDialogProps) {
  const [isReplying, setIsReplying] = useState(false);

  const form = useForm<ReplyTicketFormData>({
    resolver: zodResolver(replyTicketSchema),
    defaultValues: {
      ticketId: '',
      message: '',
      isInternal: false,
      attachments: [],
    },
  });

  const { watch, setValue, reset } = form;
  const isInternal = watch('isInternal');

  // Update form when ticket changes
  if (ticket && form.getValues('ticketId') !== ticket.id) {
    form.reset({
      ticketId: ticket.id,
      message: '',
      isInternal: false,
      attachments: [],
    });
  }

  const handleReply = async (data: ReplyTicketFormData) => {
    setIsReplying(true);
    try {
      await addReply(data);
      toast({
        title: 'موفقیت',
        description: 'پاسخ با موفقیت ارسال شد.',
        variant: 'default',
      });
      reset();
      onReply?.();
    } catch (error) {
      toast({
        title: 'خطا',
        description: error instanceof Error ? error.message : 'خطایی رخ داد. لطفا دوباره تلاش کنید.',
        variant: 'destructive',
      });
    } finally {
      setIsReplying(false);
    }
  };

  if (!ticket) return null;

  const StatusIcon = statusConfig[ticket.status].icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MessageSquare className="w-5 h-5 text-primary" />
            تیکت #{ticket.id}
          </DialogTitle>
          <DialogDescription className="text-right">
            {ticket.subject}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">{ticket.subject}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn('border-2', statusConfig[ticket.status].className)}
                    >
                      <StatusIcon className="w-3 h-3 ml-1" />
                      {statusConfig[ticket.status].label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn('border-2', priorityConfig[ticket.priority].className)}
                    >
                      {priorityConfig[ticket.priority].label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn('border-2', categoryConfig[ticket.category].className)}
                    >
                      {categoryConfig[ticket.category].label}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Information */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">کاربر</p>
                  <p className="font-medium text-foreground">{ticket.userName}</p>
                  <p className="text-xs text-muted-foreground mt-1">شناسه: {ticket.userId}</p>
                </div>
                {ticket.assignedTo && (
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground mb-1">واگذار شده به</p>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{ticket.assignedTo}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Original Message */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <h4 className="font-semibold text-foreground">پیام اصلی</h4>
                <span className="text-xs text-muted-foreground mr-auto">
                  {ticket.createdAt}
                </span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.message}</p>
            </CardContent>
          </Card>

          {/* Replies */}
          {ticket.replies && ticket.replies.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">پاسخ‌ها ({ticket.replies.length})</h4>
              {ticket.replies.map((reply) => (
                <Card key={reply.id} className={cn(
                  reply.isInternal && 'border-warning/50 bg-warning/5'
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {reply.authorType === 'admin' ? (
                          <Shield className="w-4 h-4 text-primary" />
                        ) : (
                          <User className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="font-medium text-foreground">{reply.author}</span>
                        {reply.isInternal && (
                          <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                            داخلی
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{reply.createdAt}</span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{reply.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Reply Form */}
          {ticket.status !== 'closed' && (
            <Card>
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleReply)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="isInternal"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="isInternal"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isReplying}
                            />
                            <Label htmlFor="isInternal" className="cursor-pointer text-sm">
                              پاسخ داخلی (فقط برای مدیران قابل مشاهده)
                            </Label>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="پاسخ خود را بنویسید..."
                              className="min-h-[120px]"
                              {...field}
                              disabled={isReplying}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {form.watch('message')?.length || 0} / 5000 کاراکتر
                      </span>
                      <Button type="submit" disabled={isReplying} size="sm">
                        {isReplying ? (
                          <>
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            در حال ارسال...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 ml-2" />
                            ارسال پاسخ
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

