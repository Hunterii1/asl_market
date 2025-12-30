import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi } from '@/lib/api/adminApi';
import { Loader2 } from 'lucide-react';
import { 
  Search, 
  Wallet, 
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  Wallet as WalletIcon,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { AddWithdrawalDialog } from '@/components/withdrawals/AddWithdrawalDialog';
import { EditWithdrawalDialog } from '@/components/withdrawals/EditWithdrawalDialog';
import { ViewWithdrawalDialog } from '@/components/withdrawals/ViewWithdrawalDialog';
import { DeleteWithdrawalDialog } from '@/components/withdrawals/DeleteWithdrawalDialog';
import { WithdrawalsFilters } from '@/components/withdrawals/WithdrawalsFilters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Withdrawal {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  method: 'bank_transfer' | 'card' | 'wallet' | 'crypto';
  accountInfo: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled';
  description?: string;
  requestedAt?: string;
  createdAt: string;
  processedAt?: string | null;
  processedBy?: string | null;
}

// داده‌های اولیه
const initialWithdrawals: Withdrawal[] = [
  {
    id: '1',
    userId: '1',
    userName: 'علی محمدی',
    amount: 500000,
    method: 'bank_transfer',
    accountInfo: '6037-****-****-1234',
    status: 'pending',
    description: 'برداشت برای خرید محصول',
    requestedAt: '۱۴۰۳/۰۹/۲۰',
    createdAt: '۱۴۰۳/۰۹/۲۰',
    processedAt: null,
    processedBy: null,
  },
  {
    id: '2',
    userId: '2',
    userName: 'مریم حسینی',
    amount: 1200000,
    method: 'card',
    accountInfo: '6219-****-****-5678',
    status: 'processing',
    description: '',
    requestedAt: '۱۴۰۳/۰۹/۱۹',
    createdAt: '۱۴۰۳/۰۹/۱۹',
    processedAt: null,
    processedBy: null,
  },
  {
    id: '3',
    userId: '3',
    userName: 'رضا کریمی',
    amount: 2500000,
    method: 'wallet',
    accountInfo: 'wallet_address_123456',
    status: 'completed',
    description: 'برداشت موفق',
    requestedAt: '۱۴۰۳/۰۹/۱۸',
    createdAt: '۱۴۰۳/۰۹/۱۸',
    processedAt: '۱۴۰۳/۰۹/۱۸',
    processedBy: 'مدیر سیستم',
  },
  {
    id: '4',
    userId: '4',
    userName: 'سارا احمدی',
    amount: 800000,
    method: 'bank_transfer',
    accountInfo: 'IR12-3456-7890-1234-5678-9012-34',
    status: 'rejected',
    description: 'اطلاعات حساب ناقص',
    requestedAt: '۱۴۰۳/۰۹/۱۷',
    createdAt: '۱۴۰۳/۰۹/۱۷',
    processedAt: '۱۴۰۳/۰۹/۱۷',
    processedBy: 'مدیر سیستم',
  },
  {
    id: '5',
    userId: '5',
    userName: 'محمد نوری',
    amount: 300000,
    method: 'crypto',
    accountInfo: '0x1234567890abcdef',
    status: 'cancelled',
    description: 'لغو شده توسط کاربر',
    requestedAt: '۱۴۰۳/۰۹/۱۶',
    createdAt: '۱۴۰۳/۰۹/۱۶',
    processedAt: null,
    processedBy: null,
  },
];

const statusConfig = {
  pending: {
    label: 'در انتظار',
    className: 'bg-warning/10 text-warning',
    icon: Clock,
  },
  processing: {
    label: 'در حال پردازش',
    className: 'bg-info/10 text-info',
    icon: AlertCircle,
  },
  completed: {
    label: 'تکمیل شده',
    className: 'bg-success/10 text-success',
    icon: CheckCircle,
  },
  rejected: {
    label: 'رد شده',
    className: 'bg-destructive/10 text-destructive',
    icon: XCircle,
  },
  cancelled: {
    label: 'لغو شده',
    className: 'bg-muted text-muted-foreground',
    icon: XCircle,
  },
};

const methodConfig = {
  bank_transfer: {
    label: 'انتقال بانکی',
    className: 'bg-primary/10 text-primary',
  },
  card: {
    label: 'کارت به کارت',
    className: 'bg-info/10 text-info',
  },
  wallet: {
    label: 'کیف پول',
    className: 'bg-success/10 text-success',
  },
  crypto: {
    label: 'ارز دیجیتال',
    className: 'bg-warning/10 text-warning',
  },
};

type SortField = 'userName' | 'amount' | 'status' | 'method' | 'createdAt';
type SortOrder = 'asc' | 'desc';

