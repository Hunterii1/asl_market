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
  Edit,
  Trash2,
  XCircle,
  CheckCircle,
  Eye as EyeIcon,
  MapPin,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { EditVisitorDialog } from '@/components/visitors/EditVisitorDialog';
import { ViewVisitorDialog } from '@/components/visitors/ViewVisitorDialog';
import { DeleteVisitorDialog } from '@/components/visitors/DeleteVisitorDialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  national_id?: string;
  passport_number?: string;
  birth_date?: string;
  mobile?: string;
  whatsapp_number?: string;
  email?: string;
  residence_address?: string;
  city_province?: string;
  destination_cities?: string;
  has_local_contact?: boolean;
  local_contact_details?: string;
  bank_account_iban?: string;
  bank_name?: string;
  account_holder_name?: string;
  has_marketing_experience?: boolean;
  marketing_experience_desc?: string;
  language_level?: string;
  special_skills?: string;
  interested_products?: string;
  agrees_to_use_approved_products?: boolean;
  agrees_to_violation_consequences?: boolean;
  agrees_to_submit_reports?: boolean;
  digital_signature?: string;
  signature_date?: string;
  status?: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  approved_at?: string;
  is_featured?: boolean;
  featured_at?: string;
  average_rating?: number;
  total_ratings?: number;
  created_at?: string;
  updated_at?: string;
  createdAt: string;
}


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


