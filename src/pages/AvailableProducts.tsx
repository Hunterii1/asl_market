import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, MapPin, Phone, Mail, MessageSquare, Star, TrendingUp, RefreshCw, Search, Filter, ShoppingCart, ExternalLink } from 'lucide-react';
import { apiService } from '@/services/api';

interface AvailableProduct {
  id: number;
  product_name: string;
  category: string;
  subcategory?: string;
  description?: string;
  wholesale_price?: string;
  retail_price?: string;
  export_price?: string;
  currency: string;
  available_quantity: number;
  min_order_quantity: number;
  max_order_quantity?: number;
  unit: string;
  brand?: string;
  model?: string;
  origin?: string;
  quality?: string;
  packaging_type?: string;
  weight?: string;
  dimensions?: string;
  shipping_cost?: string;
  location: string;
  contact_phone?: string;
  contact_email?: string;
  contact_whatsapp?: string;
  can_export: boolean;
  requires_license: boolean;
  license_type?: string;
  export_countries?: string;
  image_urls?: string;
  video_url?: string;
  catalog_url?: string;
  status: string;
  is_featured: boolean;
  is_hot_deal: boolean;
  tags?: string;
  notes?: string;
  added_by: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  supplier?: {
    id: number;
    full_name: string;
    brand_name?: string;
    city: string;
  };
  created_at: string;
  updated_at: string;
}

