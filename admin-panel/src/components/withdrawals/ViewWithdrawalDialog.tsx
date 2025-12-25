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
import {
  Wallet,
  User,
  DollarSign,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WithdrawalData {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  method: 'bank_transfer' | 'card' | 'wallet' | 'crypto';
  accountInfo: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled';
  description?: string;
  requestedAt?: string;
  createdAt?: string;
  processedAt?: string | null;
  processedBy?: string | null;
}

interface ViewWithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  withdrawal: WithdrawalData | null;
}

const statusConfig = {
  pending: {
    label: 'در انتظار',
    className: 'bg-warning/10 text-warning border-warning/20',
    icon: Clock,
  },
  processing: {
    label: 'در حال پردازش',
    className: 'bg-info/10 text-info border-info/20',
    icon: AlertCircle,
  },
  completed: {
    label: 'تکمیل شده',
    className: 'bg-success/10 text-success border-success/20',
    icon: CheckCircle,
  },
  rejected: {
    label: 'رد شده',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: XCircle,
  },
  cancelled: {
    label: 'لغو شده',
    className: 'bg-muted text-muted-foreground border-border',
    icon: XCircle,
  },
};

const methodConfig = {
  bank_transfer: {
    label: 'انتقال بانکی',
    icon: Building2,
  },
  card: {
    label: 'کارت به کارت',
    icon: CreditCard,
  },
  wallet: {
    label: 'کیف پول',
    icon: Wallet,
  },
  crypto: {
    label: 'ارز دیجیتال',
    icon: CreditCard,
  },
};

export function ViewWithdrawalDialog({ open, onOpenChange, withdrawal }: ViewWithdrawalDialogProps) {
  if (!withdrawal) return null;

  const StatusIcon = statusConfig[withdrawal.status].icon;
  const MethodIcon = methodConfig[withdrawal.method].icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wallet className="w-5 h-5 text-primary" />
            جزئیات درخواست برداشت
          </DialogTitle>
          <DialogDescription className="text-right">
            اطلاعات کامل درخواست برداشت
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">درخواست #{withdrawal.id}</h3>
                  <Badge
                    variant="outline"
                    className={cn('border-2', statusConfig[withdrawal.status].className)}
                  >
                    <StatusIcon className="w-3 h-3 ml-1" />
                    {statusConfig[withdrawal.status].label}
                  </Badge>
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-primary">
                    {withdrawal.amount.toLocaleString('fa-IR')} تومان
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Information */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h4 className="font-semibold text-foreground mb-4">اطلاعات کاربر</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">کاربر</p>
                  <p className="font-medium text-foreground">{withdrawal.userName}</p>
                  <p className="text-xs text-muted-foreground mt-1">شناسه: {withdrawal.userId}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h4 className="font-semibold text-foreground mb-4">اطلاعات پرداخت</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">مبلغ</p>
                    <p className="font-medium text-foreground">
                      {withdrawal.amount.toLocaleString('fa-IR')} تومان
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                    <MethodIcon className="w-5 h-5 text-info" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">روش پرداخت</p>
                    <p className="font-medium text-foreground">
                      {methodConfig[withdrawal.method].label}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">اطلاعات حساب</p>
                    <p className="font-medium text-foreground font-mono">{withdrawal.accountInfo}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h4 className="font-semibold text-foreground mb-4">زمان‌بندی</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">تاریخ درخواست</p>
                    <p className="font-medium text-foreground">
                      {withdrawal.requestedAt || withdrawal.createdAt || 'نامشخص'}
                    </p>
                  </div>
                </div>
                {withdrawal.processedAt && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">تاریخ پردازش</p>
                        <p className="font-medium text-foreground">{withdrawal.processedAt}</p>
                        {withdrawal.processedBy && (
                          <p className="text-xs text-muted-foreground mt-1">
                            توسط: {withdrawal.processedBy}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {withdrawal.description && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-2">توضیحات</h4>
                <p className="text-sm text-muted-foreground">{withdrawal.description}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

