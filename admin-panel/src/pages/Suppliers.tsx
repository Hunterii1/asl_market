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
  Truck, 
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  Truck as TruckIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Star,
  Package,
  Mail,
  Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { AddSupplierDialog } from '@/components/suppliers/AddSupplierDialog';
import { EditSupplierDialog } from '@/components/suppliers/EditSupplierDialog';
import { ViewSupplierDialog } from '@/components/suppliers/ViewSupplierDialog';
import { DeleteSupplierDialog } from '@/components/suppliers/DeleteSupplierDialog';
import { SuppliersFilters } from '@/components/suppliers/SuppliersFilters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Supplier {
  id: string;
  name: string;
  companyName?: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  website?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  category?: 'electronics' | 'clothing' | 'food' | 'books' | 'furniture' | 'automotive' | 'other';
  status: 'active' | 'inactive' | 'suspended';
  rating?: number;
  notes?: string;
  totalOrders: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

// داده‌های اولیه
const initialSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'شرکت فناوری اطلاعات',
    companyName: 'IT Solutions Co.',
    email: 'info@itsolutions.com',
    phone: '۰۲۱-۸۸۸۸۸۸۸۸',
    address: 'تهران، خیابان ولیعصر، پلاک ۱۲۳',
    city: 'تهران',
    country: 'ایران',
    postalCode: '1234567890',
    taxId: '123456789',
    website: 'https://itsolutions.com',
    contactPerson: 'علی احمدی',
    contactPhone: '۰۹۱۲۳۴۵۶۷۸۹',
    contactEmail: 'ali@itsolutions.com',
    category: 'electronics',
    status: 'active',
    rating: 4.5,
    notes: 'تامین‌کننده معتبر و قابل اعتماد',
    totalOrders: 125,
    totalAmount: 50000000,
    createdAt: '۱۴۰۳/۰۹/۱۵',
    updatedAt: '۱۴۰۳/۰۹/۲۰',
  },
  {
    id: '2',
    name: 'فروشگاه پوشاک مد',
    companyName: 'Fashion Store',
    email: 'contact@fashionstore.com',
    phone: '۰۲۱-۷۷۷۷۷۷۷۷',
    address: 'تهران، میدان ونک، برج تجاری',
    city: 'تهران',
    country: 'ایران',
    category: 'clothing',
    status: 'active',
    rating: 4.2,
    totalOrders: 89,
    totalAmount: 35000000,
    createdAt: '۱۴۰۳/۰۹/۱۴',
    updatedAt: '۱۴۰۳/۰۹/۱۹',
  },
  {
    id: '3',
    name: 'رستوران سنتی',
    companyName: 'Traditional Restaurant',
    phone: '۰۲۱-۶۶۶۶۶۶۶۶',
    address: 'اصفهان، خیابان چهارباغ',
    city: 'اصفهان',
    country: 'ایران',
    category: 'food',
    status: 'inactive',
    rating: 3.8,
    totalOrders: 45,
    totalAmount: 15000000,
    createdAt: '۱۴۰۳/۰۹/۱۰',
    updatedAt: '۱۴۰۳/۰۹/۱۸',
  },
  {
    id: '4',
    name: 'کتابفروشی آنلاین',
    companyName: 'Online Bookstore',
    email: 'info@bookstore.com',
    phone: '۰۲۱-۵۵۵۵۵۵۵۵',
    category: 'books',
    status: 'active',
    rating: 4.7,
    totalOrders: 234,
    totalAmount: 89000000,
    createdAt: '۱۴۰۳/۰۹/۱۲',
    updatedAt: '۱۴۰۳/۰۹/۱۷',
  },
  {
    id: '5',
    name: 'فروشگاه مبلمان',
    companyName: 'Furniture Store',
    phone: '۰۲۱-۴۴۴۴۴۴۴۴',
    address: 'تهران، خیابان آزادی',
    city: 'تهران',
    country: 'ایران',
    category: 'furniture',
    status: 'suspended',
    rating: 2.5,
    notes: 'مشکلات در تحویل به موقع',
    totalOrders: 12,
    totalAmount: 5000000,
    createdAt: '۱۴۰۳/۰۹/۰۸',
    updatedAt: '۱۴۰۳/۰۹/۱۵',
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
    label: 'معلق',
    className: 'bg-warning/10 text-warning',
    icon: AlertCircle,
  },
};