const AvailableProducts: React.FC = () => {
  const [products, setProducts] = useState<AvailableProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage] = useState(20);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        per_page: perPage,
      };
      
      if (selectedCategory) {
        params.category = selectedCategory;
      }
      if (featuredOnly) {
        params.featured_only = true;
      }
      
      const [productsResponse, categoriesResponse] = await Promise.all([
        apiService.getAvailableProducts(params),
        apiService.getAvailableProductCategories()
      ]);
      
      setProducts(productsResponse.products || []);
      setTotal(productsResponse.total || 0);
      setCategories(categoriesResponse.categories || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page, selectedCategory, featuredOnly]);

  const filteredProducts = products.filter(product =>
    product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getQualityColor = (quality?: string) => {
    switch (quality?.toLowerCase()) {
      case 'a+': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'a': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'b': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'c': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatPrice = (price?: string, currency?: string) => {
    if (!price) return 'قیمت ندارد';
    return `${price} ${currency || 'USD'}`;
  };

  const handleRefresh = () => {
    setPage(1);
    loadProducts();
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-blue-700/50 rounded-3xl mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-3xl flex items-center justify-center">
                <Package className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">کالاهای موجود</h1>
                <p className="text-blue-300">مجموعه کاملی از محصولات آماده فروش</p>
              </div>
              <div className="mr-auto">
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 rounded-2xl">
                  {total.toLocaleString()} کالا
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="bg-card/80 border-border rounded-3xl mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">جستجو</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="جستجو در نام، توضیحات، برند..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 rounded-2xl border-muted"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">دسته‌بندی</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="rounded-2xl border-muted">
                    <SelectValue placeholder="همه دسته‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">همه دسته‌ها</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">فیلتر</label>
                <div className="flex gap-2">
                  <Button
                    variant={featuredOnly ? "default" : "outline"}
                    onClick={() => setFeaturedOnly(!featuredOnly)}
                    className="rounded-2xl flex-1"
                  >
                    <Star className="w-4 h-4 ml-2" />
                    {featuredOnly ? "همه" : "برجسته"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">عملیات</label>
                <Button onClick={handleRefresh} className="rounded-2xl w-full">
                  <RefreshCw className="w-4 h-4 ml-2" />
                  بروزرسانی
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              در حال بارگذاری کالاها...
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="bg-card/80 border-border rounded-3xl">
            <CardContent className="p-8 text-center">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">هیچ کالایی یافت نشد</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory || featuredOnly ? 'برای فیلتر اعمال شده نتیجه‌ای یافت نشد' : 'هنوز کالایی ثبت نشده است'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="bg-card/80 border-border rounded-3xl hover:shadow-lg transition-all duration-300 hover:border-border/80">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg text-foreground line-clamp-2">{product.product_name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="rounded-xl text-xs">
                          {product.category}
                        </Badge>
                        {product.subcategory && (
                          <Badge variant="outline" className="rounded-xl text-xs">
                            {product.subcategory}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {product.is_featured && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 rounded-xl text-xs">
                          <Star className="w-3 h-3 ml-1" />
                          برجسته
                        </Badge>
                      )}
                      {product.is_hot_deal && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 rounded-xl text-xs">
                          <TrendingUp className="w-3 h-3 ml-1" />
                          ویژه
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Description */}
                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                  )}

                  {/* Product Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {product.brand && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">برند:</span>
                        <span className="text-foreground font-medium">{product.brand}</span>
                      </div>
                    )}
                    {product.origin && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">منشاء:</span>
                        <span className="text-foreground">{product.origin}</span>
                      </div>
                    )}
                    {product.quality && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">کیفیت:</span>
                        <Badge className={`${getQualityColor(product.quality)} rounded-xl text-xs`}>
                          {product.quality}
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">موجودی:</span>
                      <span className="text-foreground font-medium">{product.available_quantity.toLocaleString()} {product.unit}</span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="bg-muted/20 rounded-2xl p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">قیمت عمده:</span>
                      <span className="text-foreground font-medium">{formatPrice(product.wholesale_price, product.currency)}</span>
                    </div>
                    {product.retail_price && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">قیمت خرده:</span>
                        <span className="text-foreground font-medium">{formatPrice(product.retail_price, product.currency)}</span>
                      </div>
                    )}
                    {product.export_price && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">قیمت صادرات:</span>
                        <span className="text-foreground font-medium">{formatPrice(product.export_price, product.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm border-t border-border pt-2">
                      <span className="text-muted-foreground">حداقل سفارش:</span>
                      <span className="text-foreground font-medium">{product.min_order_quantity.toLocaleString()} {product.unit}</span>
                    </div>
                  </div>

                  {/* Location & Contact */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{product.location}</span>
                    </div>
                    {product.can_export && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 rounded-xl text-xs">
                        قابل صادرات
                      </Badge>
                    )}
                  </div>

                  {/* Contact Actions */}
                  <div className="flex gap-2 pt-2">
                    {product.contact_phone && (
                      <Button variant="outline" size="sm" className="flex-1 rounded-2xl">
                        <Phone className="w-4 h-4 ml-2" />
                        تماس
                      </Button>
                    )}
                    {product.contact_whatsapp && (
                      <Button variant="outline" size="sm" className="flex-1 rounded-2xl">
                        <MessageSquare className="w-4 h-4 ml-2" />
                        واتساپ
                      </Button>
                    )}
                    {product.contact_email && (
                      <Button variant="outline" size="sm" className="flex-1 rounded-2xl">
                        <Mail className="w-4 h-4 ml-2" />
                        ایمیل
                      </Button>
                    )}
                  </div>

                  {/* Additional Info */}
                  <div className="text-xs text-muted-foreground border-t border-border pt-2">
                    <div className="flex justify-between">
                      <span>ثبت شده توسط: {product.added_by.first_name} {product.added_by.last_name}</span>
                      <span>{new Date(product.created_at).toLocaleDateString('fa-IR')}</span>
                    </div>
                    {product.supplier && (
                      <div className="mt-1">
                        تأمین‌کننده: {product.supplier.brand_name || product.supplier.full_name}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > perPage && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-2xl"
              >
                قبلی
              </Button>
              <div className="flex items-center gap-2 px-4">
                <span className="text-sm text-muted-foreground">
                  صفحه {page} از {Math.ceil(total / perPage)}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => setPage(Math.min(Math.ceil(total / perPage), page + 1))}
                disabled={page >= Math.ceil(total / perPage)}
                className="rounded-2xl"
              >
                بعدی
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailableProducts;