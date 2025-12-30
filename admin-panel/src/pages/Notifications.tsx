import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/lib/api/adminApi';
import { Loader2 } from 'lucide-react';
import { 
  Search, 
  Bell, 
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  Bell as BellIcon,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye as EyeIcon,
  MousePointerClick,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { AddNotificationDialog } from '@/components/notifications/AddNotificationDialog';
import { EditNotificationDialog } from '@/components/notifications/EditNotificationDialog';
import { ViewNotificationDialog } from '@/components/notifications/ViewNotificationDialog';
import { DeleteNotificationDialog } from '@/components/notifications/DeleteNotificationDialog';
import { NotificationsFilters } from '@/components/notifications/NotificationsFilters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'email' | 'sms' | 'telegram' | 'push';
  status: 'sent' | 'pending' | 'failed' | 'draft';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recipientType: 'all' | 'specific' | 'group';
  recipientIds?: string[];
  scheduledAt?: string;
  actionUrl?: string;
  actionText?: string;
  icon?: string;
  imageUrl?: string;
  sound: boolean;
  vibrate: boolean;
  silent: boolean;
  expiresAt?: string;
  metadata?: Record<string, any>;
  sentAt?: string | null;
  readCount?: number;
  clickCount?: number;
  createdAt: string;
  updatedAt: string;
}

// داده‌های اولیه
const initialNotifications: Notification[] = [
  {
    id: '1',
    title: 'خوش آمدید به سیستم',
    content: 'به پنل مدیریت خوش آمدید. از امکانات جدید استفاده کنید.',
    type: 'system',
    status: 'sent',
    priority: 'medium',
    recipientType: 'all',
    sound: true,
    vibrate: false,
    silent: false,
    sentAt: '۱۴۰۳/۰۹/۱۵',
    readCount: 1250,
    clickCount: 234,
    createdAt: '۱۴۰۳/۰۹/۱۵',
    updatedAt: '۱۴۰۳/۰۹/۱۵',
  },
  {
    id: '2',
    title: 'تخفیف ویژه',
    content: 'از تخفیف ویژه ۵۰٪ استفاده کنید!',
    type: 'email',
    status: 'pending',
    priority: 'high',
    recipientType: 'all',
    actionText: 'مشاهده محصولات',
    actionUrl: 'https://example.com/products',
    sound: false,
    vibrate: true,
    silent: false,
    scheduledAt: '2024-01-01T10:00:00',
    readCount: 0,
    clickCount: 0,
    createdAt: '۱۴۰۳/۰۹/۱۴',
    updatedAt: '۱۴۰۳/۰۹/۱۴',
  },
  {
    id: '3',
    title: 'پیامک تایید',
    content: 'کد تایید شما: 123456',
    type: 'sms',
    status: 'sent',
    priority: 'urgent',
    recipientType: 'specific',
    recipientIds: ['1', '2'],
    sound: true,
    vibrate: true,
    silent: false,
    sentAt: '۱۴۰۳/۰۹/۱۳',
    readCount: 2,
    clickCount: 0,
    createdAt: '۱۴۰۳/۰۹/۱۳',
    updatedAt: '۱۴۰۳/۰۹/۱۳',
  },
  {
    id: '4',
    title: 'اعلان تلگرام',
    content: 'پیام جدید در کانال تلگرام',
    type: 'telegram',
    status: 'failed',
    priority: 'medium',
    recipientType: 'all',
    sound: false,
    vibrate: false,
    silent: false,
    readCount: 0,
    clickCount: 0,
    createdAt: '۱۴۰۳/۰۹/۱۲',
    updatedAt: '۱۴۰۳/۰۹/۱۲',
  },
  {
    id: '5',
    title: 'اعلان Push',
    content: 'شما یک پیام جدید دارید',
    type: 'push',
    status: 'draft',
    priority: 'low',
    recipientType: 'all',
    sound: true,
    vibrate: true,
    silent: false,
    readCount: 0,
    clickCount: 0,
    createdAt: '۱۴۰۳/۰۹/۱۱',
    updatedAt: '۱۴۰۳/۰۹/۱۱',
  },
];

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  sent: {
    label: 'ارسال شده',
    className: 'bg-success/10 text-success',
    icon: CheckCircle,
  },
  pending: {
    label: 'در انتظار',
    className: 'bg-warning/10 text-warning',
    icon: Clock,
  },
  failed: {
    label: 'ناموفق',
    className: 'bg-destructive/10 text-destructive',
    icon: XCircle,
  },
  draft: {
    label: 'پیش‌نویس',
    className: 'bg-muted text-muted-foreground',
    icon: FileText,
  },
  active: {
    label: 'فعال',
    className: 'bg-success/10 text-success',
    icon: CheckCircle,
  },
  inactive: {
    label: 'غیرفعال',
    className: 'bg-muted text-muted-foreground',
    icon: XCircle,
  },
};

