import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/api/adminApi';
import { Loader2 } from 'lucide-react';
import { 
  Search, 
  Key, 
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  Key as KeyIcon,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddLicenseDialog } from '@/components/licenses/AddLicenseDialog';
import { EditLicenseDialog } from '@/components/licenses/EditLicenseDialog';
import { ViewLicenseDialog } from '@/components/licenses/ViewLicenseDialog';
import { DeleteLicenseDialog } from '@/components/licenses/DeleteLicenseDialog';
import { LicensesFilters } from '@/components/licenses/LicensesFilters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface License {
  id: string;
  code?: string;
  licenseKey: string;
  userId: string;
  userName: string;
  user?: any;
  productId: string;
  productName: string;
  type?: 'pro' | 'plus' | 'plus4';
  licenseType: 'trial' | 'monthly' | 'yearly' | 'lifetime';
  isUsed?: boolean;
  usedBy?: number;
  usedAt?: string;
  activatedAt?: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  maxActivations: number;
  currentActivations: number;
  notes?: string;
  createdAt: string;
}

// داده‌های اولیه
const initialLicenses: License[] = [
  {
    id: '1',
    licenseKey: 'ABCD-1234-EFGH-5678',
    userId: '1',
    userName: 'علی محمدی',
    productId: '1',
    productName: 'پکیج آموزشی جامع',
    licenseType: 'yearly',
    activatedAt: '۱۴۰۳/۰۹/۱۵',
    expiresAt: '۱۴۰۴/۰۹/۱۵',
    status: 'active',
    maxActivations: 3,
    currentActivations: 1,
    createdAt: '۱۴۰۳/۰۹/۱۵',
  },
  {
    id: '2',
    licenseKey: 'WXYZ-9876-MNOP-4321',
    userId: '2',
    userName: 'مریم حسینی',
    productId: '2',
    productName: 'نرم‌افزار مدیریت',
    licenseType: 'monthly',
    activatedAt: '۱۴۰۳/۰۹/۲۰',
    expiresAt: '۱۴۰۳/۱۰/۲۰',
    status: 'active',
    maxActivations: 1,
    currentActivations: 1,
    createdAt: '۱۴۰۳/۰۹/۲۰',
  },
  {
    id: '3',
    licenseKey: 'TEST-0000-DEMO-0000',
    userId: '3',
    userName: 'رضا کریمی',
    productId: '1',
    productName: 'پکیج آموزشی جامع',
    licenseType: 'trial',
    activatedAt: '۱۴۰۳/۰۹/۱۸',
    expiresAt: '۱۴۰۳/۰۹/۲۵',
    status: 'expired',
    maxActivations: 1,
    currentActivations: 1,
    createdAt: '۱۴۰۳/۰۹/۱۸',
  },
  {
    id: '4',
    licenseKey: 'LIFE-9999-FORE-9999',
    userId: '4',
    userName: 'سارا احمدی',
    productId: '3',
    productName: 'لایسنس مادام‌العمر',
    licenseType: 'lifetime',
    activatedAt: '۱۴۰۳/۰۹/۱۰',
    expiresAt: '',
    status: 'active',
    maxActivations: 5,
    currentActivations: 2,
    createdAt: '۱۴۰۳/۰۹/۱۰',
  },
  {
    id: '5',
    licenseKey: 'SUSP-1111-ENDD-2222',
    userId: '5',
    userName: 'محمد نوری',
    productId: '2',
    productName: 'نرم‌افزار مدیریت',
    licenseType: 'yearly',
    activatedAt: '۱۴۰۳/۰۸/۰۱',
    expiresAt: '۱۴۰۴/۰۸/۰۱',
    status: 'suspended',
    maxActivations: 2,
    currentActivations: 1,
    createdAt: '۱۴۰۳/۰۸/۰۱',
  },
];

