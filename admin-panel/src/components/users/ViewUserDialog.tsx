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
  User,
  Mail,
  Phone,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  telegramId: string;
  balance: number;
  status: 'active' | 'inactive' | 'banned';
  createdAt: string;
}

interface ViewUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData | null;
}

const statusConfig = {
  active: {
    label: 'فعال',
    className: 'bg-success/10 text-success border-success/20',
  },
  inactive: {
    label: 'غیرفعال',
    className: 'bg-muted text-muted-foreground border-border',
  },
  banned: {
    label: 'مسدود',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
};

export function ViewUserDialog({ open, onOpenChange, user }: ViewUserDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="w-5 h-5 text-primary" />
            جزئیات کاربر
          </DialogTitle>
          <DialogDescription className="text-right">
            اطلاعات کامل کاربر
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-2xl">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-foreground">{user.name}</h3>
                    <Badge
                      variant="outline"
                      className={cn('border-2', statusConfig[user.status].className)}
                    >
                      {statusConfig[user.status].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">شناسه: {user.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h4 className="font-semibold text-foreground mb-4">اطلاعات تماس</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">ایمیل</p>
                    <p className="font-medium text-foreground">{user.email}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-info" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">شماره تلفن</p>
                    <p className="font-medium text-foreground">{user.phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">وضعیت حساب</p>
                    <Badge
                      variant="outline"
                      className={cn('mt-1 border-2', statusConfig[user.status].className)}
                    >
                      {statusConfig[user.status].label}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

