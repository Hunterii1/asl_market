import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import { TimeRangeFilter, type TimeRange } from '@/components/statistics/TimeRangeFilter';
import { RevenueChart } from '@/components/statistics/RevenueChart';
import { UsersChart } from '@/components/statistics/UsersChart';
import { ProductsChart } from '@/components/statistics/ProductsChart';
import { StatisticsTable } from '@/components/statistics/StatisticsTable';
import {
  Users,
  Wallet,
  ShoppingCart,
  Package,
  TrendingUp,
  MessageSquare,
  DollarSign,
  Activity,
} from 'lucide-react';

// Mock data generators based on time range
const generateRevenueData = (range: TimeRange) => {
  const periods = range === 'today' ? 24 : range === 'week' ? 7 : range === 'month' ? 30 : 12;
  const labels = range === 'today' 
    ? Array.from({ length: 24 }, (_, i) => `${i}:00`)
    : range === 'week'
    ? ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']
    : range === 'month'
    ? Array.from({ length: 30 }, (_, i) => `${i + 1}`)
    : ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

  return labels.map((label, index) => ({
    name: label,
    revenue: Math.floor(Math.random() * 50000000) + 10000000,
    orders: Math.floor(Math.random() * 200) + 50,
  }));
};

const generateUsersData = (range: TimeRange) => {
  const periods = range === 'today' ? 24 : range === 'week' ? 7 : range === 'month' ? 30 : 12;
  const labels = range === 'today' 
    ? Array.from({ length: 24 }, (_, i) => `${i}:00`)
    : range === 'week'
    ? ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']
    : range === 'month'
    ? Array.from({ length: 30 }, (_, i) => `${i + 1}`)
    : ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

  return labels.map((label) => ({
    name: label,
    newUsers: Math.floor(Math.random() * 100) + 20,
    activeUsers: Math.floor(Math.random() * 500) + 200,
  }));
};

const productsData = [
  { name: 'آموزشی', value: 35 },
  { name: 'نرم‌افزار', value: 25 },
  { name: 'خدمات', value: 20 },
  { name: 'اشتراک', value: 15 },
  { name: 'سایر', value: 5 },
];

export default function Statistics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  const revenueData = useMemo(() => generateRevenueData(timeRange), [timeRange]);
  const usersData = useMemo(() => generateUsersData(timeRange), [timeRange]);

  // Calculate stats based on data
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = revenueData.reduce((sum, item) => sum + item.orders, 0);
  const totalNewUsers = usersData.reduce((sum, item) => sum + item.newUsers, 0);
  const avgActiveUsers = Math.round(usersData.reduce((sum, item) => sum + item.activeUsers, 0) / usersData.length);

  const stats = [
    {
      title: 'کل درآمد',
      value: totalRevenue.toLocaleString('fa-IR'),
      change: 12.5,
      icon: Wallet,
      iconColor: 'success' as const,
    },
    {
      title: 'کل سفارشات',
      value: totalOrders.toLocaleString('fa-IR'),
      change: 8.2,
      icon: ShoppingCart,
      iconColor: 'primary' as const,
    },
    {
      title: 'کاربران جدید',
      value: totalNewUsers.toLocaleString('fa-IR'),
      change: 15.3,
      icon: Users,
      iconColor: 'info' as const,
    },
    {
      title: 'میانگین کاربران فعال',
      value: avgActiveUsers.toLocaleString('fa-IR'),
      change: 5.7,
      icon: Activity,
      iconColor: 'warning' as const,
    },
    {
      title: 'میانگین سفارش',
      value: Math.round(totalRevenue / totalOrders).toLocaleString('fa-IR') + ' تومان',
      change: -2.4,
      icon: DollarSign,
      iconColor: 'primary' as const,
    },
    {
      title: 'محصولات فعال',
      value: '۱۵۶',
      change: 5,
      icon: Package,
      iconColor: 'success' as const,
    },
  ];

  const tableData = [
    { category: 'فروش آنلاین', value: '۱۲۳,۴۵۶,۰۰۰ تومان', change: 12.5, trend: 'up' as const },
    { category: 'فروش آفلاین', value: '۸۹,۱۲۳,۰۰۰ تومان', change: 8.2, trend: 'up' as const },
    { category: 'بازگشت وجه', value: '۵,۶۷۸,۰۰۰ تومان', change: -3.1, trend: 'down' as const },
    { category: 'تخفیفات', value: '۱۵,۹۸۷,۰۰۰ تومان', change: 5.4, trend: 'up' as const },
    { category: 'مالیات', value: '۱۲,۳۴۵,۰۰۰ تومان', change: 2.1, trend: 'up' as const },
  ];

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

        {/* Time Range Filter */}
        <Card>
          <CardContent className="p-4">
            <TimeRangeFilter
              value={timeRange}
              onChange={setTimeRange}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onCustomDateChange={(start, end) => {
                setCustomStartDate(start);
                setCustomEndDate(end);
                if (start && end) {
                  setTimeRange('custom');
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <div key={stat.title} style={{ animationDelay: `${index * 50}ms` }}>
              <StatCard {...stat} />
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart data={revenueData} />
          <UsersChart data={usersData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProductsChart data={productsData} />
          <StatisticsTable data={tableData} title="جزئیات مالی" />
        </div>

        {/* Additional Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">نرخ تبدیل</p>
                  <p className="text-2xl font-bold text-foreground">۳.۲%</p>
                  <p className="text-xs text-success mt-1">+۰.۸% از ماه گذشته</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">تیکت‌های باز</p>
                  <p className="text-2xl font-bold text-foreground">۱۸</p>
                  <p className="text-xs text-warning mt-1">+۱۵% از ماه گذشته</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">میانگین سبد خرید</p>
                  <p className="text-2xl font-bold text-foreground">۵۲۷,۰۰۰</p>
                  <p className="text-xs text-success mt-1">+۲.۴% از ماه گذشته</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">بازدیدکنندگان</p>
                  <p className="text-2xl font-bold text-foreground">۱۲,۸۴۷</p>
                  <p className="text-xs text-info mt-1">+۱۲.۵% از ماه گذشته</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-info/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

