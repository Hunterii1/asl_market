import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/api/adminApi';
import { Loader2 } from 'lucide-react';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  UserPlus, 
  MoreHorizontal,
  Mail,
  Phone,
  Eye,
  Edit,
  Trash2,
  X,
  Users as UsersIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { AddUserDialog } from '@/components/users/AddUserDialog';
import { ImportUsersDialog } from '@/components/users/ImportUsersDialog';
import { ExportUsersDialog } from '@/components/users/ExportUsersDialog';
import { SendNotificationDialog } from '@/components/users/SendNotificationDialog';
import { ViewUserDialog } from '@/components/users/ViewUserDialog';
import { EditUserDialog } from '@/components/users/EditUserDialog';
import { DeleteUserDialog } from '@/components/users/DeleteUserDialog';
import { UsersFilters } from '@/components/users/UsersFilters';
import { type UserExportData } from '@/lib/utils/exportUtils';
import { type UserForNotification } from '@/components/users/SendNotificationDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  telegramId?: string;
  balance?: number;
  status: 'active' | 'inactive' | 'banned';
  createdAt: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
}

// داده‌های اولیه
const initialUsers: User[] = [
  {
    id: '1',
    name: 'علی محمدی',
    email: 'ali@example.com',
    phone: '۰۹۱۲۳۴۵۶۷۸۹',
    telegramId: '@ali_mohammadi',
    balance: 1250000,
    status: 'active',
    createdAt: '۱۴۰۳/۰۹/۱۵',
  },
  {
    id: '2',
    name: 'مریم حسینی',
    email: 'maryam@example.com',
    phone: '۰۹۱۲۱۲۳۴۵۶۷',
    telegramId: '@maryam_h',
    balance: 850000,
    status: 'active',
    createdAt: '۱۴۰۳/۰۹/۱۴',
  },
  {
    id: '3',
    name: 'رضا کریمی',
    email: 'reza@example.com',
    phone: '۰۹۳۵۱۲۳۴۵۶۷',
    telegramId: '@reza_karimi',
    balance: 0,
    status: 'inactive',
    createdAt: '۱۴۰۳/۰۹/۱۰',
  },
  {
    id: '4',
    name: 'سارا احمدی',
    email: 'sara@example.com',
    phone: '۰۹۱۹۸۷۶۵۴۳۲',
    telegramId: '@sara_a',
    balance: 3500000,
    status: 'active',
    createdAt: '۱۴۰۳/۰۹/۰۸',
  },
  {
    id: '5',
    name: 'محمد نوری',
    email: 'mohammad@example.com',
    phone: '۰۹۱۲۵۵۵۴۴۴۳',
    telegramId: '@m_noori',
    balance: 125000,
    status: 'banned',
    createdAt: '۱۴۰۳/۰۹/۰۵',
  },
];

const statusConfig = {
  active: {
    label: 'فعال',
    className: 'bg-success/10 text-success',
  },
  inactive: {
    label: 'غیرفعال',
    className: 'bg-muted text-muted-foreground',
  },
  banned: {
    label: 'مسدود',
    className: 'bg-destructive/10 text-destructive',
  },
};

type SortField = 'name' | 'email' | 'id' | 'createdAt' | 'status';
type SortOrder = 'asc' | 'desc';

