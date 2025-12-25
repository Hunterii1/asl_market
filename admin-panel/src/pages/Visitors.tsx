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
  Eye, 
  Plus,
  Trash2,
  X,
  XCircle,
  CheckCircle,
  Eye as EyeIcon,
  Monitor,
  Smartphone,
  Tablet,
  Bot,
  Globe,
  MapPin,
  Clock,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { AddVisitorDialog } from '@/components/visitors/AddVisitorDialog';
import { ViewVisitorDialog } from '@/components/visitors/ViewVisitorDialog';
import { DeleteVisitorDialog } from '@/components/visitors/DeleteVisitorDialog';
import { VisitorsFilters } from '@/components/visitors/VisitorsFilters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Visitor {
  id: string;
  user_id?: number;
  full_name?: string;
  mobile?: string;
  email?: string;
  city_province?: string;
  destination_cities?: string;
  national_id?: string;
  status?: 'pending' | 'approved' | 'rejected';
  is_featured?: boolean;
  average_rating?: number;
  created_at?: string;
  createdAt: string;
  // Legacy fields for compatibility
  ip?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: 'desktop' | 'mobile' | 'tablet' | 'other';
  country?: string;
  city?: string;
  page?: string;
  referrer?: string;
  sessionId?: string;
  duration?: number;
  isBot?: boolean;
  language?: string;
  visitedAt?: string;
}

// داده‌های اولیه
const initialVisitors: Visitor[] = [
  {
    id: '1',
    ip: '192.168.1.100',
    browser: 'Chrome',
    os: 'Windows',
    device: 'desktop',
    country: 'ایران',
    city: 'تهران',
    page: '/products',
    referrer: 'https://google.com',
    duration: 120,
    isBot: false,
    language: 'fa',
    visitedAt: '۱۴۰۳/۰۹/۲۰ - ۱۴:۳۰:۲۵',
    createdAt: '۱۴۰۳/۰۹/۲۰',
  },
  {
    id: '2',
    ip: '192.168.1.101',
    browser: 'Safari',
    os: 'iOS',
    device: 'mobile',
    country: 'ایران',
    city: 'اصفهان',
    page: '/',
    duration: 45,
    isBot: false,
    language: 'fa',
    visitedAt: '۱۴۰۳/۰۹/۲۰ - ۱۴:۲۵:۱۰',
    createdAt: '۱۴۰۳/۰۹/۲۰',
  },
  {
    id: '3',
    ip: '192.168.1.102',
    browser: 'Firefox',
    os: 'Linux',
    device: 'desktop',
    country: 'ایران',
    city: 'مشهد',
    page: '/education',
    referrer: 'https://example.com',
    duration: 300,
    isBot: false,
    language: 'fa',
    visitedAt: '۱۴۰۳/۰۹/۲۰ - ۱۴:۲۰:۰۰',
    createdAt: '۱۴۰۳/۰۹/۲۰',
  },
  {
    id: '4',
    ip: '66.249.64.1',
    userAgent: 'Googlebot/2.1',
    browser: 'Googlebot',
    os: 'Unknown',
    device: 'other',
    country: 'ایالات متحده',
    city: 'Mountain View',
    page: '/',
    duration: 0,
    isBot: true,
    language: 'en',
    visitedAt: '۱۴۰۳/۰۹/۲۰ - ۱۴:۱۵:۰۰',
    createdAt: '۱۴۰۳/۰۹/۲۰',
  },
  {
    id: '5',
    ip: '192.168.1.103',
    browser: 'Edge',
    os: 'Windows',
    device: 'tablet',
    country: 'ایران',
    city: 'شیراز',
    page: '/users',
    duration: 180,
    isBot: false,
    language: 'fa',
    visitedAt: '۱۴۰۳/۰۹/۲۰ - ۱۴:۱۰:۳۰',
    createdAt: '۱۴۰۳/۰۹/۲۰',
  },
];

const deviceConfig = {
  desktop: {
    label: 'دسکتاپ',
    className: 'bg-primary/10 text-primary',
    icon: Monitor,
  },
  mobile: {
    label: 'موبایل',
    className: 'bg-info/10 text-info',
    icon: Smartphone,
  },
  tablet: {
    label: 'تبلت',
    className: 'bg-success/10 text-success',
    icon: Tablet,
  },
  other: {
    label: 'سایر',
    className: 'bg-muted text-muted-foreground',
    icon: Monitor,
  },
};

const statusConfig = {
  pending: {
    label: 'در انتظار',
    className: 'bg-warning/10 text-warning',
    icon: Clock,
  },
  approved: {
    label: 'تأیید شده',
    className: 'bg-success/10 text-success',
    icon: CheckCircle,
  },
  rejected: {
    label: 'رد شده',
    className: 'bg-destructive/10 text-destructive',
    icon: XCircle,
  },
};

type SortField = 'ip' | 'browser' | 'os' | 'device' | 'country' | 'page' | 'duration' | 'visitedAt' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function Visitors() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVisitors, setSelectedVisitors] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewVisitor, setViewVisitor] = useState<Visitor | null>(null);
  const [deleteVisitor, setDeleteVisitor] = useState<Visitor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deviceFilter, setDeviceFilter] = useState<('desktop' | 'mobile' | 'tablet' | 'other')[]>([]);
  const [isBotFilter, setIsBotFilter] = useState<boolean | null>(null);
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<('active' | 'inactive' | 'suspended')[]>([]);
  const [sortField, setSortField] = useState<SortField>('visitedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Load visitors from API
  useEffect(() => {
    const loadVisitors = async () => {
      try {
        setLoading(true);
        const statusFilterValue = statusFilter.length === 1 
          ? statusFilter[0] === 'active' ? 'approved' 
            : statusFilter[0] === 'inactive' ? 'pending' 
            : statusFilter[0] === 'suspended' ? 'rejected' 
            : 'all'
          : 'all';

        const response = await adminApi.getVisitors({
          page: currentPage,
          per_page: itemsPerPage,
          status: statusFilterValue,
          search: searchQuery || undefined,
        });

        if (response) {
          // Backend returns: { visitors: [...], total: ..., total_pages: ..., page: ..., per_page: ... }
          const visitorsData = response.visitors || [];
          
          const transformedVisitors: Visitor[] = visitorsData.map((v: any) => ({
            id: v.id?.toString() || '',
            user_id: v.user_id,
            full_name: v.full_name || 'بدون نام',
            mobile: v.mobile || '',
            email: v.email || '',
            city_province: v.city_province || '',
            destination_cities: v.destination_cities || '',
            national_id: v.national_id || '',
            status: v.status || 'pending',
            is_featured: v.is_featured || false,
            average_rating: v.average_rating || 0,
            created_at: v.created_at || new Date().toISOString(),
            createdAt: v.created_at ? new Date(v.created_at).toLocaleDateString('fa-IR') : new Date().toLocaleDateString('fa-IR'),
          }));

          setVisitors(transformedVisitors);
          setTotalVisitors(response.total || 0);
          setTotalPages(response.total_pages || 1);
        }
      } catch (error: any) {
        console.error('Error loading visitors:', error);
        toast({
          title: 'خطا',
          description: error.message || 'خطا در بارگذاری ویزیتورها',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadVisitors();
  }, [currentPage, itemsPerPage, statusFilter, searchQuery]);

  // Use visitors directly from API (already filtered and paginated)
  const paginatedVisitors = visitors;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleVisitorAdded = () => {
    const stored = localStorage.getItem('asll-visitors');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setVisitors(parsed);
      } catch {}
    }
  };

  const toggleSelectVisitor = (visitorId: string) => {
    setSelectedVisitors(prev =>
      prev.includes(visitorId)
        ? prev.filter(id => id !== visitorId)
        : [...prev, visitorId]
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

  const handleApproveVisitor = async (visitorId: string, notes?: string) => {
    try {
      await adminApi.approveVisitor(parseInt(visitorId), { admin_notes: notes });
      toast({
        title: 'موفقیت',
        description: 'ویزیتور با موفقیت تأیید شد.',
      });
      // Reload visitors
      const response = await adminApi.getVisitors({
        page: currentPage,
        per_page: itemsPerPage,
        status: statusFilter.length === 1 
          ? statusFilter[0] === 'active' ? 'approved' 
            : statusFilter[0] === 'inactive' ? 'pending' 
            : statusFilter[0] === 'suspended' ? 'rejected' 
            : 'all'
          : 'all',
        search: searchQuery || undefined,
      });
      if (response) {
        const visitorsData = response.visitors || [];
        const transformedVisitors: Visitor[] = visitorsData.map((v: any) => ({
          id: v.id?.toString() || '',
          user_id: v.user_id,
          full_name: v.full_name || 'بدون نام',
          mobile: v.mobile || '',
          email: v.email || '',
          city_province: v.city_province || '',
          destination_cities: v.destination_cities || '',
          national_id: v.national_id || '',
          status: v.status || 'pending',
          is_featured: v.is_featured || false,
          average_rating: v.average_rating || 0,
          created_at: v.created_at || new Date().toISOString(),
          createdAt: v.created_at ? new Date(v.created_at).toLocaleDateString('fa-IR') : new Date().toLocaleDateString('fa-IR'),
        }));
        setVisitors(transformedVisitors);
      }
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در تأیید ویزیتور',
        variant: 'destructive',
      });
    }
  };

  const handleRejectVisitor = async (visitorId: string, notes: string) => {
    try {
      await adminApi.rejectVisitor(parseInt(visitorId), { admin_notes: notes });
      toast({
        title: 'موفقیت',
        description: 'ویزیتور با موفقیت رد شد.',
      });
      // Reload visitors
      const response = await adminApi.getVisitors({
        page: currentPage,
        per_page: itemsPerPage,
        status: statusFilter.length === 1 
          ? statusFilter[0] === 'active' ? 'approved' 
            : statusFilter[0] === 'inactive' ? 'pending' 
            : statusFilter[0] === 'suspended' ? 'rejected' 
            : 'all'
          : 'all',
        search: searchQuery || undefined,
      });
      if (response) {
        const visitorsData = response.visitors || [];
        const transformedVisitors: Visitor[] = visitorsData.map((v: any) => ({
          id: v.id?.toString() || '',
          user_id: v.user_id,
          full_name: v.full_name || 'بدون نام',
          mobile: v.mobile || '',
          email: v.email || '',
          city_province: v.city_province || '',
          destination_cities: v.destination_cities || '',
          national_id: v.national_id || '',
          status: v.status || 'pending',
          is_featured: v.is_featured || false,
          average_rating: v.average_rating || 0,
          created_at: v.created_at || new Date().toISOString(),
          createdAt: v.created_at ? new Date(v.created_at).toLocaleDateString('fa-IR') : new Date().toLocaleDateString('fa-IR'),
        }));
        setVisitors(transformedVisitors);
      }
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در رد ویزیتور',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteVisitor = async () => {
    if (!deleteVisitor) return;
    
    setIsDeleting(true);
    try {
      await adminApi.deleteVisitor(parseInt(deleteVisitor.id));
      
      setVisitors(prev => prev.filter(v => v.id !== deleteVisitor.id));
      setSelectedVisitors(prev => prev.filter(id => id !== deleteVisitor.id));
      setDeleteVisitor(null);
      setTotalVisitors(prev => prev - 1);
      
      toast({
        title: 'موفقیت',
        description: 'ویزیتور با موفقیت حذف شد.',
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در حذف ویزیتور',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkAction = async (action: 'delete') => {
    if (selectedVisitors.length === 0) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (action === 'delete') {
        setVisitors(prev => prev.filter(v => !selectedVisitors.includes(v.id)));
      }

      setSelectedVisitors([]);
      
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
    setDeviceFilter([]);
    setIsBotFilter(null);
    setCountryFilter([]);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">مدیریت ویزیتورها</h1>
            <p className="text-muted-foreground">لیست تمامی ویزیتورهای سیستم</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              ثبت ویزیتور
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="جستجو بر اساس IP، مرورگر، سیستم عامل، کشور، شهر یا صفحه..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pr-10 pl-4 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  />
                </div>
                <VisitorsFilters
                  deviceFilter={deviceFilter}
                  onDeviceFilterChange={setDeviceFilter}
                  isBotFilter={isBotFilter}
                  onIsBotFilterChange={setIsBotFilter}
                  countryFilter={countryFilter}
                  onCountryFilterChange={setCountryFilter}
                  onReset={handleResetFilters}
                />
              </div>
              {(deviceFilter.length > 0 || isBotFilter !== null || countryFilter.length > 0) && (
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
        {selectedVisitors.length > 0 && (
          <Card className="border-primary/50 bg-primary/5 animate-scale-in">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <span className="text-sm text-foreground font-medium">
                  {selectedVisitors.length} ویزیتور انتخاب شده
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (confirm(`آیا از حذف ${selectedVisitors.length} ویزیتور اطمینان دارید؟`)) {
                        handleBulkAction('delete');
                      }
                    }}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Visitors Table */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">لیست ویزیتورها ({totalVisitors})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : paginatedVisitors.length === 0 ? (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <EyeIcon className="w-12 h-12 text-muted-foreground" />
                  <p className="text-muted-foreground">هیچ ویزیتوری یافت نشد</p>
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
                          checked={selectedVisitors.length === paginatedVisitors.length && paginatedVisitors.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVisitors(paginatedVisitors.map(v => v.id));
                            } else {
                              setSelectedVisitors([]);
                            }
                          }}
                          className="w-4 h-4 rounded border-border"
                        />
                      </th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">نام</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">موبایل</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">ایمیل</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">شهر/استان</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">شهرهای مقصد</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">وضعیت</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">امتیاز</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">تاریخ ثبت</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedVisitors.map((visitor, index) => {
                      const statusInfo = statusConfig[visitor.status as keyof typeof statusConfig] || statusConfig.pending;
                      const StatusIcon = statusInfo.icon || CheckCircle;
                      return (
                        <tr
                          key={visitor.id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors animate-fade-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedVisitors.includes(visitor.id)}
                              onChange={() => toggleSelectVisitor(visitor.id)}
                              className="w-4 h-4 rounded border-border"
                            />
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-foreground">{visitor.full_name || 'بدون نام'}</p>
                              {visitor.national_id && (
                                <p className="text-xs text-muted-foreground">کد ملی: {visitor.national_id}</p>
                              )}
                              {visitor.is_featured && (
                                <Badge variant="outline" className="mt-1 text-xs bg-warning/10 text-warning border-warning/20">
                                  ویژه
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-foreground font-mono" dir="ltr">{visitor.mobile || '-'}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-foreground">{visitor.email || '-'}</p>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-muted-foreground" />
                              <p className="text-sm text-foreground">{visitor.city_province || '-'}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-foreground">{visitor.destination_cities || '-'}</p>
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
                            {visitor.average_rating !== undefined && visitor.average_rating > 0 ? (
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-medium text-warning">{visitor.average_rating.toFixed(1)}</span>
                                <span className="text-xs text-muted-foreground">⭐</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-foreground">{visitor.createdAt}</p>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setViewVisitor(visitor)}
                                title="مشاهده"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {visitor.status === 'pending' && (
                                <Button 
                                  variant="ghost" 
                                  size="icon-sm"
                                  className="text-success hover:bg-success/10"
                                  onClick={() => handleApproveVisitor(visitor.id)}
                                  title="تأیید"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              {visitor.status === 'pending' && (
                                <Button 
                                  variant="ghost" 
                                  size="icon-sm"
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => handleRejectVisitor(visitor.id, 'رد شده توسط ادمین')}
                                  title="رد"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon-sm" 
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteVisitor(visitor)}
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
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border gap-4 mt-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  نمایش {((currentPage - 1) * itemsPerPage) + 1} تا {Math.min(currentPage * itemsPerPage, totalVisitors)} از {totalVisitors} ویزیتور
                </span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">۲۰</SelectItem>
                    <SelectItem value="50">۵۰</SelectItem>
                    <SelectItem value="100">۱۰۰</SelectItem>
                    <SelectItem value="200">۲۰۰</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  قبلی
                </Button>
                <div className="flex items-center gap-1">
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
                        className={currentPage === pageNum ? "gradient-primary text-primary-foreground" : ""}
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
                >
                  بعدی
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog افزودن ویزیتور */}
      <AddVisitorDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleVisitorAdded}
      />

      {/* Dialog مشاهده ویزیتور */}
      <ViewVisitorDialog
        open={!!viewVisitor}
        onOpenChange={(open) => !open && setViewVisitor(null)}
        visitor={viewVisitor ? {
          id: viewVisitor.id,
          ip: viewVisitor.ip || '0.0.0.0',
          userAgent: viewVisitor.userAgent,
          browser: viewVisitor.browser,
          os: viewVisitor.os,
          device: viewVisitor.device,
          country: viewVisitor.country,
          city: viewVisitor.city,
          page: viewVisitor.page || '/',
          referrer: viewVisitor.referrer,
          sessionId: viewVisitor.sessionId,
          duration: viewVisitor.duration,
          isBot: viewVisitor.isBot || false,
          language: viewVisitor.language,
          visitedAt: viewVisitor.visitedAt,
          createdAt: viewVisitor.createdAt || viewVisitor.created_at || '',
        } : null}
      />

      {/* Dialog حذف ویزیتور */}
      <DeleteVisitorDialog
        open={!!deleteVisitor}
        onOpenChange={(open) => !open && setDeleteVisitor(null)}
        visitor={deleteVisitor ? { id: deleteVisitor.id, ip: deleteVisitor.ip || '0.0.0.0' } : null}
        onConfirm={handleDeleteVisitor}
        isDeleting={isDeleting}
      />
    </AdminLayout>
  );
}

