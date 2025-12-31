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
import { Notification } from '@/types/notification';

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
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
  info: { label: 'اطلاعات', className: 'bg-info/10 text-info' },
  warning: { label: 'هشدار', className: 'bg-warning/10 text-warning' },
  success: { label: 'موفقیت', className: 'bg-success/10 text-success' },
  error: { label: 'خطا', className: 'bg-destructive/10 text-destructive' },
  matching: { label: 'Matching', className: 'bg-purple-500/10 text-purple-500' },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: 'پایین', className: 'bg-muted text-muted-foreground' },
  normal: { label: 'عادی', className: 'bg-info/10 text-info' },
  high: { label: 'بالا', className: 'bg-warning/10 text-warning' },
  urgent: { label: 'فوری', className: 'bg-destructive/10 text-destructive' },
};

type SortField = 'title' | 'type' | 'status' | 'priority' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function Notifications() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewNotification, setViewNotification] = useState<Notification | null>(null);
  const [editNotification, setEditNotification] = useState<Notification | null>(null);
  const [deleteNotification, setDeleteNotification] = useState<Notification | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<('active' | 'inactive')[]>([]);
  const [typeFilter, setTypeFilter] = useState<('info' | 'warning' | 'success' | 'error')[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<('low' | 'normal' | 'high' | 'urgent')[]>([]);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Load notifications from API
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

      // handleResponse returns data.data, so response is already the data object
      // Backend returns: { success: true, data: { notifications: [], total: 0, ... } }
      // After handleResponse: { notifications: [], total: 0, ... }
      if (response) {
        const notificationsData = response?.notifications || [];
        
        setNotifications(notificationsData);
        setTotalNotifications(response?.total || 0);
        setTotalPages(response?.total_pages || 1);
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

  useEffect(() => {
    loadNotifications();
  }, [currentPage, itemsPerPage, statusFilter, typeFilter]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleNotificationAdded = () => {
    loadNotifications();
  };

  const toggleSelectNotification = (notificationId: number) => {
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
      await adminApi.deleteNotification(deleteNotification.id);
      toast({
        title: 'موفقیت',
        description: 'اعلان با موفقیت حذف شد.',
      });
      setDeleteNotification(null);
      loadNotifications();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در حذف اعلان',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkAction = async (action: 'delete') => {
    if (selectedNotifications.length === 0) return;

    try {
      if (action === 'delete') {
        await Promise.all(
          selectedNotifications.map(id => adminApi.deleteNotification(id))
        );
        toast({
          title: 'موفقیت',
          description: `${selectedNotifications.length} اعلان با موفقیت حذف شد.`,
        });
        setSelectedNotifications([]);
        loadNotifications();
      }
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در انجام عملیات',
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

  // Filter notifications by search query
  const filteredNotifications = notifications.filter(notification => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      notification.title.toLowerCase().includes(query) ||
      notification.message.toLowerCase().includes(query)
    );
  });

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
            ) : filteredNotifications.length === 0 ? (
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
                          checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedNotifications(filteredNotifications.map(n => n.id));
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
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">گیرنده</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNotifications.map((notification, index) => {
                      const statusInfo = statusConfig[notification.is_active ? 'active' : 'inactive'];
                      const typeInfo = typeConfig[notification.type] || typeConfig.info;
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
                                {notification.message}
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
                            {notification.user_id ? (
                              <div className="text-sm">
                                <p className="font-medium">{notification.user?.first_name} {notification.user?.last_name}</p>
                                <p className="text-xs text-muted-foreground">{notification.user?.email}</p>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                همه کاربران
                              </Badge>
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
          loadNotifications();
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
