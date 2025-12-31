import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/lib/api/adminApi';
import { Loader2, Search, Plus, Box, Edit, Trash2, Eye, X, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { ViewResearchProductDialog } from '@/components/research-products/ViewResearchProductDialog';
import { EditResearchProductDialog } from '@/components/research-products/EditResearchProductDialog';
import { AddResearchProductDialog } from '@/components/research-products/AddResearchProductDialog';
import { DeleteResearchProductDialog } from '@/components/research-products/DeleteResearchProductDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ResearchProduct {
  id: string;
  name: string;
  hs_code?: string;
  category: string;
  description?: string;
  export_value?: string;
  import_value?: string;
  market_demand?: 'high' | 'medium' | 'low';
  profit_potential?: 'high' | 'medium' | 'low';
  competition_level?: 'high' | 'medium' | 'low';
  target_country?: string;
  target_countries?: string;
  iran_purchase_price?: string;
  target_country_price?: string;
  price_currency?: string;
  profit_margin?: string;
  seasonal_factors?: string;
  required_licenses?: string;
  quality_standards?: string;
  status: 'active' | 'inactive';
  priority?: number;
  created_at?: string;
  updated_at?: string;
  createdAt: string;
}

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
};

export default function ResearchProducts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [viewProduct, setViewProduct] = useState<ResearchProduct | null>(null);
  const [editProduct, setEditProduct] = useState<ResearchProduct | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<ResearchProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<('active' | 'inactive')[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [products, setProducts] = useState<ResearchProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Load products from API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const statusFilterValue = statusFilter.length === 1 ? statusFilter[0] : undefined;
        const categoryFilterValue = categoryFilter.length === 1 ? categoryFilter[0] : undefined;

        const response = await adminApi.getResearchProducts({
          page: currentPage,
          per_page: itemsPerPage,
          status: statusFilterValue,
          category: categoryFilterValue,
          hs_code: searchQuery || undefined,
        });

        if (response) {
          // Backend returns: { products: [...], pagination: {...} }
          const productsData = response.products || [];
          const pagination = response.pagination || {};
          
          const transformedProducts: ResearchProduct[] = productsData.map((p: any) => ({
            id: p.id?.toString() || '',
            name: p.name || 'بدون نام',
            hs_code: p.hs_code || '',
            category: p.category || 'other',
            description: p.description || '',
            export_value: p.export_value || '',
            import_value: p.import_value || '',
            market_demand: p.market_demand || undefined,
            profit_potential: p.profit_potential || undefined,
            competition_level: p.competition_level || undefined,
            target_country: p.target_country || '',
            target_countries: p.target_countries || '',
            iran_purchase_price: p.iran_purchase_price || '',
            target_country_price: p.target_country_price || '',
            price_currency: p.price_currency || 'USD',
            profit_margin: p.profit_margin || '',
            seasonal_factors: p.seasonal_factors || '',
            required_licenses: p.required_licenses || '',
            quality_standards: p.quality_standards || '',
            status: (p.status || 'active') as 'active' | 'inactive',
            priority: p.priority || 0,
            created_at: p.created_at,
            updated_at: p.updated_at,
            createdAt: p.created_at || new Date().toISOString(),
          }));

          setProducts(transformedProducts);
          setTotalProducts(pagination.total || response.total || 0);
          setTotalPages(pagination.total_pages || response.total_pages || 1);
        }
      } catch (error: any) {
        console.error('Error loading research products:', error);
        toast({
          title: 'خطا',
          description: error.message || 'خطا در بارگذاری محصولات تحقیقی',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [currentPage, itemsPerPage, statusFilter, categoryFilter, searchQuery]);

  const paginatedProducts = products;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const toggleSelectProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const reloadProducts = async () => {
    try {
      setLoading(true);
      const statusFilterValue = statusFilter.length === 1 ? statusFilter[0] : undefined;
      const categoryFilterValue = categoryFilter.length === 1 ? categoryFilter[0] : undefined;

      const response = await adminApi.getResearchProducts({
        page: currentPage,
        per_page: itemsPerPage,
        status: statusFilterValue,
        category: categoryFilterValue,
        hs_code: searchQuery || undefined,
      });

      if (response) {
        const productsData = response.products || [];
        const pagination = response.pagination || {};
        
        const transformedProducts: ResearchProduct[] = productsData.map((p: any) => ({
          id: p.id?.toString() || '',
          name: p.name || 'بدون نام',
          hs_code: p.hs_code || '',
          category: p.category || 'other',
          description: p.description || '',
          export_value: p.export_value || '',
          import_value: p.import_value || '',
          market_demand: p.market_demand || undefined,
          profit_potential: p.profit_potential || undefined,
          competition_level: p.competition_level || undefined,
          target_country: p.target_country || '',
          target_countries: p.target_countries || '',
          iran_purchase_price: p.iran_purchase_price || '',
          target_country_price: p.target_country_price || '',
          price_currency: p.price_currency || 'USD',
          profit_margin: p.profit_margin || '',
          seasonal_factors: p.seasonal_factors || '',
          required_licenses: p.required_licenses || '',
          quality_standards: p.quality_standards || '',
          status: (p.status || 'active') as 'active' | 'inactive',
          priority: p.priority || 0,
          created_at: p.created_at,
          updated_at: p.updated_at,
          createdAt: p.created_at || new Date().toISOString(),
        }));

        setProducts(transformedProducts);
        setTotalProducts(pagination.total || response.total || 0);
        setTotalPages(pagination.total_pages || response.total_pages || 1);
      }
    } catch (error: any) {
      console.error('Error reloading research products:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در بارگذاری محصولات تحقیقی',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProduct) return;
    
    setIsDeleting(true);
    try {
      await adminApi.deleteResearchProduct(Number(deleteProduct.id));
      setDeleteProduct(null);
      
      toast({
        title: 'موفقیت',
        description: 'محصول تحقیقی با موفقیت حذف شد.',
      });
      
      await reloadProducts();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در حذف محصول تحقیقی',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedProducts.length === 0) return;

    try {
      if (action === 'delete') {
        await Promise.all(
          selectedProducts.map(id => adminApi.deleteResearchProduct(Number(id)))
        );
      } else {
        const statusMap: Record<string, string> = {
          'activate': 'active',
          'deactivate': 'inactive',
        };
        await Promise.all(
          selectedProducts.map(id => 
            adminApi.updateResearchProductStatus(Number(id), statusMap[action])
          )
        );
      }

      setSelectedProducts([]);
      await reloadProducts();
      
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">مدیریت محصولات تحقیقی</h1>
            <p className="text-muted-foreground">لیست تمامی محصولات تحقیقی در سیستم</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              محصول جدید
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
                    placeholder="جستجو بر اساس نام، HS Code یا دسته‌بندی..."
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
        {selectedProducts.length > 0 && (
          <Card className="border-primary/50 bg-primary/5 animate-scale-in">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <span className="text-sm text-foreground font-medium">
                  {selectedProducts.length} محصول انتخاب شده
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
                      if (confirm(`آیا از حذف ${selectedProducts.length} محصول اطمینان دارید؟`)) {
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

        {/* Products List */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">لیست محصولات تحقیقی ({products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Box className="w-12 h-12 text-muted-foreground" />
                  <p className="text-muted-foreground">هیچ محصول تحقیقی یافت نشد</p>
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
                          checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts(paginatedProducts.map(p => p.id));
                            } else {
                              setSelectedProducts([]);
                            }
                          }}
                          className="w-4 h-4 rounded border-border"
                        />
                      </th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">نام</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">HS Code</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">دسته‌بندی</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">کشور هدف</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">حاشیه سود</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">وضعیت</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((product, index) => {
                      const StatusIcon = statusConfig[product.status].icon;
                      return (
                        <tr
                          key={product.id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors animate-fade-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product.id)}
                              onChange={() => toggleSelectProduct(product.id)}
                              className="w-4 h-4 rounded border-border"
                            />
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-foreground">{product.name}</p>
                              {product.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm font-mono text-foreground">{product.hs_code || '-'}</span>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-xs">
                              {product.category}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-foreground">{product.target_country || '-'}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-sm font-medium text-success">{product.profit_margin || '-'}</span>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant="outline"
                              className={cn('text-xs', statusConfig[product.status].className)}
                            >
                              <StatusIcon className="w-3 h-3 ml-1" />
                              {statusConfig[product.status].label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setViewProduct(product)}
                                title="مشاهده"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setEditProduct(product)}
                                title="ویرایش"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon-sm" 
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteProduct(product)}
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
                  نمایش {((currentPage - 1) * itemsPerPage) + 1} تا {Math.min(currentPage * itemsPerPage, totalProducts)} از {totalProducts} محصول
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
                    <SelectItem value="12">۱۲</SelectItem>
                    <SelectItem value="24">۲۴</SelectItem>
                    <SelectItem value="48">۴۸</SelectItem>
                    <SelectItem value="96">۹۶</SelectItem>
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
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <ViewResearchProductDialog
        open={!!viewProduct}
        onOpenChange={(open) => !open && setViewProduct(null)}
        product={viewProduct}
      />

      <AddResearchProductDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => {
          reloadProducts();
          setIsAddDialogOpen(false);
        }}
      />

      <EditResearchProductDialog
        open={!!editProduct}
        onOpenChange={(open) => !open && setEditProduct(null)}
        product={editProduct}
        onSuccess={() => {
          reloadProducts();
          setEditProduct(null);
        }}
      />

      <DeleteResearchProductDialog
        open={!!deleteProduct}
        onOpenChange={(open) => !open && setDeleteProduct(null)}
        product={deleteProduct}
        onConfirm={handleDeleteProduct}
        isDeleting={isDeleting}
      />
    </AdminLayout>
  );
}

