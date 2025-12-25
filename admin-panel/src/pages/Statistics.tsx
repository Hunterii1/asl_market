import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import { UsersChart } from '@/components/statistics/UsersChart';
import { adminApi } from '@/lib/api/adminApi';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Users,
  Wallet,
  Package,
  MessageSquare,
  Key,
  Truck,
  Eye,
  GraduationCap,
  Bell,
  Megaphone,
} from 'lucide-react';

export default function Statistics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<any[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getDashboardStats();
        
        // handleResponse returns data.data, so data is already the stats object
        const statsData = data.data || data;
        
        if (statsData) {
          const statsList = [
            {
              title: 'کل کاربران',
              value: statsData.users?.total || 0,
              icon: Users,
              iconColor: 'primary' as const,
            },
            {
              title: 'کاربران فعال',
              value: statsData.users?.active || 0,
              icon: Users,
              iconColor: 'success' as const,
            },
            {
              title: 'تأمین‌کنندگان',
              value: statsData.suppliers?.total || 0,
              icon: Truck,
              iconColor: 'success' as const,
            },
            {
              title: 'تأمین‌کنندگان تأیید شده',
              value: statsData.suppliers?.approved || 0,
              icon: Truck,
              iconColor: 'info' as const,
            },
            {
              title: 'ویزیتورها',
              value: statsData.visitors?.total || 0,
              icon: Eye,
              iconColor: 'info' as const,
            },
            {
              title: 'ویزیتورهای تأیید شده',
              value: statsData.visitors?.approved || 0,
              icon: Eye,
              iconColor: 'success' as const,
            },
            {
              title: 'تیکت‌های باز',
              value: statsData.tickets?.open || 0,
              icon: MessageSquare,
              iconColor: 'warning' as const,
            },
            {
              title: 'تیکت‌های بسته',
              value: statsData.tickets?.closed || 0,
              icon: MessageSquare,
              iconColor: 'info' as const,
            },
            {
              title: 'برداشت‌های در انتظار',
              value: statsData.withdrawals?.pending || 0,
              icon: Wallet,
              iconColor: 'warning' as const,
            },
            {
              title: 'برداشت‌های تکمیل شده',
              value: statsData.withdrawals?.completed || 0,
              icon: Wallet,
              iconColor: 'success' as const,
            },
            {
              title: 'لایسنس‌های استفاده شده',
              value: statsData.licenses?.used || 0,
              icon: Key,
              iconColor: 'success' as const,
            },
            {
              title: 'لایسنس‌های موجود',
              value: statsData.licenses?.available || 0,
              icon: Key,
              iconColor: 'info' as const,
            },
            {
              title: 'ویدیوهای آموزشی',
              value: statsData.training?.total || 0,
              icon: GraduationCap,
              iconColor: 'primary' as const,
            },
            {
              title: 'اعلان‌ها',
              value: statsData.notifications?.total || 0,
              icon: Bell,
              iconColor: 'info' as const,
            },
            {
              title: 'پاپ‌آپ‌های فعال',
              value: statsData.marketing_popups?.active || 0,
              icon: Megaphone,
              iconColor: 'success' as const,
            },
            {
              title: 'محصولات تحقیقاتی',
              value: statsData.research_products?.total || 0,
              icon: Package,
              iconColor: 'primary' as const,
            },
            {
              title: 'محصولات در دسترس',
              value: statsData.available_products?.total || 0,
              icon: Package,
              iconColor: 'success' as const,
            },
          ].filter(stat => stat.value > 0 || stat.title.includes('کل') || stat.title.includes('باز') || stat.title.includes('در انتظار')); // Only show stats with data or important ones

          setStats(statsList);

          // Generate simple users chart data (last 7 days)
          const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
          const chartData = days.map((day, index) => ({
            name: day,
            newUsers: Math.floor(Math.random() * 20) + 5, // Mock data for chart
            activeUsers: Math.floor((statsData.users?.active || 0) / 7) + Math.floor(Math.random() * 10),
          }));
          setUsersData(chartData);
        }
      } catch (error: any) {
        console.error('Error loading statistics:', error);
        toast({
          title: 'خطا',
          description: error.message || 'خطا در بارگذاری آمار',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">آمار سیستم</h1>
            <p className="text-muted-foreground">مشاهده و تحلیل آمار کامل سیستم</p>
          </div>
          <div className="text-sm text-muted-foreground">
            آخرین بروزرسانی: امروز، {new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.map((stat, index) => (
                <div key={stat.title} style={{ animationDelay: `${index * 50}ms` }}>
                  <StatCard {...stat} />
                </div>
              ))}
            </div>

            {/* Users Chart - Only if we have data */}
            {usersData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                <UsersChart data={usersData} />
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