// Helper function to transform withdrawal data from API
const transformWithdrawal = (w: any): Withdrawal => {
  const validStatuses: Withdrawal['status'][] = ['pending', 'processing', 'completed', 'rejected', 'cancelled'];
  const validMethods: Withdrawal['method'][] = ['bank_transfer', 'card', 'wallet', 'crypto'];
  const status = validStatuses.includes(w.status) ? w.status : 'pending';
  const method = validMethods.includes(w.method) ? w.method : 'bank_transfer';
  
  return {
    id: w.id?.toString() || w.ID?.toString() || '',
    userId: w.user_id?.toString() || w.userID?.toString() || '',
    userName: w.user ? `${w.user.first_name || ''} ${w.user.last_name || ''}`.trim() : 'بدون نام',
    amount: w.amount || 0,
    method,
    accountInfo: w.bank_card_number || w.sheba_number || w.account_info || w.accountInfo || '',
    status,
    description: w.admin_notes || w.description || '',
    requestedAt: w.requested_at ? new Date(w.requested_at).toLocaleDateString('fa-IR') : (w.created_at ? new Date(w.created_at).toLocaleDateString('fa-IR') : ''),
    createdAt: w.created_at ? new Date(w.created_at).toLocaleDateString('fa-IR') : new Date().toLocaleDateString('fa-IR'),
    processedAt: w.completed_at || w.approved_at || null,
    processedBy: w.admin?.name || w.processed_by || null,
  };
};