export default function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isSendNotificationDialogOpen, setIsSendNotificationDialogOpen] = useState(false);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<('active' | 'inactive' | 'banned')[]>([]);
  const [minBalance, setMinBalance] = useState('');
  const [maxBalance, setMaxBalance] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Load users from API
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getUsers({
          page: currentPage,
          per_page: itemsPerPage,
          status: statusFilter.length === 1 ? statusFilter[0] === 'active' ? 'active' : statusFilter[0] === 'inactive' ? 'inactive' : undefined : undefined,
          search: searchQuery || undefined,
        });

        console.log('Users API Response:', response);

        if (response) {
          // handleResponse returns data.data, so response is already the data object
          const usersData = response.users || response.data?.users || [];
          const transformedUsers: User[] = usersData.map((u: any) => ({
            id: u.id?.toString() || u.ID?.toString() || '',
            name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'بدون نام',
            email: u.email || '',
            phone: u.phone || '',
            telegramId: u.telegram_id || u.telegramId || undefined,
            balance: u.balance || 0,
            status: u.is_active === false ? 'inactive' : u.is_active === true ? 'active' : 'inactive',
            createdAt: u.created_at ? new Date(u.created_at).toLocaleDateString('fa-IR') : new Date().toLocaleDateString('fa-IR'),
            first_name: u.first_name,
            last_name: u.last_name,
            is_active: u.is_active,
          }));

          setUsers(transformedUsers);
          setTotalUsers(response.total || response.data?.total || 0);
          setTotalPages(response.total_pages || response.data?.total_pages || 1);
        }
      } catch (error: any) {
        console.error('Error loading users:', error);
        toast({
          title: 'خطا',
          description: error.message || 'خطا در بارگذاری کاربران',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [currentPage, itemsPerPage, statusFilter, searchQuery]);

  // Use users directly from API (already filtered and paginated)
  const paginatedUsers = users;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleUserAdded = () => {
    // بارگذاری مجدد کاربران از localStorage
    const stored = localStorage.getItem('asll-users');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUsers(parsed);
      } catch {
        // در صورت خطا، از داده‌های فعلی استفاده می‌کنیم
      }
    }
  };

  const handleUsersImported = (count: number) => {
    // بارگذاری مجدد کاربران از localStorage
    const stored = localStorage.getItem('asll-users');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUsers(parsed);
      } catch {
        // در صورت خطا، از داده‌های فعلی استفاده می‌کنیم
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map(u => u.id));
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
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

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    
    setIsDeleting(true);
    try {
      await adminApi.deleteUser(parseInt(deleteUser.id));
      
      setUsers(prev => prev.filter(u => u.id !== deleteUser.id));
      setSelectedUsers(prev => prev.filter(id => id !== deleteUser.id));
      setDeleteUser(null);
      setTotalUsers(prev => prev - 1);
      
      toast({
        title: 'موفقیت',
        description: 'کاربر با موفقیت حذف شد.',
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در حذف کاربر',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };


  const handleBulkAction = async (action: 'delete') => {
    if (selectedUsers.length === 0) return;

    try {
      // Delete each selected user
      for (const userId of selectedUsers) {
        await adminApi.deleteUser(parseInt(userId));
      }

      // Update local state
      setUsers(prev => prev.filter(u => !selectedUsers.includes(u.id)));
      setTotalUsers(prev => prev - selectedUsers.length);

      setSelectedUsers([]);
      
      toast({
        title: 'موفقیت',
        description: `عملیات با موفقیت انجام شد.`,
      });
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
    setMinBalance('');
    setMaxBalance('');
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
            <h1 className="text-xl md:text-2xl font-bold text-foreground">مدیریت کاربران</h1>
            <p className="text-sm md:text-base text-muted-foreground">لیست تمامی کاربران سیستم</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsImportDialogOpen(true)}
              className="flex-1 md:flex-initial"
            >
              <Upload className="w-4 h-4 md:ml-2" />
              <span className="hidden sm:inline">واردسازی</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsExportDialogOpen(true)}
              className="flex-1 md:flex-initial"
            >
              <Download className="w-4 h-4 md:ml-2" />
              <span className="hidden sm:inline">خروجی</span>
            </Button>
            <Button 
              size="sm" 
              onClick={() => setIsAddDialogOpen(true)}
              className="flex-1 md:flex-initial"
            >
              <UserPlus className="w-4 h-4 md:ml-2" />
              <span className="hidden sm:inline">کاربر جدید</span>
              <span className="sm:hidden">جدید</span>
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="جستجو بر اساس نام، ایمیل یا آیدی تلگرام..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pr-10 pl-4 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                />
              </div>
              <UsersFilters
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                minBalance={minBalance}
                onMinBalanceChange={setMinBalance}
                maxBalance={maxBalance}
                onMaxBalanceChange={setMaxBalance}
                onReset={handleResetFilters}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <Card className="border-primary/50 bg-primary/5 animate-scale-in">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <span className="text-sm text-foreground font-medium">
                  {selectedUsers.length} کاربر انتخاب شده
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsSendNotificationDialogOpen(true)}
                    className="flex-1 md:flex-initial"
                  >
                    <Mail className="w-4 h-4 md:ml-2" />
                    <span className="hidden sm:inline">ارسال پیام</span>
                    <span className="sm:hidden">پیام</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (confirm(`آیا از حذف ${selectedUsers.length} کاربر اطمینان دارید؟`)) {
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

        {/* Users Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">لیست کاربران ({users.length})</CardTitle>
              {(statusFilter.length > 0 || minBalance || maxBalance) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4 ml-1" />
                  پاک کردن فیلترها
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-4 text-right">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                    </th>
                    <th className="p-4 text-right">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        کاربر
                        {getSortIcon('name')}
                      </button>
                    </th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">تماس</th>
                    <th className="p-4 text-right">
                      <button
                        onClick={() => handleSort('id')}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        شماره کاربر
                        {getSortIcon('id')}
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
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        تاریخ ثبت
                        {getSortIcon('createdAt')}
                      </button>
                    </th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <UsersIcon className="w-12 h-12 text-muted-foreground" />
                          <p className="text-muted-foreground">هیچ کاربری یافت نشد</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user, index) => (
                    <tr
                      key={user.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleSelectUser(user.id)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-medium">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            {user.telegramId && (
                              <p className="text-sm text-muted-foreground">{user.telegramId}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {user.phone}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-foreground">
                          {user.id}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={cn(
                            'px-3 py-1 rounded-full text-xs font-medium',
                            statusConfig[user.status]?.className || 'bg-muted text-muted-foreground'
                          )}
                        >
                          {statusConfig[user.status]?.label || user.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {user.createdAt}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon-sm"
                            onClick={() => setViewUser(user)}
                            title="مشاهده جزئیات"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon-sm"
                            onClick={() => setEditUser(user)}
                            title="ویرایش"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon-sm" 
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteUser(user)}
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              {paginatedUsers.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <UsersIcon className="w-12 h-12 text-muted-foreground" />
                    <p className="text-muted-foreground">هیچ کاربری یافت نشد</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  {paginatedUsers.map((user, index) => (
                    <Card
                      key={user.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => toggleSelectUser(user.id)}
                              className="w-4 h-4 rounded border-border text-primary focus:ring-primary mt-1 flex-shrink-0"
                            />
                            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-medium flex-shrink-0">
                              {user.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{user.name}</p>
                              {user.telegramId && (
                                <p className="text-xs text-muted-foreground truncate">{user.telegramId}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button 
                              variant="ghost" 
                              size="icon-sm"
                              onClick={() => setViewUser(user)}
                              title="مشاهده"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon-sm"
                              onClick={() => setEditUser(user)}
                              title="ویرایش"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon-sm" 
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteUser(user)}
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2 border-t border-border pt-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-foreground">{user.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground text-xs">شماره کاربر:</span>
                            <span className="text-foreground font-medium">{user.id}</span>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <span
                              className={cn(
                                'px-2 py-1 rounded-full text-xs font-medium',
                                statusConfig[user.status]?.className || 'bg-muted text-muted-foreground'
                              )}
                            >
                              {statusConfig[user.status]?.label || user.status}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground pt-1">
                            تاریخ ثبت: {user.createdAt}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
            <div className="flex flex-col gap-4 p-3 md:p-4 border-t border-border">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs md:text-sm text-muted-foreground text-center sm:text-right">
                  نمایش {((currentPage - 1) * itemsPerPage) + 1} تا {Math.min(currentPage * itemsPerPage, totalUsers)} از {totalUsers} کاربر
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
                    <SelectItem value="25">۲۵</SelectItem>
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
                  disabled={currentPage === 1}
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

      {/* Dialog افزودن کاربر */}
      <AddUserDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleUserAdded}
      />

      {/* Dialog واردسازی گروهی */}
      <ImportUsersDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onSuccess={handleUsersImported}
      />

      {/* Dialog خروجی اکسل */}
      <ExportUsersDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        users={users as UserExportData[]}
        selectedUserIds={selectedUsers.length > 0 ? selectedUsers : undefined}
      />

      {/* Dialog ارسال اعلان */}
      <SendNotificationDialog
        open={isSendNotificationDialogOpen}
        onOpenChange={setIsSendNotificationDialogOpen}
        users={users as UserForNotification[]}
        selectedUserIds={selectedUsers.length > 0 ? selectedUsers : undefined}
      />

      {/* Dialog مشاهده کاربر */}
      <ViewUserDialog
        open={!!viewUser}
        onOpenChange={(open) => !open && setViewUser(null)}
        user={viewUser ? {
          id: viewUser.id,
          name: viewUser.name,
          email: viewUser.email,
          phone: viewUser.phone,
          telegramId: viewUser.telegramId || '',
          balance: viewUser.balance || 0,
          status: viewUser.status,
          createdAt: viewUser.createdAt,
        } : null}
      />

      {/* Dialog ویرایش کاربر */}
      <EditUserDialog
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        user={editUser ? {
          id: editUser.id,
          name: editUser.name,
          email: editUser.email,
          phone: editUser.phone,
          telegramId: editUser.telegramId || '',
          balance: editUser.balance || 0,
          status: editUser.status,
        } : null}
        onSuccess={() => {
          const stored = localStorage.getItem('asll-users');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setUsers(parsed);
            } catch {}
          }
          setEditUser(null);
        }}
      />

      {/* Dialog حذف کاربر */}
      <DeleteUserDialog
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
        user={deleteUser}
        onConfirm={handleDeleteUser}
        isDeleting={isDeleting}
      />
    </AdminLayout>
  );
}
