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
  Megaphone, 
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  Megaphone as MegaphoneIcon,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye as EyeIcon,
  MousePointerClick,
  Layout,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { AddPopupDialog } from '@/components/popups/AddPopupDialog';
import { EditPopupDialog } from '@/components/popups/EditPopupDialog';
import { ViewPopupDialog } from '@/components/popups/ViewPopupDialog';
import { DeletePopupDialog } from '@/components/popups/DeletePopupDialog';
import { PopupsFilters } from '@/components/popups/PopupsFilters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Popup {
  id: string;
  title: string;
  content: string;
  type: 'modal' | 'banner' | 'toast' | 'slide_in';
  position?: 'top' | 'bottom' | 'center' | 'left' | 'right';
  status: 'active' | 'inactive' | 'scheduled';
  startDate?: string;
  endDate?: string;
  showOnPages?: string[];
  showToUsers: 'all' | 'logged_in' | 'logged_out' | 'specific';
  specificUserIds?: string[];
  buttonText?: string;
  buttonLink?: string;
  closeButton: boolean;
  showDelay?: number;
  backgroundColor?: string;
  textColor?: string;
  width?: number;
  height?: number;
  displayCount?: number;
  clickCount?: number;
  createdAt: string;
  updatedAt: string;
}

// داده‌های اولیه
const initialPopups: Popup[] = [
  {
    id: '1',
    title: 'تخفیف ویژه ۵۰٪',
    content: 'از تخفیف ویژه ما استفاده کنید و تا ۵۰٪ تخفیف بگیرید!',
    type: 'modal',
    position: 'center',
    status: 'active',
    buttonText: 'مشاهده محصولات',
    buttonLink: 'https://example.com/products',
    closeButton: true,
    showDelay: 3,
    backgroundColor: '#ffffff',
    textColor: '#000000',
    width: 500,
    height: 300,
    displayCount: 1250,
    clickCount: 234,
    showToUsers: 'all',
    createdAt: '۱۴۰۳/۰۹/۱۵',
    updatedAt: '۱۴۰۳/۰۹/۲۰',
  },
  {
    id: '2',
    title: 'خوش آمدید',
    content: 'به فروشگاه ما خوش آمدید!',
    type: 'banner',
    position: 'top',
    status: 'active',
    closeButton: true,
    showDelay: 0,
    backgroundColor: '#3b82f6',
    textColor: '#ffffff',
    width: 1000,
    height: 100,
    displayCount: 3450,
    clickCount: 0,
    showToUsers: 'all',
    createdAt: '۱۴۰۳/۰۹/۱۴',
    updatedAt: '۱۴۰۳/۰۹/۱۹',
  },
  {
    id: '3',
    title: 'اعلان جدید',
    content: 'محصول جدید اضافه شد!',
    type: 'toast',
    position: 'top',
    status: 'inactive',
    closeButton: true,
    showDelay: 2,
    backgroundColor: '#10b981',
    textColor: '#ffffff',
    width: 400,
    height: 80,
    displayCount: 890,
    clickCount: 45,
    showToUsers: 'logged_in',
    createdAt: '۱۴۰۳/۰۹/۱۲',
    updatedAt: '۱۴۰۳/۰۹/۱۸',
  },
  {
    id: '4',
    title: 'پیشنهاد ویژه',
    content: 'پیشنهاد ویژه برای شما!',
    type: 'slide_in',
    position: 'right',
    status: 'scheduled',
    startDate: '2024-01-01T00:00:00',
    endDate: '2024-12-31T23:59:59',
    buttonText: 'خرید',
    buttonLink: 'https://example.com/checkout',
    closeButton: true,
    showDelay: 5,
    backgroundColor: '#f59e0b',
    textColor: '#ffffff',
    width: 350,
    height: 200,
    displayCount: 0,
    clickCount: 0,
    showToUsers: 'all',
    createdAt: '۱۴۰۳/۰۹/۱۰',
    updatedAt: '۱۴۰۳/۰۹/۱۷',
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
  scheduled: {
    label: 'زمان‌بندی شده',
    className: 'bg-info/10 text-info',
    icon: CalendarIcon,
  },
};

const typeConfig = {
  modal: { label: 'Modal', className: 'bg-primary/10 text-primary' },
  banner: { label: 'Banner', className: 'bg-info/10 text-info' },
  toast: { label: 'Toast', className: 'bg-success/10 text-success' },
  slide_in: { label: 'Slide-in', className: 'bg-warning/10 text-warning' },
};

type SortField = 'title' | 'type' | 'status' | 'displayCount' | 'clickCount' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function Popups() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPopups, setSelectedPopups] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewPopup, setViewPopup] = useState<Popup | null>(null);
  const [editPopup, setEditPopup] = useState<Popup | null>(null);
  const [deletePopup, setDeletePopup] = useState<Popup | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<('active' | 'inactive' | 'scheduled')[]>([]);
  const [typeFilter, setTypeFilter] = useState<('modal' | 'banner' | 'toast' | 'slide_in')[]>([]);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPopups, setTotalPopups] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Load popups from API
  useEffect(() => {
    const loadPopups = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getPopups({
          page: currentPage,
          per_page: itemsPerPage,
          active_only: statusFilter.length === 1 && statusFilter[0] === 'active',
        });

        if (response) {
          // Backend returns: { popups: [], total: 0, page: 1, per_page: 10, total_pages: 0 }
          // Or wrapped in: { data: { popups: [], total: 0, ... } }
          const popupsData = response.data?.popups || response.popups || [];
          const transformedPopups: Popup[] = popupsData.map((p: any) => ({
            id: p.id?.toString() || p.ID?.toString() || '',
            title: p.title || 'بدون عنوان',
            content: p.content || p.message || '',
            type: p.type || 'modal',
            position: p.position || 'center',
            status: p.is_active ? 'active' : 'inactive',
            startDate: p.start_date || p.startDate || undefined,
            endDate: p.end_date || p.endDate || undefined,
            showOnPages: p.show_on_pages || p.showOnPages || [],
            showToUsers: p.show_to_users || p.showToUsers || 'all',
            specificUserIds: p.specific_user_ids || p.specificUserIds || [],
            buttonText: p.button_text || p.buttonText || undefined,
            buttonLink: p.button_link || p.buttonLink || p.discount_url || undefined,
            closeButton: p.close_button !== undefined ? p.close_button : true,
            showDelay: p.show_delay || p.showDelay || 0,
            backgroundColor: p.background_color || p.backgroundColor || undefined,
            textColor: p.text_color || p.textColor || undefined,
            width: p.width || undefined,
            height: p.height || undefined,
            displayCount: p.display_count || p.displayCount || p.show_count || 0,
            clickCount: p.click_count || p.clickCount || 0,
            createdAt: p.created_at ? new Date(p.created_at).toLocaleDateString('fa-IR') : new Date().toLocaleDateString('fa-IR'),
            updatedAt: p.updated_at ? new Date(p.updated_at).toLocaleDateString('fa-IR') : (p.created_at ? new Date(p.created_at).toLocaleDateString('fa-IR') : new Date().toLocaleDateString('fa-IR')),
          }));

          setPopups(transformedPopups);
          setTotalPopups(response.data?.total || response.total || 0);
          setTotalPages(response.data?.total_pages || response.total_pages || 1);
        }
      } catch (error: any) {
        console.error('Error loading popups:', error);
        toast({
          title: 'خطا',
          description: error.message || 'خطا در بارگذاری پاپ‌آپ‌ها',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadPopups();
  }, [currentPage, itemsPerPage, statusFilter]);

  // Use popups directly from API (already filtered and paginated)
  const paginatedPopups = popups;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handlePopupAdded = () => {
    const stored = localStorage.getItem('asll-popups');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPopups(parsed);
      } catch {}
    }
  };

  const toggleSelectPopup = (popupId: string) => {
    setSelectedPopups(prev =>
      prev.includes(popupId)
        ? prev.filter(id => id !== popupId)
        : [...prev, popupId]
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

  const handleDeletePopup = async () => {
    if (!deletePopup) return;
    
    setIsDeleting(true);
    try {
      await adminApi.deletePopup(parseInt(deletePopup.id));
      
      setPopups(prev => prev.filter(p => p.id !== deletePopup.id));
      setSelectedPopups(prev => prev.filter(id => id !== deletePopup.id));
      setDeletePopup(null);
      setTotalPopups(prev => prev - 1);
      
      toast({
        title: 'موفقیت',
        description: 'پاپ‌آپ با موفقیت حذف شد.',
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در حذف پاپ‌آپ',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedPopups.length === 0) return;

    try {
      for (const popupId of selectedPopups) {
        if (action === 'delete') {
          await adminApi.deletePopup(parseInt(popupId));
        } else {
          const popup = popups.find(p => p.id === popupId);
          if (popup) {
            await adminApi.updatePopup(parseInt(popupId), {
              is_active: action === 'activate',
            });
          }
        }
      }

      // Reload popups
      const response = await adminApi.getPopups({
        page: currentPage,
        per_page: itemsPerPage,
        active_only: statusFilter.length === 1 && statusFilter[0] === 'active',
      });
      if (response && (response.data || response.popups)) {
        const popupsData = response.data?.popups || response.popups || [];
        const transformedPopups: Popup[] = popupsData.map((p: any) => ({
          id: p.id?.toString() || p.ID?.toString() || '',
          title: p.title || 'بدون عنوان',
          content: p.content || p.message || '',
          type: p.type || 'modal',
          position: p.position || 'center',
          status: p.is_active ? 'active' : 'inactive',
          startDate: p.start_date || p.startDate || undefined,
          endDate: p.end_date || p.endDate || undefined,
          showOnPages: p.show_on_pages || p.showOnPages || [],
          showToUsers: p.show_to_users || p.showToUsers || 'all',
          specificUserIds: p.specific_user_ids || p.specificUserIds || [],
          buttonText: p.button_text || p.buttonText || undefined,
          buttonLink: p.button_link || p.buttonLink || undefined,
          closeButton: p.close_button !== undefined ? p.close_button : true,
          showDelay: p.show_delay || p.showDelay || 0,
          backgroundColor: p.background_color || p.backgroundColor || undefined,
          textColor: p.text_color || p.textColor || undefined,
          width: p.width || undefined,
          height: p.height || undefined,
          displayCount: p.display_count || p.displayCount || 0,
          clickCount: p.click_count || p.clickCount || 0,
          createdAt: p.created_at || new Date().toISOString(),
          updatedAt: p.updated_at || p.created_at || new Date().toISOString(),
        }));
        setPopups(transformedPopups);
      }

      setSelectedPopups([]);
      
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">مدیریت پاپ‌آپ‌ها</h1>
            <p className="text-muted-foreground">لیست تمامی پاپ‌آپ‌های سیستم</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              پاپ‌آپ جدید
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
                    placeholder="جستجو بر اساس عنوان، محتوا یا شناسه..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pr-10 pl-4 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  />
                </div>
                <PopupsFilters
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  typeFilter={typeFilter}
                  onTypeFilterChange={setTypeFilter}
                  onReset={handleResetFilters}
                />
              </div>
              {(statusFilter.length > 0 || typeFilter.length > 0) && (
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
        {selectedPopups.length > 0 && (
          <Card className="border-primary/50 bg-primary/5 animate-scale-in">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <span className="text-sm text-foreground font-medium">
                  {selectedPopups.length} پاپ‌آپ انتخاب شده
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkAction('activate')}
                    className="text-success hover:bg-success/10"
                  >
                    <CheckCircle className="w-4 h-4 ml-2" />
                    فعال کردن
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkAction('deactivate')}
                    className="text-muted-foreground hover:bg-muted"
                  >
                    <XCircle className="w-4 h-4 ml-2" />
                    غیرفعال کردن
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (confirm(`آیا از حذف ${selectedPopups.length} پاپ‌آپ اطمینان دارید؟`)) {
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

        {/* Popups Table */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">لیست پاپ‌آپ‌ها ({totalPopups})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : paginatedPopups.length === 0 ? (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <MegaphoneIcon className="w-12 h-12 text-muted-foreground" />
                  <p className="text-muted-foreground">هیچ پاپ‌آپی یافت نشد</p>
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
                          checked={selectedPopups.length === paginatedPopups.length && paginatedPopups.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPopups(paginatedPopups.map(p => p.id));
                            } else {
                              setSelectedPopups([]);
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
                          onClick={() => handleSort('displayCount')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          نمایش
                          {getSortIcon('displayCount')}
                        </button>
                      </th>
                      <th className="p-4 text-right">
                        <button
                          onClick={() => handleSort('clickCount')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          کلیک
                          {getSortIcon('clickCount')}
                        </button>
                      </th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPopups.map((popup, index) => {
                      const StatusIcon = statusConfig[popup.status].icon;
                      const clickRate = popup.displayCount > 0 
                        ? ((popup.clickCount || 0) / popup.displayCount * 100).toFixed(2)
                        : '0.00';
                      return (
                        <tr
                          key={popup.id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors animate-fade-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedPopups.includes(popup.id)}
                              onChange={() => toggleSelectPopup(popup.id)}
                              className="w-4 h-4 rounded border-border"
                            />
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-foreground">{popup.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                {popup.content}
                              </p>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant="outline"
                              className={cn('text-xs', typeConfig[popup.type].className)}
                            >
                              <Layout className="w-3 h-3 ml-1" />
                              {typeConfig[popup.type].label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant="outline"
                              className={cn('text-xs', statusConfig[popup.status].className)}
                            >
                              <StatusIcon className="w-3 h-3 ml-1" />
                              {statusConfig[popup.status].label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <EyeIcon className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">
                                {(popup.displayCount || 0).toLocaleString('fa-IR')}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <MousePointerClick className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">
                                  {(popup.clickCount || 0).toLocaleString('fa-IR')}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {clickRate}% نرخ کلیک
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setViewPopup(popup)}
                                title="مشاهده"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setEditPopup(popup)}
                                title="ویرایش"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon-sm" 
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => setDeletePopup(popup)}
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
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border gap-4 mt-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  نمایش {((currentPage - 1) * itemsPerPage) + 1} تا {Math.min(currentPage * itemsPerPage, totalPopups)} از {totalPopups} پاپ‌آپ
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
                    <SelectItem value="10">۱۰</SelectItem>
                    <SelectItem value="20">۲۰</SelectItem>
                    <SelectItem value="50">۵۰</SelectItem>
                    <SelectItem value="100">۱۰۰</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
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
                        disabled={loading}
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
                  disabled={currentPage === totalPages || loading}
                >
                  بعدی
                </Button>
              </div>
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog افزودن پاپ‌آپ */}
      <AddPopupDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handlePopupAdded}
      />

      {/* Dialog مشاهده پاپ‌آپ */}
      <ViewPopupDialog
        open={!!viewPopup}
        onOpenChange={(open) => !open && setViewPopup(null)}
        popup={viewPopup}
      />

      {/* Dialog ویرایش پاپ‌آپ */}
      <EditPopupDialog
        open={!!editPopup}
        onOpenChange={(open) => !open && setEditPopup(null)}
        popup={editPopup}
        onSuccess={() => {
          const stored = localStorage.getItem('asll-popups');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setPopups(parsed);
            } catch {}
          }
          setEditPopup(null);
        }}
      />

      {/* Dialog حذف پاپ‌آپ */}
      <DeletePopupDialog
        open={!!deletePopup}
        onOpenChange={(open) => !open && setDeletePopup(null)}
        popup={deletePopup}
        onConfirm={handleDeletePopup}
        isDeleting={isDeleting}
      />
    </AdminLayout>
  );
}