export default function Withdrawals() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWithdrawals, setSelectedWithdrawals] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewWithdrawal, setViewWithdrawal] = useState<Withdrawal | null>(null);
  const [editWithdrawal, setEditWithdrawal] = useState<Withdrawal | null>(null);
  const [deleteWithdrawal, setDeleteWithdrawal] = useState<Withdrawal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<('pending' | 'processing' | 'completed' | 'rejected' | 'cancelled')[]>([]);
  const [methodFilter, setMethodFilter] = useState<('bank_transfer' | 'card' | 'wallet' | 'crypto')[]>([]);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Load withdrawals from API
  useEffect(() => {
    const loadWithdrawals = async () => {
      try {
        setLoading(true);
        const statusFilterValue = statusFilter.length === 1 ? statusFilter[0] : 'all';

        const response = await adminApi.getWithdrawals({
          page: currentPage,
          per_page: itemsPerPage,
          status: statusFilterValue !== 'all' ? statusFilterValue : undefined,
          search: searchQuery || undefined,
        });

        if (response) {
          // Backend returns: { requests: [...], total: 168, per_page: 10, total_pages: 17 }
          const withdrawalsData = response.requests || response.data?.requests || [];
          const transformedWithdrawals: Withdrawal[] = withdrawalsData.map(transformWithdrawal);

          setWithdrawals(transformedWithdrawals);
          
          // Get total count
          const total = response.total || response.data?.total || 0;
          setTotalWithdrawals(total);
          
          // Use total_pages from backend if available, otherwise calculate it
          const totalPagesFromBackend = response.total_pages || response.data?.total_pages;
          if (totalPagesFromBackend) {
            setTotalPages(totalPagesFromBackend);
          } else {
            // Fallback: calculate from total and per_page
            const perPage = response.per_page || response.data?.per_page || itemsPerPage;
            const totalPagesCalc = perPage > 0 ? Math.ceil(total / perPage) : 1;
            setTotalPages(totalPagesCalc);
          }
        }
      } catch (error: any) {
        console.error('Error loading withdrawals:', error);
        toast({
          title: 'خطا',
          description: error.message || 'خطا در بارگذاری درخواست‌های برداشت',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadWithdrawals();
  }, [currentPage, itemsPerPage, statusFilter, searchQuery]);

  // Use withdrawals directly from API (already filtered and paginated)
  const paginatedWithdrawals = withdrawals;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleWithdrawalAdded = () => {
    const stored = localStorage.getItem('asll-withdrawals');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setWithdrawals(parsed);
      } catch {}
    }
  };

  const toggleSelectAll = () => {
    if (selectedWithdrawals.length === paginatedWithdrawals.length) {
      setSelectedWithdrawals([]);
    } else {
      setSelectedWithdrawals(paginatedWithdrawals.map(w => w.id));
    }
  };

  const toggleSelectWithdrawal = (withdrawalId: string) => {
    setSelectedWithdrawals(prev =>
      prev.includes(withdrawalId)
        ? prev.filter(id => id !== withdrawalId)
        : [...prev, withdrawalId]
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

  const handleApproveWithdrawal = async (withdrawalId: string, receiptUrl?: string) => {
    try {
      await adminApi.approveWithdrawal(parseInt(withdrawalId), { receipt_url: receiptUrl, admin_notes: '' });
      toast({
        title: 'موفقیت',
        description: 'درخواست برداشت با موفقیت تأیید شد.',
      });
      // Reload withdrawals
      const response = await adminApi.getWithdrawals({
        page: currentPage,
        per_page: itemsPerPage,
        status: statusFilter.length === 1 ? statusFilter[0] : undefined,
        search: searchQuery || undefined,
      });
      if (response && (response.data || response.withdrawals)) {
        const withdrawalsData = response.data?.withdrawals || response.withdrawals || response.requests || [];
        const transformedWithdrawals: Withdrawal[] = withdrawalsData.map(transformWithdrawal);
        setWithdrawals(transformedWithdrawals);
      }
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در تأیید درخواست برداشت',
        variant: 'destructive',
      });
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: string, reason: string) => {
    try {
      await adminApi.rejectWithdrawal(parseInt(withdrawalId), { admin_notes: reason });
      toast({
        title: 'موفقیت',
        description: 'درخواست برداشت با موفقیت رد شد.',
      });
      // Reload withdrawals
      const response = await adminApi.getWithdrawals({
        page: currentPage,
        per_page: itemsPerPage,
        status: statusFilter.length === 1 ? statusFilter[0] : undefined,
        search: searchQuery || undefined,
      });
      if (response && (response.data || response.withdrawals)) {
        const withdrawalsData = response.data?.withdrawals || response.withdrawals || response.requests || [];
        const transformedWithdrawals: Withdrawal[] = withdrawalsData.map(transformWithdrawal);
        setWithdrawals(transformedWithdrawals);
      }
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در رد درخواست برداشت',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteWithdrawal = async () => {
    if (!deleteWithdrawal) return;
    
    setIsDeleting(true);
    try {
      await adminApi.deleteWithdrawal(parseInt(deleteWithdrawal.id));
      
      setWithdrawals(prev => prev.filter(w => w.id !== deleteWithdrawal.id));
      setSelectedWithdrawals(prev => prev.filter(id => id !== deleteWithdrawal.id));
      setDeleteWithdrawal(null);
      setTotalWithdrawals(prev => prev - 1);
      
      toast({
        title: 'موفقیت',
        description: 'درخواست برداشت با موفقیت حذف شد.',
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در حذف درخواست برداشت',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedWithdrawals.length === 0) return;

    try {
      for (const withdrawalId of selectedWithdrawals) {
        if (action === 'approve') {
          await adminApi.approveWithdrawal(parseInt(withdrawalId), {});
        } else if (action === 'reject') {
          await adminApi.rejectWithdrawal(parseInt(withdrawalId), { admin_notes: 'رد شده توسط ادمین' });
        }
      }

      // Reload withdrawals
      const response = await adminApi.getWithdrawals({
        page: currentPage,
        per_page: itemsPerPage,
        status: statusFilter.length === 1 ? statusFilter[0] : undefined,
        search: searchQuery || undefined,
      });
      if (response && (response.data || response.withdrawals)) {
        const withdrawalsData = response.data?.withdrawals || response.withdrawals || response.requests || [];
        const transformedWithdrawals: Withdrawal[] = withdrawalsData.map(transformWithdrawal);
        setWithdrawals(transformedWithdrawals);
      }

      setSelectedWithdrawals([]);
      
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
    setMethodFilter([]);
    setMinAmount('');
    setMaxAmount('');
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
            <h1 className="text-xl md:text-2xl font-bold text-foreground">مدیریت برداشت‌ها</h1>
            <p className="text-sm md:text-base text-muted-foreground">لیست تمامی درخواست‌های برداشت</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={() => setIsAddDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 md:ml-2" />
              <span className="hidden sm:inline">درخواست جدید</span>
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
              <WithdrawalsFilters
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                methodFilter={methodFilter}
                onMethodFilterChange={setMethodFilter}
                minAmount={minAmount}
                onMinAmountChange={setMinAmount}
                maxAmount={maxAmount}
                onMaxAmountChange={setMaxAmount}
                onReset={handleResetFilters}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedWithdrawals.length > 0 && (
          <Card className="border-primary/50 bg-primary/5 animate-scale-in">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <span className="text-sm text-foreground font-medium">
                  {selectedWithdrawals.length} درخواست انتخاب شده
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkAction('approve')}
                    className="text-success hover:bg-success/10 flex-1 md:flex-initial"
                  >
                    <CheckCircle className="w-4 h-4 md:ml-2" />
                    <span className="hidden sm:inline">تایید</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkAction('reject')}
                    className="text-destructive hover:bg-destructive/10 flex-1 md:flex-initial"
                  >
                    <XCircle className="w-4 h-4 md:ml-2" />
                    <span className="hidden sm:inline">رد</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (confirm(`آیا از حذف ${selectedWithdrawals.length} درخواست اطمینان دارید؟`)) {
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

        {/* Withdrawals Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">لیست درخواست‌ها ({totalWithdrawals})</CardTitle>
              {(statusFilter.length > 0 || methodFilter.length > 0 || minAmount || maxAmount) && (
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
                        checked={selectedWithdrawals.length === paginatedWithdrawals.length && paginatedWithdrawals.length > 0}
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
                    <th className="p-4 text-right">
                      <button
                        onClick={() => handleSort('amount')}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        مبلغ
                        {getSortIcon('amount')}
                      </button>
                    </th>
                    <th className="p-4 text-right">
                      <button
                        onClick={() => handleSort('method')}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        روش
                        {getSortIcon('method')}
                      </button>
                    </th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">حساب</th>
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
                        تاریخ
                        {getSortIcon('createdAt')}
                      </button>
                    </th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedWithdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <WalletIcon className="w-12 h-12 text-muted-foreground" />
                          <p className="text-muted-foreground">هیچ درخواست برداشتی یافت نشد</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedWithdrawals.map((withdrawal, index) => {
                      const withdrawalStatus = withdrawal.status || 'pending';
                      const withdrawalMethod = withdrawal.method || 'bank_transfer';
                      const statusInfo = statusConfig[withdrawalStatus as keyof typeof statusConfig] || statusConfig.pending;
                      const methodInfo = methodConfig[withdrawalMethod as keyof typeof methodConfig] || methodConfig.bank_transfer;
                      const StatusIcon = statusInfo.icon;
                      return (
                        <tr
                          key={withdrawal.id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors animate-fade-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedWithdrawals.includes(withdrawal.id)}
                              onChange={() => toggleSelectWithdrawal(withdrawal.id)}
                              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                            />
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-foreground">{withdrawal.userName}</p>
                              <p className="text-xs text-muted-foreground">#{withdrawal.id}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-medium text-foreground">
                              {withdrawal.amount.toLocaleString('fa-IR')} تومان
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                'px-3 py-1 rounded-full text-xs font-medium',
                                methodInfo.className
                              )}
                            >
                              {methodInfo.label}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-muted-foreground font-mono">
                              {withdrawal.accountInfo}
                            </p>
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit',
                                statusInfo.className
                              )}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {withdrawal.requestedAt || withdrawal.createdAt}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setViewWithdrawal(withdrawal)}
                                title="مشاهده جزئیات"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {withdrawal.status === 'pending' && (
                                <Button 
                                  variant="ghost" 
                                  size="icon-sm"
                                  className="text-success hover:bg-success/10"
                                  onClick={() => handleApproveWithdrawal(withdrawal.id)}
                                  title="تأیید"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              {withdrawal.status === 'pending' && (
                                <Button 
                                  variant="ghost" 
                                  size="icon-sm"
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => handleRejectWithdrawal(withdrawal.id, 'رد شده توسط ادمین')}
                                  title="رد"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setEditWithdrawal(withdrawal)}
                                title="ویرایش"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon-sm" 
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteWithdrawal(withdrawal)}
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
                  نمایش {((currentPage - 1) * itemsPerPage) + 1} تا {Math.min(currentPage * itemsPerPage, totalWithdrawals)} از {totalWithdrawals} درخواست
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

      {/* Dialog افزودن درخواست */}
      <AddWithdrawalDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleWithdrawalAdded}
      />

      {/* Dialog مشاهده درخواست */}
      <ViewWithdrawalDialog
        open={!!viewWithdrawal}
        onOpenChange={(open) => !open && setViewWithdrawal(null)}
        withdrawal={viewWithdrawal}
      />

      {/* Dialog ویرایش درخواست */}
      <EditWithdrawalDialog
        open={!!editWithdrawal}
        onOpenChange={(open) => !open && setEditWithdrawal(null)}
        withdrawal={editWithdrawal}
        onSuccess={() => {
          const stored = localStorage.getItem('asll-withdrawals');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setWithdrawals(parsed);
            } catch {}
          }
          setEditWithdrawal(null);
        }}
      />

      {/* Dialog حذف درخواست */}
      <DeleteWithdrawalDialog
        open={!!deleteWithdrawal}
        onOpenChange={(open) => !open && setDeleteWithdrawal(null)}
        withdrawal={deleteWithdrawal}
        onConfirm={handleDeleteWithdrawal}
        isDeleting={isDeleting}
      />
    </AdminLayout>
  );
}

