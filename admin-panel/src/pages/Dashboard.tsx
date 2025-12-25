import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { AddUserDialog } from '@/components/users/AddUserDialog';
import { ImportUsersDialog } from '@/components/users/ImportUsersDialog';
import { ExportUsersDialog } from '@/components/users/ExportUsersDialog';
import { SendNotificationDialog } from '@/components/users/SendNotificationDialog';
import { AddProductDialog } from '@/components/products/AddProductDialog';
import { ReportsDialog } from '@/components/reports/ReportsDialog';
import { type UserExportData } from '@/lib/utils/exportUtils';
import { type UserForNotification } from '@/components/users/SendNotificationDialog';
import { adminApi } from '@/lib/api/adminApi';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  Wallet, 
  ShoppingCart, 
  MessageSquare,
  TrendingUp,
  Package,
  Loader2,
} from 'lucide-react';

export default function Dashboard() {
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isImportUsersDialogOpen, setIsImportUsersDialogOpen] = useState(false);
  const [isExportUsersDialogOpen, setIsExportUsersDialogOpen] = useState(false);
  const [isSendNotificationDialogOpen, setIsSendNotificationDialogOpen] = useState(false);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isReportsDialogOpen, setIsReportsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    {
      title: 'کل کاربران',
      value: 0,
      change: 0,
      icon: Users,
      iconColor: 'primary' as const,
    },
    {
      title: 'تأمین‌کنندگان',
      value: 0,
      change: 0,
      icon: Package,
      iconColor: 'success' as const,
    },
    {
      title: 'ویزیتورها',
      value: 0,
      change: 0,
      icon: Users,
      iconColor: 'info' as const,
    },
    {
      title: 'تیکت‌های باز',
      value: 0,
      change: 0,
      icon: MessageSquare,
      iconColor: 'warning' as const,
    },
    {
      title: 'برداشت‌های در انتظار',
      value: 0,
      change: 0,
      icon: Wallet,
      iconColor: 'warning' as const,
    },
    {
      title: 'لایسنس‌های استفاده شده',
      value: 0,
      change: 0,
      icon: TrendingUp,
      iconColor: 'success' as const,
    },
  ]);

  // Load users for export and notifications
  const [usersForExport, setUsersForExport] = useState<UserExportData[]>([]);
  const [usersForNotification, setUsersForNotification] = useState<UserForNotification[]>([]);

  // Load dashboard stats from API
  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getDashboardStats();
        
        // handleResponse returns data.data, so data is already the stats object
        const statsData = data.data || data;
        
        if (statsData) {
          setStats([
            {
              title: 'کل کاربران',
              value: statsData.users?.total || 0,
              change: 0,
              icon: Users,
              iconColor: 'primary' as const,
            },
            {
              title: 'تأمین‌کنندگان',
              value: statsData.suppliers?.total || 0,
              change: 0,
              icon: Package,
              iconColor: 'success' as const,
            },
            {
              title: 'ویزیتورها',
              value: statsData.visitors?.total || 0,
              change: 0,
              icon: Users,
              iconColor: 'info' as const,
            },
            {
              title: 'تیکت‌های باز',
              value: statsData.tickets?.open || 0,
              change: 0,
              icon: MessageSquare,
              iconColor: 'warning' as const,
            },
            {
              title: 'برداشت‌های در انتظار',
              value: statsData.withdrawals?.pending || 0,
              change: 0,
              icon: Wallet,
              iconColor: 'warning' as const,
            },
            {
              title: 'لایسنس‌های استفاده شده',
              value: statsData.licenses?.used || 0,
              change: 0,
              icon: TrendingUp,
              iconColor: 'success' as const,
            },
          ]);
        }
      } catch (error: any) {
        console.error('Error loading dashboard stats:', error);
        toast({
          title: 'خطا',
          description: error.message || 'خطا در بارگذاری آمار داشبورد',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardStats();
  }, []);

  const handleAddUserClick = () => {
    setIsAddUserDialogOpen(true);
  };

  const handleImportUsersClick = () => {
    setIsImportUsersDialogOpen(true);
  };

  const handleExportUsersClick = () => {
    // Reload users before export
    const stored = localStorage.getItem('asll-users');
    if (stored) {
      try {
        setUsersForExport(JSON.parse(stored));
      } catch {
        setUsersForExport([]);
      }
    }
    setIsExportUsersDialogOpen(true);
  };

  const handleSendNotificationClick = () => {
    // Reload users before sending notification
    const stored = localStorage.getItem('asll-users');
    if (stored) {
      try {
        setUsersForNotification(JSON.parse(stored));
      } catch {
        setUsersForNotification([]);
      }
    }
    setIsSendNotificationDialogOpen(true);
  };

  const handleAddProductClick = () => {
    setIsAddProductDialogOpen(true);
  };

  const handleGenerateReportClick = () => {
    setIsReportsDialogOpen(true);
  };

  const handleUserAdded = () => {
    // Reload users
    const stored = localStorage.getItem('asll-users');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUsersForExport(parsed);
        setUsersForNotification(parsed);
      } catch {}
    }
  };

  const handleUsersImported = (count: number) => {
    // Reload users
    const stored = localStorage.getItem('asll-users');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUsersForExport(parsed);
        setUsersForNotification(parsed);
      } catch {}
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">داشبورد</h1>
            <p className="text-muted-foreground">خوش آمدید! نگاهی به وضعیت کلی سیستم بیندازید.</p>
          </div>
          <div className="text-sm text-muted-foreground">
            آخرین بروزرسانی: امروز، ۱۴:۳۰
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <div key={stat.title} style={{ animationDelay: `${index * 50}ms` }}>
                <StatCard {...stat} />
              </div>
            ))}
          </div>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <RecentActivity />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <QuickActions 
            onAddUser={handleAddUserClick}
            onImportUsers={handleImportUsersClick}
            onExportUsers={handleExportUsersClick}
            onSendNotification={handleSendNotificationClick}
            onAddProduct={handleAddProductClick}
            onGenerateReport={handleGenerateReportClick}
          />
        </div>
      </div>

      {/* Dialog افزودن کاربر */}
      <AddUserDialog
        open={isAddUserDialogOpen}
        onOpenChange={setIsAddUserDialogOpen}
        onSuccess={handleUserAdded}
      />

      {/* Dialog واردسازی گروهی */}
      <ImportUsersDialog
        open={isImportUsersDialogOpen}
        onOpenChange={setIsImportUsersDialogOpen}
        onSuccess={handleUsersImported}
      />

      {/* Dialog خروجی اکسل */}
      <ExportUsersDialog
        open={isExportUsersDialogOpen}
        onOpenChange={setIsExportUsersDialogOpen}
        users={usersForExport}
      />

      {/* Dialog ارسال اعلان */}
      <SendNotificationDialog
        open={isSendNotificationDialogOpen}
        onOpenChange={setIsSendNotificationDialogOpen}
        users={usersForNotification}
      />

      {/* Dialog افزودن محصول */}
      <AddProductDialog
        open={isAddProductDialogOpen}
        onOpenChange={setIsAddProductDialogOpen}
        onSuccess={() => {
          // می‌توانید در اینجا آمار را به‌روزرسانی کنید
        }}
      />

      {/* Dialog گزارش‌گیری */}
      <ReportsDialog
        open={isReportsDialogOpen}
        onOpenChange={setIsReportsDialogOpen}
      />
    </AdminLayout>
  );
}
