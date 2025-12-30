import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/lib/api/adminApi';
import { Loader2 } from 'lucide-react';
import { AddProductDialog } from '@/components/products/AddProductDialog';
import { EditProductDialog } from '@/components/products/EditProductDialog';
import { ViewProductDialog } from '@/components/products/ViewProductDialog';
import { DeleteProductDialog } from '@/components/products/DeleteProductDialog';
import { ProductsFilters } from '@/components/products/ProductsFilters';
import {
  Search,
  Plus,
  Package,
  Edit,
  Trash2,
  Eye,
  Image as ImageIcon,
  DollarSign,
  Box,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { productCategories } from '@/lib/validations/product';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  tags?: string[];
  imageUrl?: string;
  discount?: number;
  sku?: string;
  createdAt: string;
  sales?: number;
  revenue?: number;
}

const initialProducts: Product[] = [
  {
    id: '1',
    name: 'پکیج آموزشی طلایی',
    description: 'پکیج کامل آموزش برنامه‌نویسی',
    price: 5000000,
    category: 'package',
    stock: 50,
    status: 'active',
    tags: ['آموزشی', 'پیشرفته'],
    discount: 10,
    sku: 'PKG-001',
    createdAt: '۱۴۰۳/۰۹/۱۵',
    sales: 234,
    revenue: 23400000,
  },
  {
    id: '2',
    name: 'اشتراک ویژه سالانه',
    description: 'اشتراک یکساله با تمام امکانات',
    price: 2000000,
    category: 'subscription',
    stock: 100,
    status: 'active',
    tags: ['اشتراک', 'ویژه'],
    sku: 'SUB-001',
    createdAt: '۱۴۰۳/۰۹/۱۴',
    sales: 189,
    revenue: 18900000,
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
  out_of_stock: {
    label: 'ناموجود',
    className: 'bg-destructive/10 text-destructive',
    icon: AlertCircle,
  },
};

type SortField = 'name' | 'category' | 'price' | 'stock' | 'status' | 'sales' | 'revenue' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function AvailableProducts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<('active' | 'inactive' | 'out_of_stock')[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minStock, setMinStock] = useState('');
  const [maxStock, setMaxStock] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [products, setProducts] = useState<Product[]>([]);
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

        const response = await adminApi.getAvailableProducts({
          page: currentPage,
          per_page: itemsPerPage,
          status: statusFilterValue,
          category: categoryFilterValue,
        });

        if (response) {
          // Backend returns: { products: [...], pagination: {...} }
          const productsData = response.products || [];
          const pagination = response.pagination || {};
          
          const transformedProducts: Product[] = productsData.map((p: any) => ({
            id: p.id?.toString() || p.ID?.toString() || '',
            name: p.product_name || p.name || 'بدون نام',
            description: p.description || '',
            price: p.wholesale_price || p.retail_price || p.export_price || 0,
            category: p.category || 'other',
            stock: p.available_quantity || 0,
            status: p.status || 'active',
            tags: Array.isArray(p.tags) 
              ? p.tags 
              : (typeof p.tags === 'string' && p.tags.trim() 
                  ? p.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
                  : []),
            imageUrl: p.image_urls?.[0] || p.imageUrl || '',
            discount: p.discount || 0,
            sku: p.sku || '',
            createdAt: p.created_at || new Date().toISOString(),
            sales: p.sales || 0,
            revenue: p.revenue || 0,
          }));

          setProducts(transformedProducts);
          setTotalProducts(pagination.total || response.total || 0);
          setTotalPages(pagination.total_pages || response.total_pages || 1);
        }
      } catch (error: any) {
        console.error('Error loading products:', error);
        toast({
          title: 'خطا',
          description: error.message || 'خطا در بارگذاری محصولات',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [currentPage, itemsPerPage, statusFilter, categoryFilter]);

  // Use products directly from API (already filtered and paginated)
  const paginatedProducts = products;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const getCategoryLabel = (category: string) => {
    return productCategories.find(cat => cat.value === category)?.label || category;
  };

  const handleProductAdded = () => {
    const stored = localStorage.getItem('asll-products');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setProducts(parsed);
      } catch {}
    }
  };

  const toggleSelectProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
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

  const handleDeleteProduct = async () => {
    if (!deleteProduct) return;
    
    setIsDeleting(true);
    try {
      await adminApi.deleteAvailableProduct(Number(deleteProduct.id));
      
      setProducts(prev => prev.filter(p => p.id !== deleteProduct.id));
      setSelectedProducts(prev => prev.filter(id => id !== deleteProduct.id));
      setDeleteProduct(null);
      
      toast({
        title: 'موفقیت',
        description: 'کالا با موفقیت حذف شد.',
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در حذف کالا',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'out_of_stock' | 'delete') => {
    if (selectedProducts.length === 0) return;

    try {
      if (action === 'delete') {
        // Delete all selected products
        await Promise.all(
          selectedProducts.map(id => adminApi.deleteAvailableProduct(Number(id)))
        );
        setProducts(prev => prev.filter(p => !selectedProducts.includes(p.id)));
      } else {
        // Update status for all selected products
        const statusMap: Record<string, string> = {
          'activate': 'active',
          'deactivate': 'inactive',
          'out_of_stock': 'out_of_stock',
        };
        await Promise.all(
          selectedProducts.map(id => 
            adminApi.updateAvailableProductStatus(Number(id), statusMap[action])
          )
        );
        // Reload products to get updated status
        const response = await adminApi.getAvailableProducts({
          page: currentPage,
          per_page: itemsPerPage,
        });
        if (response && response.products) {
          const transformedProducts: Product[] = response.products.map((p: any) => ({
            id: p.id?.toString() || '',
            name: p.product_name || p.name || 'بدون نام',
            description: p.description || '',
            price: p.wholesale_price || p.retail_price || 0,
            category: p.category || 'other',
            stock: p.available_quantity || 0,
            status: p.status || 'active',
            tags: Array.isArray(p.tags) 
              ? p.tags 
              : (typeof p.tags === 'string' && p.tags.trim() 
                  ? p.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
                  : []),
            imageUrl: p.image_urls?.[0] || '',
            discount: p.discount || 0,
            sku: p.sku || '',
            createdAt: p.created_at || new Date().toISOString(),
            sales: p.sales || 0,
            revenue: p.revenue || 0,
          }));
          setProducts(transformedProducts);
        }
      }

      setSelectedProducts([]);
      
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
    setMinPrice('');
    setMaxPrice('');
    setMinStock('');
    setMaxStock('');
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

  const finalPrice = (product: Product) => {
    if (product.discount && product.discount > 0) {
      return product.price * (1 - product.discount / 100);
    }
    return product.price;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">مدیریت کالاهای موجود</h1>
            <p className="text-muted-foreground">لیست تمامی کالاهای موجود در سیستم</p>
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
                    placeholder="جستجو بر اساس نام، SKU، دسته‌بندی یا توضیحات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pr-10 pl-4 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  />
                </div>
                <ProductsFilters
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  categoryFilter={categoryFilter}
                  onCategoryFilterChange={setCategoryFilter}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  onMinPriceChange={setMinPrice}
                  onMaxPriceChange={setMaxPrice}
                  minStock={minStock}
                  maxStock={maxStock}
                  onMinStockChange={setMinStock}
                  onMaxStockChange={setMaxStock}
                  onReset={handleResetFilters}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    List
                  </Button>
                </div>
                {(statusFilter.length > 0 || categoryFilter.length > 0 || minPrice || maxPrice || minStock || maxStock) && (
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
                    onClick={() => handleBulkAction('out_of_stock')}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <AlertCircle className="w-4 h-4 ml-2" />
                    ناموجود
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

        {/* Products Grid/List */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">لیست محصولات ({products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {paginatedProducts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Package className="w-12 h-12 text-muted-foreground" />
                  <p className="text-muted-foreground">هیچ محصولی یافت نشد</p>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedProducts.map((product, index) => {
                  const StatusIcon = statusConfig[product.status].icon;
                  return (
            <Card
              key={product.id}
              className="hover:shadow-lg transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg mb-2 line-clamp-2">{product.name}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(product.category)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', statusConfig[product.status].className)}
                      >
                        <StatusIcon className="w-3 h-3 ml-1" />
                        {statusConfig[product.status].label}
                      </Badge>
                    </div>
                  </div>
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-16 h-16 rounded-lg object-cover border border-border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center border border-border">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">قیمت:</span>
                    <div className="flex items-center gap-2">
                      {product.discount && product.discount > 0 && (
                        <span className="text-xs text-muted-foreground line-through">
                          {product.price.toLocaleString('fa-IR')}
                        </span>
                      )}
                      <span className="font-bold text-foreground">
                        {finalPrice(product).toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  </div>
                  {product.discount && product.discount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">تخفیف:</span>
                      <Badge variant="destructive" className="text-xs">
                        {product.discount}%
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">موجودی:</span>
                    <span className={cn(
                      'text-sm font-medium',
                      product.stock === 0 ? 'text-destructive' : 'text-foreground'
                    )}>
                      {product.stock} عدد
                    </span>
                  </div>
                  {product.sku && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">SKU:</span>
                      <span className="text-sm font-mono text-foreground">{product.sku}</span>
                    </div>
                  )}
                  {product.sales !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">فروش:</span>
                      <span className="text-sm font-medium text-success">{product.sales} عدد</span>
                    </div>
                  )}
                </div>

                {product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {product.tags.map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    className="flex-1"
                    onClick={() => setViewProduct(product)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    className="flex-1"
                    onClick={() => setEditProduct(product)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    className="flex-1 text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteProduct(product)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
                  </Card>
                );
              })}
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
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">تصویر</th>
                      <th className="p-4 text-right">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          نام
                          {getSortIcon('name')}
                        </button>
                      </th>
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
                          onClick={() => handleSort('price')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          قیمت
                          {getSortIcon('price')}
                        </button>
                      </th>
                      <th className="p-4 text-right">
                        <button
                          onClick={() => handleSort('stock')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          موجودی
                          {getSortIcon('stock')}
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
                            {product.imageUrl ? (
                              <div className="w-16 h-16 rounded-lg overflow-hidden border border-border">
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center border border-border">
                                <ImageIcon className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-foreground">{product.name}</p>
                              {product.sku && (
                                <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-xs">
                              {getCategoryLabel(product.category)}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {product.discount && product.discount > 0 && (
                                <span className="text-xs text-muted-foreground line-through">
                                  {product.price.toLocaleString('fa-IR')}
                                </span>
                              )}
                              <span className="font-bold text-foreground">
                                {finalPrice(product).toLocaleString('fa-IR')} تومان
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={cn(
                              'text-sm font-medium',
                              product.stock === 0 ? 'text-destructive' : 'text-foreground'
                            )}>
                              {product.stock} عدد
                            </span>
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

      {/* Dialog افزودن محصول */}
      <AddProductDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleProductAdded}
      />

      {/* Dialog مشاهده محصول */}
      <ViewProductDialog
        open={!!viewProduct}
        onOpenChange={(open) => !open && setViewProduct(null)}
        product={viewProduct}
      />

      {/* Dialog ویرایش محصول */}
      <EditProductDialog
        open={!!editProduct}
        onOpenChange={(open) => !open && setEditProduct(null)}
        product={editProduct}
        onSuccess={() => {
          const stored = localStorage.getItem('asll-products');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setProducts(parsed);
            } catch {}
          }
          setEditProduct(null);
        }}
      />

      {/* Dialog حذف محصول */}
      <DeleteProductDialog
        open={!!deleteProduct}
        onOpenChange={(open) => !open && setDeleteProduct(null)}
        product={deleteProduct}
        onConfirm={handleDeleteProduct}
        isDeleting={isDeleting}
      />
    </AdminLayout>
  );
}

