import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Send,
  Mail,
  MessageSquare,
  Phone,
  Bell,
  Loader2,
  CheckCircle2,
  Users,
  Filter,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export interface UserForNotification {
  id: string;
  name: string;
  email: string;
  phone: string;
  telegramId: string;
  status: 'active' | 'inactive' | 'banned';
}

interface SendNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserForNotification[];
  selectedUserIds?: string[];
}

type NotificationType = 'system' | 'email' | 'sms' | 'telegram';
type NotificationScope = 'all' | 'selected' | 'filtered';

interface SendResult {
  success: number;
  failed: number;
  total: number;
}

// Mock API function for sending notifications
const sendNotifications = async (
  users: UserForNotification[],
  message: string,
  types: NotificationType[]
): Promise<SendResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate 95% success rate
      const success = Math.floor(users.length * 0.95);
      const failed = users.length - success;
      
      // Save notification history to localStorage
      const history = JSON.parse(localStorage.getItem('asll-notifications') || '[]');
      history.push({
        id: Date.now().toString(),
        message,
        types,
        userCount: users.length,
        successCount: success,
        failedCount: failed,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('asll-notifications', JSON.stringify(history));
      
      resolve({ success, failed, total: users.length });
    }, 2000);
  });
};

export function SendNotificationDialog({
  open,
  onOpenChange,
  users,
  selectedUserIds,
}: SendNotificationDialogProps) {
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>(['system']);
  const [scope, setScope] = useState<NotificationScope>(
    selectedUserIds && selectedUserIds.length > 0 ? 'selected' : 'all'
  );
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [statusFilter, setStatusFilter] = useState<('active' | 'inactive' | 'banned')[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setIsSending(false);
      setSendProgress(0);
      setSendResult(null);
      setMessage('');
      setSubject('');
      setStatusFilter([]);
      setShowPreview(false);
      if (selectedUserIds && selectedUserIds.length > 0) {
        setScope('selected');
      } else {
        setScope('all');
      }
    }
  }, [open, selectedUserIds]);

  const handleToggleType = (type: NotificationType) => {
    setNotificationTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleToggleStatus = (status: 'active' | 'inactive' | 'banned') => {
    setStatusFilter(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const getFilteredUsers = (): UserForNotification[] => {
    let filtered = [...users];

    if (scope === 'selected' && selectedUserIds) {
      filtered = filtered.filter(user => selectedUserIds.includes(user.id));
    }

    if (statusFilter.length > 0) {
      filtered = filtered.filter(user => statusFilter.includes(user.status));
    }

    return filtered;
  };

  const filteredUsers = getFilteredUsers();
  const filteredCount = filteredUsers.length;

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: 'خطا',
        description: 'لطفا متن اعلان را وارد کنید.',
        variant: 'destructive',
      });
      return;
    }

    if (notificationTypes.length === 0) {
      toast({
        title: 'خطا',
        description: 'لطفا حداقل یک نوع اعلان را انتخاب کنید.',
        variant: 'destructive',
      });
      return;
    }

    if (filteredCount === 0) {
      toast({
        title: 'خطا',
        description: 'هیچ کاربری برای ارسال اعلان انتخاب نشده است.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    setSendProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setSendProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const result = await sendNotifications(filteredUsers, message, notificationTypes);
      clearInterval(progressInterval);
      setSendProgress(100);
      setSendResult(result);
      
      toast({
        title: 'موفقیت',
        description: `اعلان به ${result.success} کاربر با موفقیت ارسال شد.`,
      });
    } catch (error) {
      clearInterval(progressInterval);
      toast({
        title: 'خطا',
        description: error instanceof Error ? error.message : 'خطا در ارسال اعلان',
        variant: 'destructive',
      });
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      setSendResult(null);
      setSendProgress(0);
      onOpenChange(false);
    }
  };

  const notificationTypeConfig = {
    system: {
      label: 'پیام درون سیستم',
      icon: Bell,
      color: 'text-primary',
      description: 'اعلان در پنل کاربر نمایش داده می‌شود',
    },
    email: {
      label: 'ایمیل',
      icon: Mail,
      color: 'text-info',
      description: 'ارسال به آدرس ایمیل کاربر',
    },
    sms: {
      label: 'پیامک (SMS)',
      icon: Phone,
      color: 'text-success',
      description: 'ارسال به شماره تلفن کاربر',
    },
    telegram: {
      label: 'تلگرام',
      icon: MessageSquare,
      color: 'text-warning',
      description: 'ارسال به آیدی تلگرام کاربر',
    },
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Send className="w-5 h-5 text-primary" />
            ارسال اعلان
          </DialogTitle>
          <DialogDescription className="text-right">
            اعلان را به کاربران انتخاب شده ارسال کنید
          </DialogDescription>
        </DialogHeader>

        {!sendResult && (
          <div className="space-y-6">
            {/* Notification Types */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <Bell className="w-4 h-4 text-muted-foreground" />
                نوع اعلان
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(notificationTypeConfig) as NotificationType[]).map(type => {
                  const config = notificationTypeConfig[type];
                  const Icon = config.icon;
                  const isSelected = notificationTypes.includes(type);
                  return (
                    <Card
                      key={type}
                      className={cn(
                        'cursor-pointer transition-all border-2',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                      onClick={() => handleToggleType(type)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleType(type)}
                            disabled={isSending}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className={cn('w-4 h-4', config.color)} />
                              <Label className="font-medium cursor-pointer">{config.label}</Label>
                            </div>
                            <p className="text-xs text-muted-foreground">{config.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Scope Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <Users className="w-4 h-4 text-muted-foreground" />
                محدوده ارسال
              </Label>
              <Select
                value={scope}
                onValueChange={(value: NotificationScope) => setScope(value)}
                disabled={isSending}
              >
                <SelectTrigger className="text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    همه کاربران ({users.length})
                  </SelectItem>
                  {selectedUserIds && selectedUserIds.length > 0 && (
                    <SelectItem value="selected">
                      کاربران انتخاب شده ({selectedUserIds.length})
                    </SelectItem>
                  )}
                  <SelectItem value="filtered">
                    کاربران فیلتر شده ({filteredCount})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filters */}
            {scope === 'filtered' && (
              <div className="space-y-4 bg-muted/50 rounded-xl p-4 border border-border">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  فیلترها
                </Label>

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">وضعیت</Label>
                  <div className="flex flex-wrap gap-3">
                    {(['active', 'inactive', 'banned'] as const).map(status => (
                      <div key={status} className="flex items-center gap-2">
                        <Checkbox
                          id={`notif-status-${status}`}
                          checked={statusFilter.includes(status)}
                          onCheckedChange={() => handleToggleStatus(status)}
                          disabled={isSending}
                        />
                        <Label
                          htmlFor={`notif-status-${status}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {status === 'active' && 'فعال'}
                          {status === 'inactive' && 'غیرفعال'}
                          {status === 'banned' && 'مسدود'}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-muted-foreground bg-background/50 rounded-lg p-2">
                  تعداد کاربران فیلتر شده: <span className="font-semibold text-foreground">{filteredCount}</span>
                </div>
              </div>
            )}

            <Separator />

            {/* Message Content */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                محتوای اعلان
              </Label>

              {/* Subject (for email) */}
              {notificationTypes.includes('email') && (
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm">موضوع ایمیل</Label>
                  <Input
                    id="subject"
                    placeholder="موضوع اعلان..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={isSending}
                    className="text-right"
                  />
                </div>
              )}

              {/* Message */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="message" className="text-sm">متن اعلان</Label>
                  <span className="text-xs text-muted-foreground">
                    {message.length} کاراکتر
                  </span>
                </div>
                <Textarea
                  id="message"
                  placeholder="متن اعلان را اینجا وارد کنید..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isSending}
                  className="min-h-[120px] text-right resize-none"
                  maxLength={1000}
                />
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    disabled={!message.trim() || isSending}
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {showPreview ? 'مخفی کردن' : 'پیش‌نمایش'}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    حداکثر ۱۰۰۰ کاراکتر
                  </span>
                </div>
              </div>

              {/* Preview */}
              {showPreview && message.trim() && (
                <Card className="bg-muted/30 border-border">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {subject && notificationTypes.includes('email') && (
                        <div>
                          <Label className="text-xs text-muted-foreground">موضوع:</Label>
                          <p className="font-medium">{subject}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-xs text-muted-foreground">متن:</Label>
                        <p className="whitespace-pre-wrap text-sm">{message}</p>
                      </div>
                      <div className="pt-2 border-t border-border">
                        <Label className="text-xs text-muted-foreground">ارسال به:</Label>
                        <p className="text-sm font-medium">
                          {filteredCount} کاربر از طریق{' '}
                          {notificationTypes.map(type => notificationTypeConfig[type].label).join('، ')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Summary */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">تعداد کاربران:</span>
                <span className="text-lg font-bold text-primary">{filteredCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">نوع اعلان:</span>
                <span className="text-sm font-medium text-foreground">
                  {notificationTypes.map(type => notificationTypeConfig[type].label).join('، ') || 'هیچکدام'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Sending Progress */}
        {isSending && !sendResult && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">در حال ارسال اعلان...</p>
              <p className="text-sm text-muted-foreground">
                اعلان در حال ارسال به {filteredCount} کاربر است
              </p>
            </div>
            <Progress value={sendProgress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">
              {sendProgress}% تکمیل شده
            </p>
          </div>
        )}

        {/* Send Result */}
        {sendResult && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">اعلان با موفقیت ارسال شد!</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center gap-2 text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{sendResult.success} کاربر موفق</span>
                </div>
                {sendResult.failed > 0 && (
                  <div className="flex items-center justify-center gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span>{sendResult.failed} کاربر ناموفق</span>
                  </div>
                )}
                <p className="text-muted-foreground mt-2">
                  از {sendResult.total} کاربر
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
          {!sendResult && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isSending}>
                انصراف
              </Button>
              <Button
                onClick={handleSend}
                disabled={isSending || !message.trim() || notificationTypes.length === 0 || filteredCount === 0}
                className="gap-2 min-w-[120px]"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    در حال ارسال...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    ارسال اعلان
                  </>
                )}
              </Button>
            </>
          )}

          {sendResult && (
            <Button onClick={handleClose} className="w-full">
              بستن
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