const statusConfig = {
  active: {
    label: 'فعال',
    className: 'bg-success/10 text-success',
    icon: CheckCircle,
  },
  expired: {
    label: 'منقضی شده',
    className: 'bg-destructive/10 text-destructive',
    icon: XCircle,
  },
  suspended: {
    label: 'تعلیق شده',
    className: 'bg-warning/10 text-warning',
    icon: AlertCircle,
  },
  revoked: {
    label: 'لغو شده',
    className: 'bg-muted text-muted-foreground',
    icon: XCircle,
  },
};

const typeConfig = {
  trial: {
    label: 'آزمایشی',
    className: 'bg-info/10 text-info',
  },
  monthly: {
    label: 'ماهانه',
    className: 'bg-primary/10 text-primary',
  },
  yearly: {
    label: 'سالانه',
    className: 'bg-success/10 text-success',
  },
  lifetime: {
    label: 'مادام‌العمر',
    className: 'bg-warning/10 text-warning',
  },
};

type SortField = 'userName' | 'productName' | 'licenseType' | 'status' | 'expiresAt' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function Licenses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewLicense, setViewLicense] = useState<License | null>(null);
  const [editLicense, setEditLicense] = useState<License | null>(null);
  const [deleteLicense, setDeleteLicense] = useState<License | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<('active' | 'expired' | 'suspended' | 'revoked')[]>([]);
  const [typeFilter, setTypeFilter] = useState<('trial' | 'monthly' | 'yearly' | 'lifetime')[]>([]);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLicenses, setTotalLicenses] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Load licenses from API
  useEffect(() => {
    const loadLicenses = async () => {
      try {
        setLoading(true);
        const statusFilterValue = statusFilter.length === 1 
          ? statusFilter[0] === 'active' ? 'used' 
            : statusFilter[0] === 'expired' ? 'used' 
            : statusFilter[0] === 'suspended' ? 'used' 
            : statusFilter[0] === 'revoked' ? 'used' 
            : 'all'
          : 'all';

        const typeFilterValue = typeFilter.length === 1 ? typeFilter[0] : undefined;

        const response = await adminApi.getLicenses({
          page: currentPage,
          per_page: itemsPerPage,
          status: statusFilterValue,
        });

        if (response && (response.data || response.licenses)) {
          const licensesData = response.data?.licenses || response.licenses || [];
          const transformedLicenses: License[] = licensesData.map((l: any) => ({
            id: l.id?.toString() || l.ID?.toString() || '',
            code: l.code || l.license_key || '',
            licenseKey: l.code || l.license_key || 'N/A',
            userId: l.used_by?.toString() || l.user_id?.toString() || '0',
            userName: l.user ? `${l.user.first_name || ''} ${l.user.last_name || ''}`.trim() : 'بدون کاربر',
            productId: l.product_id?.toString() || l.productId?.toString() || '0',
            productName: l.product?.name || l.productName || 'بدون محصول',
            type: l.type || 'plus',
            licenseType: (l.type === 'pro' ? 'yearly' : l.type === 'plus' ? 'yearly' : l.type === 'plus4' ? 'monthly' : 'yearly') as 'trial' | 'monthly' | 'yearly' | 'lifetime',
            isUsed: l.is_used || false,
            usedBy: l.used_by,
            usedAt: l.used_at || '',
            expiresAt: l.expires_at || '',
            status: (l.is_used ? 'active' : 'expired') as 'active' | 'expired' | 'suspended' | 'revoked',
            maxActivations: l.max_activations || 1,
            currentActivations: l.current_activations || 0,
            createdAt: l.created_at || new Date().toISOString(),
          }));

          // Apply type filter if needed - filter by licenseType not type
          const filtered = typeFilterValue 
            ? transformedLicenses.filter(l => l.licenseType === typeFilterValue)
            : transformedLicenses;

          setLicenses(filtered);
          setTotalLicenses(response.data?.total || response.total || 0);
          setTotalPages(response.data?.total_pages || response.total_pages || 1);
        }
      } catch (error: any) {
        console.error('Error loading licenses:', error);
        toast({
          title: 'خطا',
          description: error.message || 'خطا در بارگذاری لایسنس‌ها',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadLicenses();
  }, [currentPage, itemsPerPage, statusFilter, typeFilter, searchQuery]);

  // Use licenses directly from API (already filtered and paginated)
  const paginatedLicenses = licenses;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleLicenseAdded = async () => {
    // Reload licenses from API
    try {
      const response = await adminApi.getLicenses({
        page: currentPage,
        per_page: itemsPerPage,
        status: statusFilter.length === 1 
          ? statusFilter[0] === 'active' ? 'used' 
            : statusFilter[0] === 'expired' ? 'used' 
            : statusFilter[0] === 'suspended' ? 'used' 
            : statusFilter[0] === 'revoked' ? 'used' 
            : 'all'
          : 'all',
      });
      if (response && (response.data || response.licenses)) {
        const licensesData = response.data?.licenses || response.licenses || [];
        const transformedLicenses: License[] = licensesData.map((l: any) => ({
          id: l.id?.toString() || l.ID?.toString() || '',
          code: l.code || l.license_key || '',
          licenseKey: l.code || l.license_key || 'N/A',
          userId: l.used_by?.toString() || l.user_id?.toString() || '0',
          userName: l.user ? `${l.user.first_name || ''} ${l.user.last_name || ''}`.trim() : 'بدون کاربر',
          productId: l.product_id?.toString() || l.productId?.toString() || '0',
          productName: l.product?.name || l.productName || 'بدون محصول',
          type: l.type || 'plus',
          licenseType: l.type === 'pro' ? 'yearly' : l.type === 'plus' ? 'yearly' : l.type === 'plus4' ? 'monthly' : 'yearly',
          isUsed: l.is_used || false,
          usedBy: l.used_by,
          usedAt: l.used_at || '',
          expiresAt: l.expires_at || '',
          status: l.is_used ? 'active' : 'expired',
          createdAt: l.created_at || new Date().toISOString(),
        }));
        setLicenses(transformedLicenses);
      }
    } catch (error) {
      console.error('Error reloading licenses:', error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedLicenses.length === paginatedLicenses.length) {
      setSelectedLicenses([]);
    } else {
      setSelectedLicenses(paginatedLicenses.map(l => l.id));
    }
  };

  const toggleSelectLicense = (licenseId: string) => {
    setSelectedLicenses(prev =>
      prev.includes(licenseId)
        ? prev.filter(id => id !== licenseId)
        : [...prev, licenseId]
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

  const handleDeleteLicense = async () => {
    if (!deleteLicense) return;
    
    setIsDeleting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLicenses(prev => prev.filter(l => l.id !== deleteLicense.id));
      setSelectedLicenses(prev => prev.filter(id => id !== deleteLicense.id));
      setDeleteLicense(null);
      
      toast({
        title: 'موفقیت',
        description: 'لایسنس با موفقیت حذف شد.',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف لایسنس',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'suspend' | 'revoke' | 'delete') => {
    if (selectedLicenses.length === 0) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      setLicenses(prev => prev.map(license => {
        if (selectedLicenses.includes(license.id)) {
          if (action === 'activate') {
            return { ...license, status: 'active' as const };
          } else if (action === 'suspend') {
            return { ...license, status: 'suspended' as const };
          } else if (action === 'revoke') {
            return { ...license, status: 'revoked' as const };
          }
          return license;
        }
        return license;
      }));

      if (action === 'delete') {
        setLicenses(prev => prev.filter(l => !selectedLicenses.includes(l.id)));
      }

      setSelectedLicenses([]);
      
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

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: 'کپی شد',
      description: 'کد لایسنس در کلیپ‌بورد کپی شد.',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">مدیریت لایسنس‌ها</h1>
            <p className="text-sm md:text-base text-muted-foreground">لیست تمامی لایسنس‌های سیستم</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={() => setIsAddDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 md:ml-2" />
              <span className="hidden sm:inline">لایسنس جدید</span>
              <span className="sm:hidden">جدید</span>
            </Button>
          </div>
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
              <LicensesFilters
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
                onReset={handleResetFilters}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedLicenses.length > 0 && (
          <Card className="border-primary/50 bg-primary/5 animate-scale-in">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <span className="text-sm text-foreground font-medium">
                  {selectedLicenses.length} لایسنس انتخاب شده
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
                    onClick={() => handleBulkAction('revoke')}
                    className="text-destructive hover:bg-destructive/10 flex-1 md:flex-initial"
                  >
                    <XCircle className="w-4 h-4 md:ml-2" />
                    <span className="hidden sm:inline">لغو</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (confirm(`آیا از حذف ${selectedLicenses.length} لایسنس اطمینان دارید؟`)) {
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

        {/* Licenses Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">لیست لایسنس‌ها ({totalLicenses})</CardTitle>
              {(statusFilter.length > 0 || typeFilter.length > 0) && (
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
                        checked={selectedLicenses.length === paginatedLicenses.length && paginatedLicenses.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                    </th>
                    <th className="p-4 text-right">
                      <button
                        onClick={() => handleSort('userName')}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        کاربر
                        {getSortIcon('userName')}
                      </button>
                    </th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">کد لایسنس</th>
                    <th className="p-4 text-right">
                      <button
                        onClick={() => handleSort('productName')}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        محصول
                        {getSortIcon('productName')}
                      </button>
                    </th>
                    <th className="p-4 text-right">
                      <button
                        onClick={() => handleSort('licenseType')}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        نوع
                        {getSortIcon('licenseType')}
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
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">فعال‌سازی</th>
                    <th className="p-4 text-right">
                      <button
                        onClick={() => handleSort('expiresAt')}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        انقضا
                        {getSortIcon('expiresAt')}
                      </button>
                    </th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLicenses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <KeyIcon className="w-12 h-12 text-muted-foreground" />
                          <p className="text-muted-foreground">هیچ لایسنسی یافت نشد</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedLicenses.map((license, index) => {
                      const StatusIcon = statusConfig[license.status].icon;
                      return (
                        <tr
                          key={license.id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors animate-fade-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedLicenses.includes(license.id)}
                              onChange={() => toggleSelectLicense(license.id)}
                              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                            />
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-foreground">{license.userName}</p>
                              <p className="text-xs text-muted-foreground">#{license.id}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono text-foreground dir-ltr">
                                {license.licenseKey}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleCopyKey(license.licenseKey)}
                                title="کپی کد"
                                className="h-6 w-6"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-foreground">{license.productName}</p>
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                'px-3 py-1 rounded-full text-xs font-medium',
                                typeConfig[license.licenseType].className
                              )}
                            >
                              {typeConfig[license.licenseType].label}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit',
                                statusConfig[license.status].className
                              )}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig[license.status].label}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-foreground">
                              {license.currentActivations} / {license.maxActivations}
                            </p>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {license.expiresAt || 'نامحدود'}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setViewLicense(license)}
                                title="مشاهده جزئیات"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setEditLicense(license)}
                                title="ویرایش"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon-sm" 
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteLicense(license)}
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
                  نمایش {((currentPage - 1) * itemsPerPage) + 1} تا {Math.min(currentPage * itemsPerPage, totalLicenses)} از {totalLicenses} لایسنس
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

      {/* Dialog افزودن لایسنس */}
      <AddLicenseDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleLicenseAdded}
      />

      {/* Dialog مشاهده لایسنس */}
      <ViewLicenseDialog
        open={!!viewLicense}
        onOpenChange={(open) => !open && setViewLicense(null)}
        license={viewLicense}
      />

      {/* Dialog ویرایش لایسنس */}
      <EditLicenseDialog
        open={!!editLicense}
        onOpenChange={(open) => !open && setEditLicense(null)}
        license={editLicense}
        onSuccess={() => {
          const stored = localStorage.getItem('asll-licenses');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setLicenses(parsed);
            } catch {}
          }
          setEditLicense(null);
        }}
      />

      {/* Dialog حذف لایسنس */}
      <DeleteLicenseDialog
        open={!!deleteLicense}
        onOpenChange={(open) => !open && setDeleteLicense(null)}
        license={deleteLicense}
        onConfirm={handleDeleteLicense}
        isDeleting={isDeleting}
      />
    </AdminLayout>
  );
}

