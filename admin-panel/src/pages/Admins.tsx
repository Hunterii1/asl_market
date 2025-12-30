import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi } from '@/lib/api/adminApi';
import { Loader2 } from 'lucide-react';
import { 
  Search, 
  Shield, 
  ShieldPlus,
  Eye,
  Edit,
  Trash2,
  X,
  Shield as ShieldIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { AddAdminDialog } from '@/components/admins/AddAdminDialog';
import { EditAdminDialog } from '@/components/admins/EditAdminDialog';
import { ViewAdminDialog } from '@/components/admins/ViewAdminDialog';
import { DeleteAdminDialog } from '@/components/admins/DeleteAdminDialog';
import { AdminsFilters } from '@/components/admins/AdminsFilters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MessageSquare } from 'lucide-react';

interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: string[];
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin: string | null;
  loginCount: number;
}

interface TelegramAdmin {
  id: string;
  telegram_id: string;
  name: string;
  username?: string;
  role: 'super_admin' | 'moderator';
  status: 'active' | 'inactive';
  is_full_admin: boolean;
  notes?: string;
  createdAt: string;
}

// داده‌های اولیه
const initialAdmins: Admin[] = [
  {
    id: '1',
    name: 'علی احمدی',
    email: 'ali@admin.com',
    phone: '۰۹۱۲۳۴۵۶۷۸۹',
    username: 'ali_admin',
    role: 'super_admin',
    permissions: ['users.manage', 'products.manage', 'settings.manage'],
    status: 'active',
    createdAt: '۱۴۰۳/۰۹/۱۵',
    lastLogin: '۱۴۰۳/۰۹/۲۰ - ۱۴:۳۰',
    loginCount: 125,
  },
  {
    id: '2',
    name: 'مریم حسینی',
    email: 'maryam@admin.com',
    phone: '۰۹۱۲۱۲۳۴۵۶۷',
    username: 'maryam_admin',
    role: 'admin',
    permissions: ['users.view', 'products.manage'],
    status: 'active',
    createdAt: '۱۴۰۳/۰۹/۱۴',
    lastLogin: '۱۴۰۳/۰۹/۲۰ - ۱۲:۱۵',
    loginCount: 89,
  },
  {
    id: '3',
    name: 'رضا کریمی',
    email: 'reza@admin.com',
    phone: '۰۹۳۵۱۲۳۴۵۶۷',
    username: 'reza_mod',
    role: 'moderator',
    permissions: ['users.view', 'orders.view'],
    status: 'active',
    createdAt: '۱۴۰۳/۰۹/۱۰',
    lastLogin: '۱۴۰۳/۰۹/۱۹ - ۱۶:۴۵',
    loginCount: 45,
  },
];

const statusConfig = {
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
  suspended: {
    label: 'تعلیق شده',
    className: 'bg-destructive/10 text-destructive',
    icon: AlertCircle,
  },
};

const roleConfig = {
  super_admin: {
    label: 'مدیر کل',
    className: 'bg-primary/10 text-primary',
  },
  admin: {
    label: 'مدیر',
    className: 'bg-info/10 text-info',
  },
  moderator: {
    label: 'ناظر',
    className: 'bg-muted text-muted-foreground',
  },
};