const typeConfig: Record<string, { label: string; className: string }> = {
  system: { label: 'سیستمی', className: 'bg-primary/10 text-primary' },
  email: { label: 'ایمیل', className: 'bg-info/10 text-info' },
  sms: { label: 'پیامک', className: 'bg-success/10 text-success' },
  telegram: { label: 'تلگرام', className: 'bg-blue-500/10 text-blue-500' },
  push: { label: 'Push', className: 'bg-warning/10 text-warning' },
  matching: { label: 'Matching', className: 'bg-purple-500/10 text-purple-500' },
  info: { label: 'اطلاعات', className: 'bg-info/10 text-info' },
  warning: { label: 'هشدار', className: 'bg-warning/10 text-warning' },
  success: { label: 'موفقیت', className: 'bg-success/10 text-success' },
  error: { label: 'خطا', className: 'bg-destructive/10 text-destructive' },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: 'پایین', className: 'bg-muted text-muted-foreground' },
  normal: { label: 'عادی', className: 'bg-info/10 text-info' },
  medium: { label: 'متوسط', className: 'bg-info/10 text-info' },
  high: { label: 'بالا', className: 'bg-warning/10 text-warning' },
  urgent: { label: 'فوری', className: 'bg-destructive/10 text-destructive' },
};

type SortField = 'title' | 'type' | 'status' | 'priority' | 'readCount' | 'clickCount' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function Notifications() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewNotification, setViewNotification] = useState<Notification | null>(null);
  const [editNotification, setEditNotification] = useState<Notification | null>(null);
  const [deleteNotification, setDeleteNotification] = useState<Notification | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<('sent' | 'pending' | 'failed' | 'draft')[]>([]);
  const [typeFilter, setTypeFilter] = useState<('system' | 'email' | 'sms' | 'telegram' | 'push')[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<('low' | 'medium' | 'high' | 'urgent')[]>([]);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Load notifications from API
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        const statusFilterValue = statusFilter.length === 1 ? statusFilter[0] : undefined;
        const typeFilterValue = typeFilter.length === 1 ? typeFilter[0] : undefined;

        const response = await adminApi.getNotifications({
          page: currentPage,
          per_page: itemsPerPage,
          status: statusFilterValue,
          type: typeFilterValue,
        });

        if (response) {
          // Backend returns: { data: { notifications: [], total: 0, ... } }
          const notificationsData = response.data?.notifications || response.notifications || [];
          const transformedNotifications: Notification[] = notificationsData.map((n: any) => ({
            id: n.id?.toString() || n.ID?.toString() || '',
            title: n.title || 'بدون عنوان',
            content: n.message || n.content || '',
            type: n.type || 'system',
            status: n.is_active ? (n.is_read ? 'sent' : 'pending') : 'inactive',
            priority: n.priority || 'normal',
            recipientType: n.user_id ? 'specific' : 'all',
            recipientIds: n.user_id ? [n.user_id.toString()] : [],
            scheduledAt: n.scheduled_at || undefined,
            actionUrl: n.action_url || n.actionURL || undefined,
            actionText: n.action_text || n.actionText || undefined,
            icon: n.icon || undefined,
            imageUrl: n.image_url || n.imageUrl || undefined,
            sound: n.sound || false,
            vibrate: n.vibrate || false,
            silent: n.silent || false,
            expiresAt: n.expires_at || n.expiresAt || undefined,
            metadata: n.metadata || {},
            sentAt: n.sent_at || n.sentAt || null,
            readCount: n.read_count || n.readCount || 0,
            clickCount: n.click_count || n.clickCount || 0,
            createdAt: n.created_at || new Date().toISOString(),
            updatedAt: n.updated_at || n.created_at || new Date().toISOString(),
          }));

          setNotifications(transformedNotifications);
          setTotalNotifications(response.data?.total || response.total || 0);
          setTotalPages(response.data?.total_pages || response.total_pages || 1);
        }
      } catch (error: any) {
        console.error('Error loading notifications:', error);
        toast({
          title: 'خطا',
          description: error.message || 'خطا در بارگذاری اعلان‌ها',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [currentPage, itemsPerPage, statusFilter, typeFilter]);

  // Use notifications directly from API (already filtered and paginated)
  const paginatedNotifications = notifications;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleNotificationAdded = () => {
    const stored = localStorage.getItem('asll-notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
      } catch {}
    }
  };

  const toggleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleDeleteNotification = async () => {
    if (!deleteNotification) return;
    
    setIsDeleting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setNotifications(prev => prev.filter(n => n.id !== deleteNotification.id));
      setSelectedNotifications(prev => prev.filter(id => id !== deleteNotification.id));
      setDeleteNotification(null);
      
      toast({
        title: 'موفقیت',
        description: 'اعلان با موفقیت حذف شد.',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف اعلان',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkAction = async (action: 'send' | 'delete') => {
    if (selectedNotifications.length === 0) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (action === 'send') {
        setNotifications(prev => prev.map(notification => {
          if (selectedNotifications.includes(notification.id) && notification.status === 'draft') {
            return { 
              ...notification, 
              status: 'sent' as const,
              sentAt: new Date().toLocaleDateString('fa-IR'),
            };
          }
          return notification;
        }));
      } else if (action === 'delete') {
        setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)));
      }

      setSelectedNotifications([]);
      
      toast({
        title: 'موفقیت',
        description: `عملیات با موفقیت انجام شد.`,
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در انجام عملیات',
        variant: 'destructive',
      });
    }
  };

  const handleResetFilters = () => {
    setStatusFilter([]);
    setTypeFilter([]);
    setPriorityFilter([]);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary" />
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">مدیریت اعلان‌ها</h1>
            <p className="text-sm md:text-base text-muted-foreground">لیست تمامی اعلان‌های سیستم</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={() => setIsAddDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 md:ml-2" />
              <span className="hidden sm:inline">اعلان جدید</span>
              <span className="sm:hidden">جدید</span>
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="جستجو..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pr-10 pl-4 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  />
                </div>
                <NotificationsFilters
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  typeFilter={typeFilter}
                  onTypeFilterChange={setTypeFilter}
                  priorityFilter={priorityFilter}
                  onPriorityFilterChange={setPriorityFilter}
                  onReset={handleResetFilters}
                />
              </div>
              {(statusFilter.length > 0 || typeFilter.length > 0 || priorityFilter.length > 0) && (
                <div className="flex items-center justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4 ml-1" />
                    پاک کردن فیلترها
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedNotifications.length > 0 && (
          <Card className="border-primary/50 bg-primary/5 animate-scale-in">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <span className="text-sm text-foreground font-medium">
                  {selectedNotifications.length} اعلان انتخاب شده
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkAction('send')}
                    className="text-success hover:bg-success/10 flex-1 md:flex-initial"
                  >
                    <CheckCircle className="w-4 h-4 md:ml-2" />
                    <span className="hidden sm:inline">ارسال</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (confirm(`آیا از حذف ${selectedNotifications.length} اعلان اطمینان دارید؟`)) {
                        handleBulkAction('delete');
                      }
                    }}
                    className="text-destructive hover:bg-destructive/10 flex-1 md:flex-initial"
                  >
                    <Trash2 className="w-4 h-4 md:ml-2" />
                    <span className="hidden sm:inline">حذف</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications Table */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">لیست اعلان‌ها ({totalNotifications})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : paginatedNotifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <BellIcon className="w-12 h-12 text-muted-foreground" />
                  <p className="text-muted-foreground">هیچ اعلانی یافت نشد</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground w-12">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.length === paginatedNotifications.length && paginatedNotifications.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedNotifications(paginatedNotifications.map(n => n.id));
                            } else {
                              setSelectedNotifications([]);
                            }
                          }}
                          className="w-4 h-4 rounded border-border"
                        />
                      </th>
                      <th className="p-4 text-right">
                        <button
                          onClick={() => handleSort('title')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          عنوان
                          {getSortIcon('title')}
                        </button>
                      </th>
                      <th className="p-4 text-right">
                        <button
                          onClick={() => handleSort('type')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          نوع
                          {getSortIcon('type')}
                        </button>
                      </th>
                      <th className="p-4 text-right">
                        <button
                          onClick={() => handleSort('status')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          وضعیت
                          {getSortIcon('status')}
                        </button>
                      </th>
                      <th className="p-4 text-right">
                        <button
                          onClick={() => handleSort('priority')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          اولویت
                          {getSortIcon('priority')}
                        </button>
                      </th>
                      <th className="p-4 text-right">
                        <button
                          onClick={() => handleSort('readCount')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          خوانده شده
                          {getSortIcon('readCount')}
                        </button>
                      </th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedNotifications.map((notification, index) => {
                      const statusInfo = statusConfig[notification.status] || statusConfig.pending;
                      const typeInfo = typeConfig[notification.type] || typeConfig.system;
                      const priorityInfo = priorityConfig[notification.priority] || priorityConfig.normal;
                      const StatusIcon = statusInfo.icon || Clock;
                      return (
                        <tr
                          key={notification.id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors animate-fade-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedNotifications.includes(notification.id)}
                              onChange={() => toggleSelectNotification(notification.id)}
                              className="w-4 h-4 rounded border-border"
                            />
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-foreground">{notification.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                {notification.content}
                              </p>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant="outline"
                              className={cn('text-xs', typeInfo.className)}
                            >
                              {typeInfo.label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant="outline"
                              className={cn('text-xs', statusInfo.className)}
                            >
                              <StatusIcon className="w-3 h-3 ml-1" />
                              {statusInfo.label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant="outline"
                              className={cn('text-xs', priorityInfo.className)}
                            >
                              <AlertCircle className="w-3 h-3 ml-1" />
                              {priorityInfo.label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <EyeIcon className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">
                                {(notification.readCount || 0).toLocaleString('fa-IR')}
                              </span>
                            </div>
                            {notification.clickCount !== undefined && notification.clickCount > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <MousePointerClick className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {(notification.clickCount || 0).toLocaleString('fa-IR')} کلیک
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setViewNotification(notification)}
                                title="مشاهده"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setEditNotification(notification)}
                                title="ویرایش"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon-sm" 
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteNotification(notification)}
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && (
            <div className="flex flex-col gap-4 p-3 md:p-4 border-t border-border">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs md:text-sm text-muted-foreground text-center sm:text-right">
                  نمایش {((currentPage - 1) * itemsPerPage) + 1} تا {Math.min(currentPage * itemsPerPage, totalNotifications)} از {totalNotifications} اعلان
                </span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 h-8 text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">۱۰</SelectItem>
                    <SelectItem value="20">۲۰</SelectItem>
                    <SelectItem value="50">۵۰</SelectItem>
                    <SelectItem value="100">۱۰۰</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                  className="flex-1 sm:flex-initial"
                >
                  قبلی
                </Button>
                <div className="flex items-center gap-1 overflow-x-auto">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={loading}
                        className={cn(
                          "min-w-[2.5rem]",
                          currentPage === pageNum && "gradient-primary text-primary-foreground"
                        )}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="flex-1 sm:flex-initial"
                >
                  بعدی
                </Button>
              </div>
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog افزودن اعلان */}
      <AddNotificationDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleNotificationAdded}
      />

      {/* Dialog مشاهده اعلان */}
      <ViewNotificationDialog
        open={!!viewNotification}
        onOpenChange={(open) => !open && setViewNotification(null)}
        notification={viewNotification}
      />

      {/* Dialog ویرایش اعلان */}
      <EditNotificationDialog
        open={!!editNotification}
        onOpenChange={(open) => !open && setEditNotification(null)}
        notification={editNotification}
        onSuccess={() => {
          const stored = localStorage.getItem('asll-notifications');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setNotifications(parsed);
            } catch {}
          }
          setEditNotification(null);
        }}
      />

      {/* Dialog حذف اعلان */}
      <DeleteNotificationDialog
        open={!!deleteNotification}
        onOpenChange={(open) => !open && setDeleteNotification(null)}
        notification={deleteNotification}
        onConfirm={handleDeleteNotification}
        isDeleting={isDeleting}
      />
    </AdminLayout>
  );
}

