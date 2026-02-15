import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/lib/api/adminApi';
import { Loader2, Image as ImageIcon, Plus, Edit, Trash2, Eye, CheckCircle, XCircle, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { getImageUrl } from '@/lib/utils/imageUrl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Slider {
  id: number;
  image_url: string;
  link: string;
  link_type: 'internal' | 'external';
  is_active: boolean;
  order: number;
  click_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export default function Sliders() {
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalSliders, setTotalSliders] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedSlider, setSelectedSlider] = useState<Slider | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  
  const [formData, setFormData] = useState({
    image_url: '',
    link: '',
    link_type: 'internal' as 'internal' | 'external',
    is_active: true,
    order: 0,
  });

  // Load sliders from API
  const loadSliders = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getSliders({
        page: currentPage,
        per_page: itemsPerPage,
        active_only: statusFilter === 'active',
      });

      if (response && (response.sliders || response.data?.sliders)) {
        const slidersData = response.sliders || response.data?.sliders || [];
        setSliders(slidersData);
        setTotalSliders(response.total || response.data?.total || 0);
        setTotalPages(response.total_pages || response.data?.total_pages || 1);
      }
    } catch (error: any) {
      console.error('Error loading sliders:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در بارگذاری اسلایدرها',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSliders();
  }, [currentPage, itemsPerPage, statusFilter]);

  // Filter sliders by search query
  const filteredSliders = sliders.filter(slider => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      slider.link.toLowerCase().includes(query) ||
      slider.id.toString().includes(query)
    );
  });

  const handleUploadImage = async (file: File) => {
    try {
      setIsUploading(true);
      const response = await adminApi.uploadSliderImage(file);
      if (response && response.image_url) {
        setUploadedImageUrl(response.image_url);
        setFormData(prev => ({ ...prev, image_url: response.image_url }));
        toast({
          title: 'موفقیت',
          description: 'تصویر با موفقیت آپلود شد',
        });
      }
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در آپلود تصویر',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddSlider = async () => {
    if (!formData.image_url) {
      toast({
        title: 'خطا',
        description: 'لطفا تصویر را آپلود کنید',
        variant: 'destructive',
      });
      return;
    }

    try {
      await adminApi.createSlider(formData);
      toast({
        title: 'موفقیت',
        description: 'اسلایدر با موفقیت ایجاد شد',
      });
      setIsAddDialogOpen(false);
      resetForm();
      loadSliders();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در ایجاد اسلایدر',
        variant: 'destructive',
      });
    }
  };

  const handleEditSlider = async () => {
    if (!selectedSlider) return;

    try {
      await adminApi.updateSlider(selectedSlider.id, formData);
      toast({
        title: 'موفقیت',
        description: 'اسلایدر با موفقیت به‌روزرسانی شد',
      });
      setIsEditDialogOpen(false);
      resetForm();
      loadSliders();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در به‌روزرسانی اسلایدر',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSlider = async () => {
    if (!selectedSlider) return;

    try {
      await adminApi.deleteSlider(selectedSlider.id);
      toast({
        title: 'موفقیت',
        description: 'اسلایدر با موفقیت حذف شد',
      });
      setIsDeleteDialogOpen(false);
      setSelectedSlider(null);
      loadSliders();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در حذف اسلایدر',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      image_url: '',
      link: '',
      link_type: 'internal',
      is_active: true,
      order: 0,
    });
    setUploadedImageUrl('');
  };

  const openEditDialog = (slider: Slider) => {
    setSelectedSlider(slider);
    setFormData({
      image_url: slider.image_url,
      link: slider.link,
      link_type: slider.link_type,
      is_active: slider.is_active,
      order: slider.order,
    });
    setUploadedImageUrl(slider.image_url);
    setIsEditDialogOpen(true);
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };


  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">مدیریت اسلایدر</h1>
            <p className="text-muted-foreground">مدیریت اسلایدرهای بالای پلتفرم</p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 ml-2" />
            افزودن اسلایدر
          </Button>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="جستجو..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="وضعیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="inactive">غیرفعال</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sliders Table */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">لیست اسلایدرها ({totalSliders})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredSliders.length === 0 ? (
              <div className="p-12 text-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">هیچ اسلایدری یافت نشد</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">تصویر</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">لینک</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">وضعیت</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">ترتیب</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">آمار</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSliders.map((slider) => (
                      <tr key={slider.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <img
                            src={getImageUrl(slider.image_url)}
                            alt={`Slider ${slider.id}`}
                            className="w-24 h-16 object-cover rounded"
                          />
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{slider.link || '-'}</span>
                          <Badge variant="outline" className="mr-2">
                            {slider.link_type === 'internal' ? 'داخلی' : 'خارجی'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={cn(
                            slider.is_active
                              ? 'bg-success/10 text-success'
                              : 'bg-muted text-muted-foreground'
                          )}>
                            {slider.is_active ? (
                              <>
                                <CheckCircle className="w-3 h-3 ml-1" />
                                فعال
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 ml-1" />
                                غیرفعال
                              </>
                            )}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{slider.order}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                            <span>بازدید: {slider.view_count}</span>
                            <span>کلیک: {slider.click_count}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSlider(slider);
                                setIsViewDialogOpen(true);
                              }}
                              title="مشاهده جزئیات"
                            >
                              <Eye className="w-4 h-4 ml-1" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(slider)}
                            >
                              <Edit className="w-4 h-4 ml-1" />
                              ویرایش
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSlider(slider);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4 ml-1" />
                              حذف
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && filteredSliders.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border gap-4 mt-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    نمایش {((currentPage - 1) * itemsPerPage) + 1} تا {Math.min(currentPage * itemsPerPage, totalSliders)} از {totalSliders} اسلایدر
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

        {/* View Dialog */}
        <Dialog
          open={isViewDialogOpen}
          onOpenChange={(open) => {
            setIsViewDialogOpen(open);
            if (!open) {
              setSelectedSlider(null);
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  <span>جزئیات اسلایدر</span>
                </span>
                {selectedSlider && (
                  <Badge
                    className={cn(
                      "border-0 text-xs px-3 py-1 rounded-full",
                      selectedSlider.is_active
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-slate-600/40 text-slate-200"
                    )}
                  >
                    {selectedSlider.is_active ? (
                      <>
                        <CheckCircle className="w-3 h-3 ml-1" />
                        فعال
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 ml-1" />
                        غیرفعال
                      </>
                    )}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>

            {selectedSlider && (
              <div className="space-y-6">
                {/* Hero Image */}
                <div className="rounded-2xl overflow-hidden border border-slate-800/80">
                  <img
                    src={getImageUrl(selectedSlider.image_url)}
                    alt={`Slider ${selectedSlider.id}`}
                    className="w-full max-h-[260px] object-cover"
                  />
                </div>

                {/* Link & Meta */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-slate-900/60 border-slate-700/70">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">
                        لینک اسلایدر
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="bg-slate-800/60 border-slate-600/80 text-xs">
                          {selectedSlider.link_type === "internal" ? "داخلی" : "خارجی"}
                        </Badge>
                        <span className="text-muted-foreground">|</span>
                        <span
                          className={cn(
                            "font-mono text-xs break-all",
                            selectedSlider.link_type === "external" ? "text-blue-300" : "text-slate-200"
                          )}
                          dir="ltr"
                        >
                          {selectedSlider.link || "بدون لینک"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/60 border-slate-700/70">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">
                        ترتیب و شناسه
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">شناسه</p>
                        <p className="font-semibold text-foreground mt-1">
                          {selectedSlider.id}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ترتیب نمایش</p>
                        <p className="font-semibold text-foreground mt-1">
                          {selectedSlider.order}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Stats */}
                <Card className="bg-slate-900/60 border-slate-700/70">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">
                      آمار عملکرد
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-900/80 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground mb-1">تعداد نمایش</p>
                      <p className="text-lg font-bold text-foreground">
                        {selectedSlider.view_count.toLocaleString("fa-IR")}
                      </p>
                    </div>
                    <div className="bg-slate-900/80 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground mb-1">تعداد کلیک</p>
                      <p className="text-lg font-bold text-foreground">
                        {selectedSlider.click_count.toLocaleString("fa-IR")}
                      </p>
                    </div>
                    <div className="bg-slate-900/80 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground mb-1">نرخ کلیک (CTR)</p>
                      <p className="text-lg font-bold text-primary">
                        {selectedSlider.view_count > 0
                          ? (
                              (selectedSlider.click_count / selectedSlider.view_count) *
                              100
                            ).toFixed(2)
                          : "0.00"}
                        %
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Dates */}
                <Card className="bg-slate-900/60 border-slate-700/70">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">
                      زمان‌بندی
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">تاریخ ایجاد</p>
                      <p className="font-medium text-foreground">
                        {new Date(selectedSlider.created_at).toLocaleString("fa-IR")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">آخرین بروزرسانی</p>
                      <p className="font-medium text-foreground">
                        {new Date(selectedSlider.updated_at).toLocaleString("fa-IR")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>افزودن اسلایدر جدید</DialogTitle>
              <DialogDescription>
                اسلایدر جدید را برای نمایش در بالای پلتفرم اضافه کنید
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>تصویر</Label>
                <div className="mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadImage(file);
                      }
                    }}
                    disabled={isUploading}
                  />
                  {isUploading && (
                    <div className="flex items-center gap-2 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">در حال آپلود...</span>
                    </div>
                  )}
                  {uploadedImageUrl && (
                    <img
                      src={getImageUrl(uploadedImageUrl)}
                      alt="Preview"
                      className="mt-2 w-full h-48 object-cover rounded"
                    />
                  )}
                </div>
              </div>
              <div>
                <Label>لینک</Label>
                <Input
                  value={formData.link}
                  onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="مثال: /aslsupplier یا https://example.com"
                />
              </div>
              <div>
                <Label>نوع لینک</Label>
                <Select
                  value={formData.link_type}
                  onValueChange={(value: 'internal' | 'external') =>
                    setFormData(prev => ({ ...prev, link_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">داخلی (بخش پلتفرم)</SelectItem>
                    <SelectItem value="external">خارجی (URL خارجی)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ترتیب نمایش</Label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_active">فعال</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                انصراف
              </Button>
              <Button onClick={handleAddSlider} disabled={!formData.image_url || isUploading}>
                افزودن
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>ویرایش اسلایدر</DialogTitle>
              <DialogDescription>
                اطلاعات اسلایدر را ویرایش کنید
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>تصویر</Label>
                <div className="mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadImage(file);
                      }
                    }}
                    disabled={isUploading}
                  />
                  {isUploading && (
                    <div className="flex items-center gap-2 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">در حال آپلود...</span>
                    </div>
                  )}
                  {uploadedImageUrl && (
                    <img
                      src={getImageUrl(uploadedImageUrl)}
                      alt="Preview"
                      className="mt-2 w-full h-48 object-cover rounded"
                    />
                  )}
                </div>
              </div>
              <div>
                <Label>لینک</Label>
                <Input
                  value={formData.link}
                  onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="مثال: /aslsupplier یا https://example.com"
                />
              </div>
              <div>
                <Label>نوع لینک</Label>
                <Select
                  value={formData.link_type}
                  onValueChange={(value: 'internal' | 'external') =>
                    setFormData(prev => ({ ...prev, link_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">داخلی (بخش پلتفرم)</SelectItem>
                    <SelectItem value="external">خارجی (URL خارجی)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ترتیب نمایش</Label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active_edit"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_active_edit">فعال</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                انصراف
              </Button>
              <Button onClick={handleEditSlider} disabled={!formData.image_url || isUploading}>
                ذخیره
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>حذف اسلایدر</DialogTitle>
              <DialogDescription>
                آیا مطمئن هستید که می‌خواهید این اسلایدر را حذف کنید؟
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                انصراف
              </Button>
              <Button variant="destructive" onClick={handleDeleteSlider}>
                حذف
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
