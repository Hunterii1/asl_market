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
  Eye as EyeIcon,
  MousePointerClick,
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

import { Popup } from '@/types/popup';

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


export default function Popups() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPopups, setSelectedPopups] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewPopup, setViewPopup] = useState<Popup | null>(null);
  const [editPopup, setEditPopup] = useState<Popup | null>(null);
  const [deletePopup, setDeletePopup] = useState<Popup | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<('active' | 'inactive')[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPopups, setTotalPopups] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Load popups from API
  const loadPopups = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPopups({
        page: currentPage,
        per_page: itemsPerPage,
        active_only: statusFilter.length === 1 && statusFilter[0] === 'active',
      });

      if (response && response.popups) {
        setPopups(response.popups);
        setTotalPopups(response.total || 0);
        setTotalPages(response.total_pages || 1);
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

  useEffect(() => {
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
    loadPopups();
  };

  const toggleSelectPopup = (popupId: string) => {
    setSelectedPopups(prev =>
      prev.includes(popupId)
        ? prev.filter(id => id !== popupId)
        : [...prev, popupId]
    );
  };

  const handleDeletePopup = async () => {
    if (!deletePopup) return;
    
    setIsDeleting(true);
    try {
      await adminApi.deletePopup(deletePopup.id);
      setDeletePopup(null);
      await loadPopups();
      
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
      for (const popupIdStr of selectedPopups) {
        const popupId = parseInt(popupIdStr);
        if (action === 'delete') {
          await adminApi.deletePopup(popupId);
        } else {
          await adminApi.updatePopup(popupId, {
            is_active: action === 'activate',
          });
        }
      }

      await loadPopups();
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
  };


  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">مدیریت پاپ‌آپ‌ها</h1>
            <p className="text-sm md:text-base text-muted-foreground">لیست تمامی پاپ‌آپ‌های سیستم</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={() => setIsAddDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 md:ml-2" />
              <span className="hidden sm:inline">پاپ‌آپ جدید</span>
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
                <PopupsFilters
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  onReset={handleResetFilters}
                />
              </div>
              {statusFilter.length > 0 && (
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
                              setSelectedPopups(paginatedPopups.map(p => p.id.toString()));
                            } else {
                              setSelectedPopups([]);
                            }
                          }}
                          className="w-4 h-4 rounded border-border"
                        />
                      </th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">
                        عنوان
                      </th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">
                        وضعیت
                      </th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">
                        اولویت
                      </th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">
                        نمایش
                      </th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">
                        کلیک
                      </th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPopups.map((popup, index) => {
                      const statusKey = popup.is_active ? 'active' : 'inactive';
                      const statusInfo = statusConfig[statusKey];
                      const StatusIcon = statusInfo.icon;
                      const clickRate = popup.show_count > 0 
                        ? ((popup.click_count || 0) / popup.show_count * 100).toFixed(2)
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
                              checked={selectedPopups.includes(popup.id.toString())}
                              onChange={() => toggleSelectPopup(popup.id.toString())}
                              className="w-4 h-4 rounded border-border"
                            />
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-foreground">{popup.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                {popup.message}
                              </p>
                            </div>
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
                            <span className="text-sm font-medium text-foreground">
                              {popup.priority}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <EyeIcon className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">
                                {(popup.show_count || 0).toLocaleString('fa-IR')}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <MousePointerClick className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">
                                  {(popup.click_count || 0).toLocaleString('fa-IR')}
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
            <div className="flex flex-col gap-4 p-3 md:p-4 border-t border-border">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs md:text-sm text-muted-foreground text-center sm:text-right">
                  نمایش {((currentPage - 1) * itemsPerPage) + 1} تا {Math.min(currentPage * itemsPerPage, totalPopups)} از {totalPopups} پاپ‌آپ
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
          loadPopups();
          setEditPopup(null);
        }}
      />

      {/* Dialog حذف پاپ‌آپ */}
      <DeletePopupDialog
        open={!!deletePopup}
        onOpenChange={(open) => !open && setDeletePopup(null)}
        popup={deletePopup ? { id: deletePopup.id.toString(), title: deletePopup.title } : null}
        onConfirm={handleDeletePopup}
        isDeleting={isDeleting}
      />
    </AdminLayout>
  );
}

