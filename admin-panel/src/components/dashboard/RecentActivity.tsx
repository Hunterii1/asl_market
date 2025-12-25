import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  UserPlus, 
  Wallet, 
  MessageSquare, 
  Key,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminApi } from '@/lib/api/adminApi';

interface Activity {
  id: string;
  type: 'user' | 'withdrawal' | 'ticket' | 'license';
  title: string;
  description: string;
  time: string;
  timestamp: Date;
}

const iconMap = {
  user: UserPlus,
  withdrawal: Wallet,
  ticket: MessageSquare,
  license: Key,
};

const colorMap = {
  user: 'bg-success/10 text-success',
  withdrawal: 'bg-warning/10 text-warning',
  ticket: 'bg-info/10 text-info',
  license: 'bg-primary/10 text-primary',
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'همین الان';
  if (minutes < 60) return `${minutes} دقیقه پیش`;
  if (hours < 24) return `${hours} ساعت پیش`;
  if (days < 7) return `${days} روز پیش`;
  return date.toLocaleDateString('fa-IR');
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoading(true);
        const allActivities: Activity[] = [];

        // Get recent users
        try {
          const usersResponse = await adminApi.getUsers({ page: 1, per_page: 3 });
          const users = usersResponse.users || usersResponse.data?.users || [];
          users.forEach((user: any) => {
            allActivities.push({
              id: `user-${user.id}`,
              type: 'user',
              title: 'کاربر جدید ثبت‌نام کرد',
              description: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'کاربر جدید',
              time: formatTimeAgo(new Date(user.created_at)),
              timestamp: new Date(user.created_at),
            });
          });
        } catch (e) {
          console.error('Error loading users:', e);
        }

        // Get recent withdrawals
        try {
          const withdrawalsResponse = await adminApi.getWithdrawals({ page: 1, per_page: 3 });
          const withdrawals = withdrawalsResponse.withdrawals || withdrawalsResponse.data?.withdrawals || [];
          withdrawals.forEach((withdrawal: any) => {
            if (withdrawal.status === 'pending') {
              allActivities.push({
                id: `withdrawal-${withdrawal.id}`,
                type: 'withdrawal',
                title: 'درخواست برداشت جدید',
                description: `${withdrawal.amount?.toLocaleString('fa-IR') || '0'} تومان`,
                time: formatTimeAgo(new Date(withdrawal.created_at)),
                timestamp: new Date(withdrawal.created_at),
              });
            }
          });
        } catch (e) {
          console.error('Error loading withdrawals:', e);
        }

        // Get recent tickets
        try {
          const ticketsResponse = await adminApi.getTickets({ page: 1, per_page: 3 });
          const tickets = ticketsResponse.tickets || ticketsResponse.data?.tickets || [];
          tickets.forEach((ticket: any) => {
            if (ticket.status === 'open' || ticket.status === 'in_progress') {
              allActivities.push({
                id: `ticket-${ticket.id}`,
                type: 'ticket',
                title: 'تیکت جدید',
                description: ticket.title || 'تیکت بدون عنوان',
                time: formatTimeAgo(new Date(ticket.created_at)),
                timestamp: new Date(ticket.created_at),
              });
            }
          });
        } catch (e) {
          console.error('Error loading tickets:', e);
        }

        // Get recent licenses
        try {
          const licensesResponse = await adminApi.getLicenses({ page: 1, per_page: 3 });
          const licenses = licensesResponse.licenses || licensesResponse.data?.licenses || [];
          licenses.forEach((license: any) => {
            if (license.is_used) {
              allActivities.push({
                id: `license-${license.id}`,
                type: 'license',
                title: 'لایسنس فعال شد',
                description: `لایسنس ${license.type || 'پرمیوم'} برای کاربر #${license.user_id || license.user?.id || 'نامشخص'}`,
                time: formatTimeAgo(new Date(license.used_at || license.updated_at || license.created_at)),
                timestamp: new Date(license.used_at || license.updated_at || license.created_at),
              });
            }
          });
        } catch (e) {
          console.error('Error loading licenses:', e);
        }

        // Sort by timestamp (newest first) and take top 6
        allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setActivities(allActivities.slice(0, 6));
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
    // Refresh every 2 minutes
    const interval = setInterval(loadActivities, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">آخرین فعالیت‌ها</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>هیچ فعالیتی یافت نشد</p>
          </div>
        ) : (
          activities.map((activity, index) => {
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
          })
        )}
      </CardContent>
    </Card>
  );
}
