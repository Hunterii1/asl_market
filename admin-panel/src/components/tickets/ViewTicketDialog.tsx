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
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { replyTicketSchema, type ReplyTicketFormData } from '@/lib/validations/ticket';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/api/adminApi';

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
  category: 'general' | 'technical' | 'billing' | 'license' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
  status: 'open' | 'in_progress' | 'waiting_response' | 'closed';
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
  waiting_response: {
    label: 'در انتظار پاسخ',
    className: 'bg-info/10 text-info border-info/20',
    icon: Clock,
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
  general: { label: 'عمومی', className: 'bg-info/10 text-info' },
  technical: { label: 'فنی', className: 'bg-primary/10 text-primary' },
  billing: { label: 'مالی', className: 'bg-success/10 text-success' },
  license: { label: 'لایسنس', className: 'bg-warning/10 text-warning' },
  other: { label: 'سایر', className: 'bg-muted text-muted-foreground' },
};


export function ViewTicketDialog({ open, onOpenChange, ticket, onReply }: ViewTicketDialogProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

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
      await adminApi.addAdminMessageToTicket(parseInt(data.ticketId), { message: data.message });
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

  const handleCloseTicket = async () => {
    if (!ticket) return;
    
    if (!confirm('آیا از بستن این تیکت اطمینان دارید؟')) {
      return;
    }

    setIsClosing(true);
    try {
      await adminApi.updateTicketStatus(parseInt(ticket.id), { status: 'closed' });
      toast({
        title: 'موفقیت',
        description: 'تیکت با موفقیت بسته شد.',
        variant: 'default',
      });
      onReply?.();
    } catch (error) {
      toast({
        title: 'خطا',
        description: error instanceof Error ? error.message : 'خطایی رخ داد. لطفا دوباره تلاش کنید.',
        variant: 'destructive',
      });
    } finally {
      setIsClosing(false);
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
                {ticket.status !== 'closed' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCloseTicket}
                    disabled={isClosing}
                    className="shrink-0"
                  >
                    {isClosing ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        در حال بستن...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 ml-2" />
                        بستن تیکت
                      </>
                    )}
                  </Button>
                )}
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
              </div>
            </CardContent>
          </Card>

          {/* Original Message */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-foreground">پیام کاربر</h4>
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                      {ticket.userName}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {ticket.createdAt}
                  </span>
                </div>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{ticket.message}</p>
              </div>
            </CardContent>
          </Card>

          {/* Replies */}
          {ticket.replies && ticket.replies.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                <h4 className="font-semibold text-foreground">پاسخ‌ها ({ticket.replies.length})</h4>
              </div>
              {ticket.replies.map((reply) => (
                <Card 
                  key={reply.id} 
                  className={cn(
                    reply.authorType === 'admin' 
                      ? 'border-primary/20 bg-primary/5' 
                      : 'border-border',
                    reply.isInternal && 'border-warning/50 bg-warning/5'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                        reply.authorType === 'admin' 
                          ? 'bg-primary/10' 
                          : 'bg-muted'
                      )}>
                        {reply.authorType === 'admin' ? (
                          <Shield className={cn('w-4 h-4', reply.authorType === 'admin' ? 'text-primary' : 'text-muted-foreground')} />
                        ) : (
                          <User className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">{reply.author}</span>
                          {reply.authorType === 'admin' && (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                              ادمین
                            </Badge>
                          )}
                          {reply.isInternal && (
                            <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                              داخلی
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{reply.createdAt}</span>
                      </div>
                    </div>
                    <div className={cn(
                      'rounded-lg p-3',
                      reply.authorType === 'admin' 
                        ? 'bg-background border border-border' 
                        : 'bg-muted/50'
                    )}>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{reply.message}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Reply Form */}
          {ticket.status !== 'closed' ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground">پاسخ ادمین</h4>
                </div>
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
                            <Label htmlFor="isInternal" className="cursor-pointer text-sm text-muted-foreground">
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
                              placeholder="پاسخ خود را وارد کنید..."
                              className="min-h-[120px] resize-none text-right bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                              disabled={isReplying}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                      <span className="text-xs text-muted-foreground">
                        {form.watch('message')?.length || 0} / 5000 کاراکتر
                      </span>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button 
                          type="submit" 
                          disabled={isReplying || !form.watch('message')?.trim()} 
                          size="sm"
                          className="flex-1 sm:flex-initial"
                        >
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
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCloseTicket}
                          disabled={isClosing || isReplying}
                          className="flex-1 sm:flex-initial border-destructive/50 text-destructive hover:bg-destructive/10"
                        >
                          {isClosing ? (
                            <>
                              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                              در حال بستن...
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 ml-2" />
                              بستن تیکت
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-muted bg-muted/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Lock className="w-5 h-5" />
                  <p className="text-sm">این تیکت بسته شده است و امکان ارسال پاسخ وجود ندارد.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

