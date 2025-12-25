import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  UserPlus, 
  Wallet, 
  MessageSquare, 
  Package,
  ShieldCheck,
  Key,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'user' | 'withdrawal' | 'ticket' | 'product' | 'admin' | 'license';
  title: string;
  description: string;
  time: string;
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'user',
    title: 'کاربر جدید ثبت‌نام کرد',
    description: 'علی محمدی به سیستم پیوست',
    time: '۲ دقیقه پیش',
  },
  {
    id: '2',
    type: 'withdrawal',
    title: 'درخواست برداشت جدید',
    description: 'درخواست ۵۰۰,۰۰۰ تومان از محمد رضایی',
    time: '۱۵ دقیقه پیش',
  },
  {
    id: '3',
    type: 'ticket',
    title: 'تیکت جدید',
    description: 'سوال درباره فعال‌سازی لایسنس',
    time: '۳۰ دقیقه پیش',
  },
  {
    id: '4',
    type: 'product',
    title: 'محصول جدید اضافه شد',
    description: 'پکیج آموزشی پیشرفته',
    time: '۱ ساعت پیش',
  },
  {
    id: '5',
    type: 'admin',
    title: 'ورود ادمین',
    description: 'مدیر فنی وارد سیستم شد',
    time: '۲ ساعت پیش',
  },
  {
    id: '6',
    type: 'license',
    title: 'لایسنس فعال شد',
    description: 'لایسنس پرمیوم برای کاربر #۱۲۳۴',
    time: '۳ ساعت پیش',
  },
];

const iconMap = {
  user: UserPlus,
  withdrawal: Wallet,
  ticket: MessageSquare,
  product: Package,
  admin: ShieldCheck,
  license: Key,
};

const colorMap = {
  user: 'bg-success/10 text-success',
  withdrawal: 'bg-warning/10 text-warning',
  ticket: 'bg-info/10 text-info',
  product: 'bg-primary/10 text-primary',
  admin: 'bg-muted text-muted-foreground',
  license: 'bg-primary/10 text-primary',
};

export function RecentActivity() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">آخرین فعالیت‌ها</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.type];
          return (
            <div
              key={activity.id}
              className="flex items-start gap-4 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  colorMap[activity.type]
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
