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
import { ViewLicenseDialog } from '@/components/licenses/ViewLicenseDialog';
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
  code: string;
  type: 'pro' | 'plus' | 'plus4';
  duration: number; // Duration in months
  is_used: boolean;
  used_by?: number;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  used_at?: string;
  expires_at?: string;
  generated_by: number;
  admin?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  used: {
    label: 'استفاده شده',
    className: 'bg-info/10 text-info',
    icon: CheckCircle,
  },
  available: {
    label: 'در دسترس',
    className: 'bg-success/10 text-success',
    icon: CheckCircle,
  },
};

const typeConfig = {
  pro: {
    label: 'پرو',
    className: 'bg-primary/10 text-primary',
  },
  plus: {
    label: 'پلاس',
    className: 'bg-success/10 text-success',
  },
  plus4: {
    label: 'پلاس ۴',
    className: 'bg-warning/10 text-warning',
  },
};



type SortField = 'code' | 'type' | 'is_used';
type SortOrder = 'asc' | 'desc';

export default function Licenses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewLicense, setViewLicense] = useState<License | null>(null);
  const [statusFilter, setStatusFilter] = useState<('used' | 'available')[]>([]);
  const [typeFilter, setTypeFilter] = useState<('pro' | 'plus' | 'plus4')[]>([]);
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLicenses, setTotalLicenses] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Load licenses from API
  const loadLicenses = async () => {
    try {
      setLoading(true);
      const statusFilterValue = statusFilter.length === 1 ? statusFilter[0] : undefined;
      const typeFilterValue = typeFilter.length === 1 ? typeFilter[0] : undefined;

      const response = await adminApi.getLicenses({
        page: currentPage,
        per_page: itemsPerPage,
        status: statusFilterValue,
        type: typeFilterValue,
      });

      if (response) {
        const licensesData = response.licenses || [];
        const transformedLicenses: License[] = licensesData.map((l: any) => ({
          id: l.id?.toString() || l.ID?.toString() || '',
          code: l.code || '',
          type: (l.type || 'plus') as 'pro' | 'plus' | 'plus4',
          duration: l.duration || 12,
          is_used: l.is_used || false,
          used_by: l.used_by || undefined,
          user: l.user ? {
            id: l.user.id || 0,
            first_name: l.user.first_name || '',
            last_name: l.user.last_name || '',
            email: l.user.email || '',
            phone: l.user.phone || '',
          } : undefined,
          used_at: l.used_at || undefined,
          expires_at: l.expires_at || undefined,
          generated_by: l.generated_by || 0,
          admin: l.admin ? {
            id: l.admin.id || 0,
            first_name: l.admin.first_name || '',
            last_name: l.admin.last_name || '',
          } : undefined,
          created_at: l.created_at || new Date().toISOString(),
          updated_at: l.updated_at || new Date().toISOString(),
        }));

        setLicenses(transformedLicenses);
        setTotalLicenses(response.total || 0);
        setTotalPages(response.total_pages || 1);
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

  useEffect(() => {
    loadLicenses();
  }, [currentPage, itemsPerPage, statusFilter, typeFilter]);

  // Use licenses directly from API (already filtered and paginated)
  const paginatedLicenses = licenses;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleLicenseAdded = async () => {
    await loadLicenses();
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
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">کد لایسنس</th>
                    <th className="p-4 text-right">
                      <button
                        onClick={() => handleSort('type')}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        نوع
                        {getSortIcon('type')}
                      </button>
                    </th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">کاربر</th>
                    <th className="p-4 text-right">
                      <button
                        onClick={() => handleSort('is_used')}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        وضعیت
                        {getSortIcon('is_used')}
                      </button>
                    </th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">تاریخ استفاده</th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">انقضا</th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLicenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <KeyIcon className="w-12 h-12 text-muted-foreground" />
                          <p className="text-muted-foreground">هیچ لایسنسی یافت نشد</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedLicenses.map((license, index) => {
                      const statusKey = license.is_used ? 'used' : 'available';
                      const StatusIcon = statusConfig[statusKey].icon;
                      const userName = license.user ? `${license.user.first_name || ''} ${license.user.last_name || ''}`.trim() : 'بدون کاربر';
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
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono text-foreground dir-ltr">
                                {license.code}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleCopyKey(license.code)}
                                title="کپی کد"
                                className="h-6 w-6"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                'px-3 py-1 rounded-full text-xs font-medium',
                                typeConfig[license.type].className
                              )}
                            >
                              {typeConfig[license.type].label}
                            </span>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-foreground">{userName}</p>
                              {license.user?.email && (
                                <p className="text-xs text-muted-foreground">{license.user.email}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit',
                                statusConfig[statusKey].className
                              )}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig[statusKey].label}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {license.used_at ? new Date(license.used_at).toLocaleDateString('fa-IR') : '-'}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {license.expires_at ? new Date(license.expires_at).toLocaleDateString('fa-IR') : '-'}
                          </td>
                          <td className="p-4">
                            <Button 
                              variant="ghost" 
                              size="icon-sm"
                              onClick={() => setViewLicense(license)}
                              title="مشاهده جزئیات"
                              className="h-8 w-8"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
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

    </AdminLayout>
  );
}