type SortField = 'name' | 'email' | 'role' | 'status' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function Admins() {
  const [activeTab, setActiveTab] = useState<'web' | 'telegram'>('web');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewAdmin, setViewAdmin] = useState<Admin | null>(null);
  const [editAdmin, setEditAdmin] = useState<Admin | null>(null);
  const [deleteAdmin, setDeleteAdmin] = useState<Admin | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<('active' | 'inactive' | 'suspended')[]>([]);
  const [roleFilter, setRoleFilter] = useState<('super_admin' | 'admin' | 'moderator')[]>([]);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAdmins, setTotalAdmins] = useState(0);
  
  // Telegram admins state
  const [telegramAdmins, setTelegramAdmins] = useState<TelegramAdmin[]>([]);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [deleteTelegramAdmin, setDeleteTelegramAdmin] = useState<TelegramAdmin | null>(null);

  // Load admins from API - Note: Telegram admins are not displayed here
  // This page is for web panel admins only
  useEffect(() => {
    const loadAdmins = async () => {
      try {
        setLoading(true);
        // Load web panel admins (not telegram admins)
        const response = await adminApi.getWebAdmins({
          page: currentPage,
          per_page: itemsPerPage,
        });

        if (response && (response.data || response.admins)) {
          const adminsData = response.data?.admins || response.admins || [];
          const transformedAdmins: Admin[] = adminsData.map((a: any) => ({
            id: a.id?.toString() || a.ID?.toString() || '',
            name: a.name || a.first_name || 'بدون نام',
            email: a.email || '',
            phone: a.phone || '',
            username: a.username || a.telegram_id?.toString() || '',
            role: a.role || 'admin',
            permissions: a.permissions || [],
            status: a.status || (a.is_active ? 'active' : 'inactive'),
            createdAt: a.created_at || new Date().toISOString(),
            lastLogin: a.last_login ? new Date(a.last_login).toLocaleDateString('fa-IR') : null,
            loginCount: a.login_count || 0,
          }));

          setAdmins(transformedAdmins);
          setTotalAdmins(response.data?.total || response.total || transformedAdmins.length);
        } else {
          // If no admins found, set empty array
          setAdmins([]);
          setTotalAdmins(0);
        }
      } catch (error: any) {
        // Silently handle 404 errors (endpoint may not exist in backend yet)
        if (error?.statusCode === 404 || error?.message?.includes('404') || error?.message?.includes('خطا در دریافت')) {
          // Endpoint doesn't exist yet - silently return empty state
          setAdmins([]);
          setTotalAdmins(0);
        } else {
          console.error('Error loading admins:', error);
          toast({
            title: 'خطا',
            description: error.message || 'خطا در بارگذاری مدیران',
            variant: 'destructive',
          });
          setAdmins([]);
          setTotalAdmins(0);
        }
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'web') {
      loadAdmins();
    }
  }, [currentPage, itemsPerPage, activeTab]);

  // Load telegram admins
  useEffect(() => {
    const loadTelegramAdmins = async () => {
      if (activeTab !== 'telegram') return;
      
      try {
        setTelegramLoading(true);
        const response = await adminApi.getTelegramAdmins();
        
        if (response && (response.data || response.admins)) {
          const adminsData = response.data?.admins || response.admins || [];
          const transformedAdmins: TelegramAdmin[] = adminsData.map((a: any) => ({
            id: a.id?.toString() || '',
            telegram_id: a.telegram_id?.toString() || '',
            name: a.name || a.first_name || 'بدون نام',
            username: a.username || '',
            role: a.is_full_admin ? 'super_admin' : 'moderator',
            status: a.is_active ? 'active' : 'inactive',
            is_full_admin: a.is_full_admin || false,
            notes: a.notes || '',
            createdAt: a.created_at || new Date().toISOString(),
          }));
          
          setTelegramAdmins(transformedAdmins);
        } else {
          setTelegramAdmins([]);
        }
      } catch (error: any) {
        console.error('Error loading telegram admins:', error);
        toast({
          title: 'خطا',
          description: error.message || 'خطا در بارگذاری مدیران تلگرام',
          variant: 'destructive',
        });
        setTelegramAdmins([]);
      } finally {
        setTelegramLoading(false);
      }
    };
    
    loadTelegramAdmins();
  }, [activeTab]);

  // Use admins directly from API (filtering and sorting can be done client-side if needed)
  const filteredAdmins = admins.filter(admin => {
    // Search filter
    const matchesSearch = 
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.phone.includes(searchQuery);

    // Status filter
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(admin.status);

    // Role filter
    const matchesRole = roleFilter.length === 0 || roleFilter.includes(admin.role);

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Sort admins
  const sortedAdmins = [...filteredAdmins].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'name' || sortField === 'email') {
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedAdmins.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAdmins = sortedAdmins.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleAdminAdded = async () => {
    // Reload admins from API
    try {
      setLoading(true);
      const response = await adminApi.getWebAdmins({
        page: currentPage,
        per_page: itemsPerPage,
      }).catch((error: any) => {
        // If 404, return empty response
        if (error?.statusCode === 404 || error?.message?.includes('404')) {
          return { data: { admins: [], total: 0 }, admins: [], total: 0 };
        }
        throw error;
      });
      
      if (response && (response.data || response.admins)) {
        const adminsData = response.data?.admins || response.admins || [];
        const transformedAdmins: Admin[] = adminsData.map((a: any) => ({
          id: a.id?.toString() || a.ID?.toString() || '',
          name: a.name || a.first_name || 'بدون نام',
          email: a.email || '',
          phone: a.phone || '',
          username: a.username || a.telegram_id?.toString() || '',
          role: a.role || 'admin',
          permissions: a.permissions || [],
          status: a.status || (a.is_active ? 'active' : 'inactive'),
          createdAt: a.created_at || new Date().toISOString(),
          lastLogin: a.last_login ? new Date(a.last_login).toLocaleDateString('fa-IR') : null,
          loginCount: a.login_count || 0,
        }));
        setAdmins(transformedAdmins);
        setTotalAdmins(response.data?.total || response.total || transformedAdmins.length);
      } else {
        setAdmins([]);
        setTotalAdmins(0);
      }
    } catch (error: any) {
      // Silently handle 404 errors
      if (!(error?.statusCode === 404 || error?.message?.includes('404'))) {
        console.error('Error reloading admins:', error);
        toast({
          title: 'خطا',
          description: error.message || 'خطا در بارگذاری مدیران',
          variant: 'destructive',
        });
      }
      setAdmins([]);
      setTotalAdmins(0);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedAdmins.length === paginatedAdmins.length) {
      setSelectedAdmins([]);
    } else {
      setSelectedAdmins(paginatedAdmins.map(a => a.id));
    }
  };

  const toggleSelectAdmin = (adminId: string) => {
    setSelectedAdmins(prev =>
      prev.includes(adminId)
        ? prev.filter(id => id !== adminId)
        : [...prev, adminId]
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

  const handleDeleteAdmin = async () => {
    if (!deleteAdmin) return;
    
    setIsDeleting(true);
    try {
      await adminApi.deleteWebAdmin(Number(deleteAdmin.id));
      
      // Reload admins
      await handleAdminAdded();
      setSelectedAdmins(prev => prev.filter(id => id !== deleteAdmin.id));
      setDeleteAdmin(null);
      
      toast({
        title: 'موفقیت',
        description: 'مدیر با موفقیت حذف شد.',
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در حذف مدیر',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'suspend' | 'delete') => {
    if (selectedAdmins.length === 0) return;

    try {
      if (action === 'delete') {
        // Delete selected web admins
        await Promise.all(
          selectedAdmins.map(id => adminApi.deleteWebAdmin(Number(id)))
        );
      } else {
        // Update status for selected admins
        const statusMap: Record<string, string> = {
          'activate': 'active',
          'suspend': 'suspended',
        };
        await Promise.all(
          selectedAdmins.map(id => 
            adminApi.updateWebAdmin(Number(id), { is_active: action === 'activate' })
          )
        );
      }

      // Reload admins
      await handleAdminAdded();
      setSelectedAdmins([]);
      
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
    setRoleFilter([]);
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

  // Handle telegram admin delete
  const handleDeleteTelegramAdmin = async () => {
    if (!deleteTelegramAdmin) return;
    
    setIsDeleting(true);
    try {
      await adminApi.removeTelegramAdmin(Number(deleteTelegramAdmin.telegram_id));
      
      setTelegramAdmins(prev => prev.filter(a => a.id !== deleteTelegramAdmin.id));
      setDeleteTelegramAdmin(null);
      
      toast({
        title: 'موفقیت',
        description: 'مدیر تلگرام با موفقیت حذف شد.',
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در حذف مدیر تلگرام',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter telegram admins
  const filteredTelegramAdmins = telegramAdmins.filter(admin => {
    const matchesSearch = 
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.telegram_id.includes(searchQuery) ||
      (admin.username && admin.username.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">مدیریت مدیران</h1>
            <p className="text-sm md:text-base text-muted-foreground">مدیریت مدیران پنل وب و مدیران تلگرام</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'web' | 'telegram')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="web" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">مدیران پنل وب</span>
              <span className="sm:hidden">وب</span>
            </TabsTrigger>
            <TabsTrigger value="telegram" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">مدیران تلگرام</span>
              <span className="sm:hidden">تلگرام</span>
            </TabsTrigger>
          </TabsList>

          {/* Web Admins Tab */}
          <TabsContent value="web" className="space-y-6 mt-6">
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={() => setIsAddDialogOpen(true)}
                className="w-full sm:w-auto"
              >
                <ShieldPlus className="w-4 h-4 md:ml-2" />
                <span className="hidden sm:inline">مدیر جدید</span>
                <span className="sm:hidden">جدید</span>
              </Button>
            </div>

        {/* Filters & Search */}
        <Card>
          <CardContent className="p-3 md:p-4">
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
              <AdminsFilters
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                roleFilter={roleFilter}
                onRoleFilterChange={setRoleFilter}
                onReset={handleResetFilters}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedAdmins.length > 0 && (
          <Card className="border-primary/50 bg-primary/5 animate-scale-in">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <span className="text-sm text-foreground font-medium">
                  {selectedAdmins.length} مدیر انتخاب شده
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkAction('activate')}
                    className="text-success hover:bg-success/10 flex-1 md:flex-initial"
                  >
                    <CheckCircle className="w-4 h-4 md:ml-2" />
                    <span className="hidden sm:inline">فعال‌سازی</span>
                    <span className="sm:hidden">فعال</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkAction('suspend')}
                    className="text-warning hover:bg-warning/10 flex-1 md:flex-initial"
                  >
                    <AlertCircle className="w-4 h-4 md:ml-2" />
                    <span className="hidden sm:inline">تعلیق</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (confirm(`آیا از حذف ${selectedAdmins.length} مدیر اطمینان دارید؟`)) {
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

        {/* Admins Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">لیست مدیران ({totalAdmins})</CardTitle>
              {(statusFilter.length > 0 || roleFilter.length > 0) && (
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
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-4 text-right">
                      <input
                        type="checkbox"
                        checked={selectedAdmins.length === paginatedAdmins.length && paginatedAdmins.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                    </th>
                    <th className="p-4 text-right">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        مدیر
                        {getSortIcon('name')}
                      </button>
                    </th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">تماس</th>
                    <th className="p-4 text-right">
                      <button
                        onClick={() => handleSort('role')}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        نقش
                        {getSortIcon('role')}
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
                  {paginatedAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <ShieldIcon className="w-12 h-12 text-muted-foreground" />
                          <p className="text-muted-foreground font-medium">هیچ مدیر وب پنلی یافت نشد</p>
                          <p className="text-sm text-muted-foreground mt-2 max-w-md">
                            در حال حاضر هیچ مدیر وب پنلی ثبت نشده است. برای افزودن مدیر جدید از دکمه "مدیر جدید" استفاده کنید.
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            توجه: مدیران تلگرام در تب جداگانه "مدیران تلگرام" نمایش داده می‌شوند.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedAdmins.map((admin, index) => {
                      const StatusIcon = statusConfig[admin.status].icon;
                      return (
                        <tr
                          key={admin.id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors animate-fade-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedAdmins.includes(admin.id)}
                              onChange={() => toggleSelectAdmin(admin.id)}
                              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                            />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-medium">
                                {admin.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{admin.name}</p>
                                <p className="text-sm text-muted-foreground font-mono">{admin.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="text-sm text-foreground font-mono">{admin.email}</div>
                              <div className="text-sm text-muted-foreground">{admin.phone}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                'px-3 py-1 rounded-full text-xs font-medium',
                                roleConfig[admin.role].className
                              )}
                            >
                              {roleConfig[admin.role].label}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit',
                                statusConfig[admin.status].className
                              )}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig[admin.status].label}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {admin.createdAt}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setViewAdmin(admin)}
                                title="مشاهده جزئیات"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setEditAdmin(admin)}
                                title="ویرایش"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon-sm" 
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteAdmin(admin)}
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            )}

            {/* Pagination */}
            {!loading && (
            <div className="flex flex-col gap-4 p-3 md:p-4 border-t border-border">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs md:text-sm text-muted-foreground text-center sm:text-right">
                  نمایش {startIndex + 1} تا {Math.min(endIndex, sortedAdmins.length)} از {sortedAdmins.length} مدیر
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
                  disabled={currentPage === totalPages}
                  className="flex-1 sm:flex-initial"
                >
                  بعدی
                </Button>
              </div>
            </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          {/* Telegram Admins Tab */}
          <TabsContent value="telegram" className="space-y-6 mt-6">
            {/* Filters & Search */}
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="جستجو در مدیران تلگرام..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-10 pr-10 pl-4 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Telegram Admins Table */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">لیست مدیران تلگرام ({filteredTelegramAdmins.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {telegramLoading ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="p-4 text-right text-sm font-medium text-muted-foreground">نام</th>
                          <th className="p-4 text-right text-sm font-medium text-muted-foreground">آیدی تلگرام</th>
                          <th className="p-4 text-right text-sm font-medium text-muted-foreground">نام کاربری</th>
                          <th className="p-4 text-right text-sm font-medium text-muted-foreground">نقش</th>
                          <th className="p-4 text-right text-sm font-medium text-muted-foreground">وضعیت</th>
                          <th className="p-4 text-right text-sm font-medium text-muted-foreground">تاریخ ثبت</th>
                          <th className="p-4 text-right text-sm font-medium text-muted-foreground">عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTelegramAdmins.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-12 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <MessageSquare className="w-12 h-12 text-muted-foreground" />
                                <p className="text-muted-foreground font-medium">هیچ مدیر تلگرامی یافت نشد</p>
                                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                                  در حال حاضر هیچ مدیر تلگرامی ثبت نشده است. مدیران تلگرام برای مدیریت ربات تلگرام استفاده می‌شوند.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredTelegramAdmins.map((admin, index) => {
                            const StatusIcon = statusConfig[admin.status].icon;
                            return (
                              <tr
                                key={admin.id}
                                className="border-b border-border/50 hover:bg-muted/30 transition-colors animate-fade-in"
                                style={{ animationDelay: `${index * 30}ms` }}
                              >
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-medium">
                                      {admin.name.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="font-medium text-foreground">{admin.name}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="text-sm text-foreground font-mono">{admin.telegram_id}</div>
                                </td>
                                <td className="p-4">
                                  <div className="text-sm text-muted-foreground">
                                    {admin.username ? `@${admin.username}` : '-'}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span
                                    className={cn(
                                      'px-3 py-1 rounded-full text-xs font-medium',
                                      roleConfig[admin.role].className
                                    )}
                                  >
                                    {roleConfig[admin.role].label}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span
                                    className={cn(
                                      'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit',
                                      statusConfig[admin.status].className
                                    )}
                                  >
                                    <StatusIcon className="w-3 h-3" />
                                    {statusConfig[admin.status].label}
                                  </span>
                                </td>
                                <td className="p-4 text-sm text-muted-foreground">
                                  {new Date(admin.createdAt).toLocaleDateString('fa-IR')}
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon-sm" 
                                      className="text-destructive hover:bg-destructive/10"
                                      onClick={() => setDeleteTelegramAdmin(admin)}
                                      title="حذف"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog افزودن مدیر */}
      <AddAdminDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleAdminAdded}
      />

      {/* Dialog مشاهده مدیر */}
      <ViewAdminDialog
        open={!!viewAdmin}
        onOpenChange={(open) => !open && setViewAdmin(null)}
        admin={viewAdmin}
      />

      {/* Dialog ویرایش مدیر */}
      <EditAdminDialog
        open={!!editAdmin}
        onOpenChange={(open) => !open && setEditAdmin(null)}
        admin={editAdmin}
        onSuccess={async () => {
          await handleAdminAdded();
          setEditAdmin(null);
        }}
      />

      {/* Dialog حذف مدیر وب */}
      <DeleteAdminDialog
        open={!!deleteAdmin}
        onOpenChange={(open) => !open && setDeleteAdmin(null)}
        admin={deleteAdmin}
        onConfirm={handleDeleteAdmin}
        isDeleting={isDeleting}
      />

      {/* Dialog حذف مدیر تلگرام */}
      {deleteTelegramAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteTelegramAdmin(null)}>
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">حذف مدیر تلگرام</h3>
            <p className="text-muted-foreground mb-6">
              آیا از حذف مدیر تلگرام <strong>{deleteTelegramAdmin.name}</strong> (آیدی: {deleteTelegramAdmin.telegram_id}) اطمینان دارید؟
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteTelegramAdmin(null)}>
                انصراف
              </Button>
              <Button variant="destructive" onClick={handleDeleteTelegramAdmin} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حذف'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