const categoryConfig = {
  electronics: { label: 'الکترونیک', className: 'bg-primary/10 text-primary' },
  clothing: { label: 'پوشاک', className: 'bg-info/10 text-info' },
  food: { label: 'غذا', className: 'bg-success/10 text-success' },
  books: { label: 'کتاب', className: 'bg-warning/10 text-warning' },
  furniture: { label: 'مبلمان', className: 'bg-muted text-muted-foreground' },
  automotive: { label: 'خودرو', className: 'bg-destructive/10 text-destructive' },
  other: { label: 'سایر', className: 'bg-muted text-muted-foreground' },
};

type SortField = 'name' | 'category' | 'status' | 'totalOrders' | 'rating' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function Suppliers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [deleteSupplier, setDeleteSupplier] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<('active' | 'inactive' | 'suspended')[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<('electronics' | 'clothing' | 'food' | 'books' | 'furniture' | 'automotive' | 'other')[]>([]);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Helper function to reload suppliers
  const reloadSuppliers = async () => {
    try {
      setLoading(true);
      const statusFilterValue = statusFilter.length === 1 
        ? statusFilter[0] === 'active' ? 'approved' 
          : statusFilter[0] === 'inactive' ? 'pending' 
          : statusFilter[0] === 'suspended' ? 'rejected' 
          : 'all'
        : 'all';

      const response = await adminApi.getSuppliers({
        page: currentPage,
        per_page: itemsPerPage,
        status: statusFilterValue,
        search: searchQuery || undefined,
      });

      // Response structure: { suppliers: [...], total: ..., page: ..., per_page: ..., total_pages: ... }
      const suppliersData = response.suppliers || [];
      const transformedSuppliers: Supplier[] = suppliersData.map((s: any) => ({
        id: s.id?.toString() || '',
        name: s.full_name || 'بدون نام',
        companyName: s.brand_name || '',
        email: s.user?.email || '',
        phone: s.mobile || '',
        address: s.address || '',
        city: s.city || '',
        status: s.status === 'approved' ? 'active' : s.status === 'pending' ? 'inactive' : 'suspended',
        rating: s.average_rating || 0,
        notes: s.admin_notes || '',
        totalOrders: 0,
        totalAmount: 0,
        createdAt: s.created_at || new Date().toISOString(),
        updatedAt: s.updated_at || new Date().toISOString(),
      }));

      setSuppliers(transformedSuppliers);
      setTotalSuppliers(response.total || 0);
      setTotalPages(response.total_pages || 1);
    } catch (error: any) {
      console.error('Error loading suppliers:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در بارگذاری تأمین‌کنندگان',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load suppliers from API
  useEffect(() => {
    reloadSuppliers();
  }, [currentPage, itemsPerPage, statusFilter, searchQuery]);

  // Use suppliers directly from API (already filtered and paginated)
  const paginatedSuppliers = suppliers;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleSupplierAdded = () => {
    const stored = localStorage.getItem('asll-suppliers');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSuppliers(parsed);
      } catch {}
    }
  };

  const toggleSelectSupplier = (supplierId: string) => {
    setSelectedSuppliers(prev =>
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
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

  const handleApproveSupplier = async (supplierId: string, notes?: string) => {
    try {
      await adminApi.approveSupplier(parseInt(supplierId), { admin_notes: notes });
      toast({
        title: 'موفقیت',
        description: 'تأمین‌کننده با موفقیت تأیید شد.',
      });
      await reloadSuppliers();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در تأیید تأمین‌کننده',
        variant: 'destructive',
      });
    }
  };

  const handleRejectSupplier = async (supplierId: string, notes: string) => {
    try {
      await adminApi.rejectSupplier(parseInt(supplierId), { admin_notes: notes });
      toast({
        title: 'موفقیت',
        description: 'تأمین‌کننده با موفقیت رد شد.',
      });
      await reloadSuppliers();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در رد تأمین‌کننده',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSupplier = async () => {
    if (!deleteSupplier) return;
    
    setIsDeleting(true);
    try {
      await adminApi.deleteSupplier(parseInt(deleteSupplier.id));
      setDeleteSupplier(null);
      toast({
        title: 'موفقیت',
        description: 'تامین‌کننده با موفقیت حذف شد.',
      });
      await reloadSuppliers();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در حذف تامین‌کننده',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'suspend' | 'delete') => {
    if (selectedSuppliers.length === 0) return;

    try {
      for (const supplierId of selectedSuppliers) {
        const supplier = suppliers.find(s => s.id === supplierId);
        if (supplier) {
          if (action === 'activate') {
            await adminApi.approveSupplier(parseInt(supplierId), {});
          } else if (action === 'suspend') {
            await adminApi.rejectSupplier(parseInt(supplierId), { admin_notes: 'مسدود شده توسط ادمین' });
          } else if (action === 'delete') {
            await adminApi.deleteSupplier(parseInt(supplierId));
          }
        }
      }

      setSelectedSuppliers([]);
      await reloadSuppliers();
      
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
    setCategoryFilter([]);
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
            <h1 className="text-xl md:text-2xl font-bold text-foreground">مدیریت تامین‌کنندگان</h1>
            <p className="text-sm md:text-base text-muted-foreground">لیست تمامی تامین‌کنندگان سیستم</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={() => setIsAddDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 md:ml-2" />
              <span className="hidden sm:inline">تامین‌کننده جدید</span>
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
                <SuppliersFilters
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  categoryFilter={categoryFilter}
                  onCategoryFilterChange={setCategoryFilter}
                  onReset={handleResetFilters}
                />
              </div>
              {(statusFilter.length > 0 || categoryFilter.length > 0) && (
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
        {selectedSuppliers.length > 0 && (
          <Card className="border-primary/50 bg-primary/5 animate-scale-in">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <span className="text-sm text-foreground font-medium">
                  {selectedSuppliers.length} تامین‌کننده انتخاب شده
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkAction('activate')}
                    className="text-success hover:bg-success/10 flex-1 md:flex-initial"
                  >
                    <CheckCircle className="w-4 h-4 md:ml-2" />
                    <span className="hidden sm:inline">فعال کردن</span>
                    <span className="sm:hidden">فعال</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkAction('deactivate')}
                    className="text-muted-foreground hover:bg-muted flex-1 md:flex-initial"
                  >
                    <XCircle className="w-4 h-4 md:ml-2" />
                    <span className="hidden sm:inline">غیرفعال کردن</span>
                    <span className="sm:hidden">غیرفعال</span>
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
                      if (confirm(`آیا از حذف ${selectedSuppliers.length} تامین‌کننده اطمینان دارید؟`)) {
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

        {/* Suppliers Table */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">لیست تامین‌کنندگان ({totalSuppliers})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : paginatedSuppliers.length === 0 ? (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <TruckIcon className="w-12 h-12 text-muted-foreground" />
                  <p className="text-muted-foreground">هیچ تامین‌کننده‌ای یافت نشد</p>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground w-12">
                        <input
                          type="checkbox"
                          checked={selectedSuppliers.length === paginatedSuppliers.length && paginatedSuppliers.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSuppliers(paginatedSuppliers.map(s => s.id));
                            } else {
                              setSelectedSuppliers([]);
                            }
                          }}
                          className="w-4 h-4 rounded border-border"
                        />
                      </th>
                      <th className="p-4 text-right">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          نام
                          {getSortIcon('name')}
                        </button>
                      </th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">اطلاعات تماس</th>
                      <th className="p-4 text-right">
                        <button
                          onClick={() => handleSort('category')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          دسته‌بندی
                          {getSortIcon('category')}
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
                          onClick={() => handleSort('totalOrders')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          سفارشات
                          {getSortIcon('totalOrders')}
                        </button>
                      </th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSuppliers.map((supplier, index) => {
                      const StatusIcon = statusConfig[supplier.status].icon;
                      return (
                        <tr
                          key={supplier.id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors animate-fade-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedSuppliers.includes(supplier.id)}
                              onChange={() => toggleSelectSupplier(supplier.id)}
                              className="w-4 h-4 rounded border-border"
                            />
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-foreground">{supplier.name}</p>
                              {supplier.companyName && (
                                <p className="text-xs text-muted-foreground">{supplier.companyName}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              {supplier.phone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-foreground">{supplier.phone}</span>
                                </div>
                              )}
                              {supplier.email && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-foreground">{supplier.email}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            {supplier.category && (
                              <Badge
                                variant="outline"
                                className={cn('border-2', categoryConfig[supplier.category].className)}
                              >
                                {categoryConfig[supplier.category].label}
                              </Badge>
                            )}
                          </td>
                          <td className="p-4">
                            <Badge
                              variant="outline"
                              className={cn('border-2', statusConfig[supplier.status].className)}
                            >
                              <StatusIcon className="w-3 h-3 ml-1" />
                              {statusConfig[supplier.status].label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Package className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">
                                {supplier.totalOrders.toLocaleString('fa-IR')}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setViewSupplier(supplier)}
                                title="مشاهده"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {supplier.status === 'inactive' && (
                                <Button 
                                  variant="ghost" 
                                  size="icon-sm"
                                  className="text-success hover:bg-success/10"
                                  onClick={() => handleApproveSupplier(supplier.id)}
                                  title="تأیید"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              {supplier.status === 'inactive' && (
                                <Button 
                                  variant="ghost" 
                                  size="icon-sm"
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => handleRejectSupplier(supplier.id, 'رد شده توسط ادمین')}
                                  title="رد"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setEditSupplier(supplier)}
                                title="ویرایش"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon-sm" 
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteSupplier(supplier)}
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

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 p-4">
                {paginatedSuppliers.map((supplier, index) => {
                  const StatusIcon = statusConfig[supplier.status].icon;
                  return (
                    <Card
                      key={supplier.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={selectedSuppliers.includes(supplier.id)}
                              onChange={() => toggleSelectSupplier(supplier.id)}
                              className="w-4 h-4 rounded border-border mt-1 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{supplier.name}</p>
                              {supplier.companyName && (
                                <p className="text-xs text-muted-foreground truncate">{supplier.companyName}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button 
                              variant="ghost" 
                              size="icon-sm"
                              onClick={() => setViewSupplier(supplier)}
                              title="مشاهده"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon-sm"
                              onClick={() => setEditSupplier(supplier)}
                              title="ویرایش"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon-sm" 
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteSupplier(supplier)}
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2 border-t border-border pt-3">
                          {supplier.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-foreground">{supplier.phone}</span>
                            </div>
                          )}
                          {supplier.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-foreground truncate">{supplier.email}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <Badge
                              variant="outline"
                              className={cn('border-2', statusConfig[supplier.status].className)}
                            >
                              <StatusIcon className="w-3 h-3 ml-1" />
                              {statusConfig[supplier.status].label}
                            </Badge>
                            {supplier.category && (
                              <Badge
                                variant="outline"
                                className={cn('border-2', categoryConfig[supplier.category].className)}
                              >
                                {categoryConfig[supplier.category].label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
            )}

            {/* Pagination */}
            {!loading && (
            <div className="flex flex-col gap-4 p-3 md:p-4 border-t border-border">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs md:text-sm text-muted-foreground text-center sm:text-right">
                  نمایش {((currentPage - 1) * itemsPerPage) + 1} تا {Math.min(currentPage * itemsPerPage, totalSuppliers)} از {totalSuppliers} تامین‌کننده
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

      {/* Dialog افزودن تامین‌کننده */}
      <AddSupplierDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleSupplierAdded}
      />

      {/* Dialog مشاهده تامین‌کننده */}
      <ViewSupplierDialog
        open={!!viewSupplier}
        onOpenChange={(open) => !open && setViewSupplier(null)}
        supplier={viewSupplier}
      />

      {/* Dialog ویرایش تامین‌کننده */}
      <EditSupplierDialog
        open={!!editSupplier}
        onOpenChange={(open) => !open && setEditSupplier(null)}
        supplier={editSupplier}
        onSuccess={async () => {
          setEditSupplier(null);
          await reloadSuppliers();
        }}
      />

      {/* Dialog حذف تامین‌کننده */}
      <DeleteSupplierDialog
        open={!!deleteSupplier}
        onOpenChange={(open) => !open && setDeleteSupplier(null)}
        supplier={deleteSupplier}
        onConfirm={handleDeleteSupplier}
        isDeleting={isDeleting}
      />
    </AdminLayout>
  );
}