export default function Visitors() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVisitors, setSelectedVisitors] = useState<string[]>([]);
  const [editVisitor, setEditVisitor] = useState<Visitor | null>(null);
  const [viewVisitor, setViewVisitor] = useState<Visitor | null>(null);
  const [deleteVisitor, setDeleteVisitor] = useState<Visitor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rejectVisitor, setRejectVisitor] = useState<Visitor | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<('pending' | 'approved' | 'rejected')[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const reloadVisitors = async () => {
    try {
      setLoading(true);
      const statusFilterValue = statusFilter.length === 1 ? statusFilter[0] : 'all';

      const response = await adminApi.getVisitors({
        page: currentPage,
        per_page: itemsPerPage,
        status: statusFilterValue,
        search: searchQuery || undefined,
      });

      if (response) {
        const visitorsData = response.visitors || [];
        
        const transformedVisitors: Visitor[] = visitorsData.map((v: any) => ({
          id: v.id?.toString() || '',
          user_id: v.user_id,
          full_name: v.full_name || 'بدون نام',
          national_id: v.national_id || '',
          passport_number: v.passport_number || '',
          birth_date: v.birth_date || '',
          mobile: v.mobile || '',
          whatsapp_number: v.whatsapp_number || '',
          email: v.email || '',
          residence_address: v.residence_address || '',
          city_province: v.city_province || '',
          destination_cities: v.destination_cities || '',
          has_local_contact: v.has_local_contact || false,
          local_contact_details: v.local_contact_details || '',
          bank_account_iban: v.bank_account_iban || '',
          bank_name: v.bank_name || '',
          account_holder_name: v.account_holder_name || '',
          has_marketing_experience: v.has_marketing_experience || false,
          marketing_experience_desc: v.marketing_experience_desc || '',
          language_level: v.language_level || '',
          special_skills: v.special_skills || '',
          interested_products: v.interested_products || '',
          agrees_to_use_approved_products: v.agrees_to_use_approved_products || false,
          agrees_to_violation_consequences: v.agrees_to_violation_consequences || false,
          agrees_to_submit_reports: v.agrees_to_submit_reports || false,
          digital_signature: v.digital_signature || '',
          signature_date: v.signature_date || '',
          status: (v.status || 'pending') as 'pending' | 'approved' | 'rejected',
          admin_notes: v.admin_notes || '',
          approved_at: v.approved_at,
          is_featured: v.is_featured || false,
          featured_at: v.featured_at,
          average_rating: v.average_rating || 0,
          total_ratings: v.total_ratings || 0,
          created_at: v.created_at || new Date().toISOString(),
          updated_at: v.updated_at,
          createdAt: v.created_at || new Date().toISOString(),
        }));

        setVisitors(transformedVisitors);
        setTotalVisitors(response.total || 0);
        setTotalPages(response.total_pages || 1);
      }
    } catch (error: any) {
      console.error('Error reloading visitors:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در بارگذاری ویزیتورها',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load visitors from API
  useEffect(() => {
    reloadVisitors();
  }, [currentPage, itemsPerPage, statusFilter, searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const toggleSelectVisitor = (visitorId: string) => {
    setSelectedVisitors(prev =>
      prev.includes(visitorId)
        ? prev.filter(id => id !== visitorId)
        : [...prev, visitorId]
    );
  };

  const handleApproveVisitor = async (visitorId: string, notes?: string) => {
    try {
      await adminApi.approveVisitor(parseInt(visitorId), { admin_notes: notes || '' });
      toast({
        title: 'موفقیت',
        description: 'ویزیتور با موفقیت تأیید شد.',
      });
      await reloadVisitors();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در تأیید ویزیتور',
        variant: 'destructive',
      });
    }
  };

  const handleRejectVisitor = async (notes: string) => {
    if (!rejectVisitor) return;
    
    setIsRejecting(true);
    try {
      await adminApi.rejectVisitor(parseInt(rejectVisitor.id), { admin_notes: notes });
      setRejectVisitor(null);
      setRejectNotes('');
      
      toast({
        title: 'موفقیت',
        description: 'ویزیتور با موفقیت رد شد.',
      });
      
      await reloadVisitors();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در رد ویزیتور',
        variant: 'destructive',
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleDeleteVisitor = async () => {
    if (!deleteVisitor) return;
    
    setIsDeleting(true);
    try {
      await adminApi.deleteVisitor(parseInt(deleteVisitor.id));
      setDeleteVisitor(null);
      
      toast({
        title: 'موفقیت',
        description: 'ویزیتور با موفقیت حذف شد.',
      });
      
      await reloadVisitors();
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
      if (action === 'delete') {
        await Promise.all(
          selectedVisitors.map(id => adminApi.deleteVisitor(parseInt(id)))
        );
      }

      setSelectedVisitors([]);
      await reloadVisitors();
      
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">مدیریت ویزیتورها</h1>
            <p className="text-sm md:text-base text-muted-foreground">لیست تمامی ویزیتورهای سیستم</p>
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedVisitors.length > 0 && (
          <Card className="border-primary/50 bg-primary/5 animate-scale-in">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
            ) : visitors.length === 0 ? (
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
                          checked={selectedVisitors.length === visitors.length && visitors.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVisitors(visitors.map(v => v.id));
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
                    {visitors.map((visitor, index) => {
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
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setEditVisitor(visitor)}
                                title="ویرایش"
                              >
                                <Edit className="w-4 h-4" />
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
                                  onClick={() => setRejectVisitor(visitor)}
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
            <div className="flex flex-col gap-4 p-3 md:p-4 border-t border-border">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs md:text-sm text-muted-foreground text-center sm:text-right">
                  نمایش {((currentPage - 1) * itemsPerPage) + 1} تا {Math.min(currentPage * itemsPerPage, totalVisitors)} از {totalVisitors} ویزیتور
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
                    <SelectItem value="20">۲۰</SelectItem>
                    <SelectItem value="50">۵۰</SelectItem>
                    <SelectItem value="100">۱۰۰</SelectItem>
                    <SelectItem value="200">۲۰۰</SelectItem>
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
          </CardContent>
        </Card>
      </div>

      {/* Dialog ویرایش ویزیتور */}
      <EditVisitorDialog
        open={!!editVisitor}
        onOpenChange={(open) => !open && setEditVisitor(null)}
        visitor={editVisitor}
        onSuccess={() => {
          reloadVisitors();
          setEditVisitor(null);
        }}
      />

      {/* Dialog مشاهده ویزیتور */}
      <ViewVisitorDialog
        open={!!viewVisitor}
        onOpenChange={(open) => !open && setViewVisitor(null)}
        visitor={viewVisitor}
        onFeaturedChange={reloadVisitors}
      />

      {/* Dialog حذف ویزیتور */}
      <DeleteVisitorDialog
        open={!!deleteVisitor}
        onOpenChange={(open) => !open && setDeleteVisitor(null)}
        visitor={deleteVisitor ? { id: deleteVisitor.id, full_name: deleteVisitor.full_name || 'بدون نام' } : null}
        onConfirm={handleDeleteVisitor}
        isDeleting={isDeleting}
      />

      {/* Dialog رد ویزیتور */}
      {rejectVisitor && (
        <Dialog open={!!rejectVisitor} onOpenChange={(open) => {
          if (!open) {
            setRejectVisitor(null);
            setRejectNotes('');
          }
        }}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                رد ویزیتور
              </DialogTitle>
              <DialogDescription className="text-right">
                آیا از رد ویزیتور "{rejectVisitor.full_name || 'بدون نام'}" اطمینان دارید؟
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reject-notes">دلیل رد <span className="text-destructive">*</span></Label>
                <Textarea
                  id="reject-notes"
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="لطفا دلیل رد ویزیتور را وارد کنید..."
                  className="mt-2 min-h-[100px] text-right"
                  disabled={isRejecting}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 flex-row-reverse">
              <Button
                variant="destructive"
                onClick={() => handleRejectVisitor(rejectNotes)}
                disabled={isRejecting || !rejectNotes.trim()}
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    در حال رد...
                  </>
                ) : (
                  'رد ویزیتور'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectVisitor(null);
                  setRejectNotes('');
                }}
                disabled={isRejecting}
              >
                انصراف
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
}

