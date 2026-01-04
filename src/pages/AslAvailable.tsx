import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LicenseGate } from '@/components/LicenseGate';
import HeaderAuth from '@/components/ui/HeaderAuth';
import { Badge } from "@/components/ui/badge";
import { apiService } from "@/services/api";
import { getFirstImageUrl } from '@/utils/imageUrl';
import { Pagination } from "@/components/ui/pagination";
import { ContactViewButton } from '@/components/ContactViewButton';
import { 
  Package, 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  User,
  Percent,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ExternalLink,
  Phone,
  Mail,
  MessageCircle,
  Weight,
  Globe
} from "lucide-react";

interface AvailableProduct {
  id: number;
  sale_type: 'wholesale' | 'retail';
  product_name: string;
  category: string;
  subcategory?: string;
  description?: string;
  wholesale_price?: string;
  retail_price?: string;
  export_price?: string;
  currency?: string;
  available_quantity?: number;
  min_order_quantity?: number;
  max_order_quantity?: number;
  unit?: string;
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
  can_export?: boolean;
  requires_license?: boolean;
  license_type?: string;
  export_countries?: string;
  image_urls?: string;
  video_url?: string;
  catalog_url?: string;
  is_featured?: boolean;
  is_hot_deal?: boolean;
  tags?: string;
  notes?: string;
  status: string;
  added_by?: {
    first_name: string;
    last_name: string;
  };
  supplier?: {
    id?: number;
    brand_name?: string;
    full_name: string;
  };
  created_at: string;
}

const AslAvailable = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  
  // Read search query from URL on mount
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch) {
      setSearchTerm(urlSearch);
    }
  }, [searchParams]);
  
  // Real data states
  const [products, setProducts] = useState<AvailableProduct[]>([]);
  const [categories, setCategoriesData] = useState<string[]>(['زعفران', 'خرما', 'خشکبار', 'صنایع دستی']); // Fallback categories
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  // Load data from API - load all products for client-side filtering and pagination
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
               // Load products with server-side pagination (much faster!)
               try {
                 const productsResponse = await apiService.getAvailableProducts({
                   page: currentPage,
                   per_page: itemsPerPage,
                   category: selectedCategory !== "all" ? selectedCategory : undefined,
                   status: selectedCondition !== "all" ? selectedCondition : undefined,
                   search: searchTerm.trim() || undefined,
                 });
                 console.log('Products response:', productsResponse);
                 
                 // Handle different response formats
                 let products = [];
                 let total = 0;
                 let pages = 1;
                 
                 if (Array.isArray(productsResponse)) {
                   products = productsResponse;
                   total = productsResponse.length;
                   pages = 1;
                 } else if (productsResponse?.products && Array.isArray(productsResponse.products)) {
                   products = productsResponse.products;
                   total = productsResponse.total || productsResponse.pagination?.total || products.length;
                   pages = productsResponse.total_pages || productsResponse.pagination?.total_pages || Math.ceil(total / itemsPerPage);
                 } else if (productsResponse?.data && Array.isArray(productsResponse.data)) {
                   products = productsResponse.data;
                   total = productsResponse.total || products.length;
                   pages = productsResponse.total_pages || Math.ceil(total / itemsPerPage);
                 }
                 
                 setProducts(products);
                 setTotalPages(pages);
                 setTotalItems(total);
               } catch (productsErr: any) {
                 console.error('Error loading products:', productsErr);
                 setError('خطا در بارگذاری کالاها');
                 setProducts([]);
                 setTotalPages(1);
               }
        
        // Load categories separately
        try {
          const categoriesResponse = await apiService.getAvailableProductCategories();
          console.log('Categories response:', categoriesResponse);
          
          // Handle different response formats
          let categories = [];
          if (Array.isArray(categoriesResponse)) {
            categories = categoriesResponse;
          } else if (categoriesResponse?.categories && Array.isArray(categoriesResponse.categories)) {
            categories = categoriesResponse.categories;
          }
          
          if (categories.length > 0) {
            setCategoriesData(categories);
          }
          // Keep fallback categories if API returns empty
        } catch (categoriesErr) {
          console.error('Error loading categories:', categoriesErr);
          // Keep fallback categories
        }
        
      } catch (err) {
        console.error('Error loading available products:', err);
        setError('خطا در بارگذاری کالاها');
        setProducts([]);
        setCategoriesData([]);
      } finally {
        setLoading(false);
      }
    };

           loadData();
         }, [currentPage, selectedCategory, selectedCondition, searchTerm]);

  // Static filter options
  const conditions = [
    { id: "all", name: "همه وضعیت‌ها" },
    { id: "new", name: "جدید" },
    { id: "sample", name: "نمونه" },
    { id: "used", name: "استفاده شده" }
  ];

  const locations = [
    { id: "all", name: "همه مکان‌ها" },
    { id: "tehran", name: "تهران" },
    { id: "isfahan", name: "اصفهان" },
    { id: "mashhad", name: "مشهد" },
    { id: "shiraz", name: "شیراز" }
  ];

  // Helper function to convert numbers to Farsi
  const toFarsiNumber = (num: number) => {
    return num.toLocaleString('fa-IR');
  };

  // Client-side filtering for search and location (category and condition are handled by server)
  const filteredItems = products.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === "all" || item.location.includes(selectedLocation);
    
    return matchesSearch && matchesLocation;
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedCondition, searchTerm, selectedLocation]);

  // Check if page was opened from search
  const isFromSearch = searchParams.get('search') !== null;

  return (
    <LicenseGate>
      <div className="min-h-screen bg-background" dir="rtl">
        {isFromSearch && <HeaderAuth />}
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-900/20 to-green-800/20 border-green-700/50 rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-3xl flex items-center justify-center">
              <Package className="w-8 h-8 text-green-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">کالاهای موجود</h2>
              <p className="text-green-600 dark:text-green-300">محصولات آماده برای فروش افیلیتی</p>
            </div>
            <div className="mr-auto flex items-center gap-3">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 rounded-2xl">
                {totalItems > 0 ? toFarsiNumber(totalItems) : products.length} کالا موجود
              </Badge>
              <Button
                onClick={() => navigate("/submit-product")}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                ثبت کالا
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="bg-card/80 border-border rounded-3xl">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="جستجو در محصولات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 bg-muted border-border text-foreground rounded-2xl"
              />
            </div>

            {/* Filters */}
            <div className="grid md:grid-cols-4 gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-muted border-border text-foreground rounded-2xl">
                  <SelectValue placeholder="دسته‌بندی" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  <SelectItem value="all" className="text-foreground">
                    همه محصولات
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} className="text-foreground">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                <SelectTrigger className="bg-muted border-border text-foreground rounded-2xl">
                  <SelectValue placeholder="وضعیت" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  {conditions.map((condition) => (
                    <SelectItem key={condition.id} value={condition.id} className="text-foreground">
                      {condition.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="bg-muted border-border text-foreground rounded-2xl">
                  <SelectValue placeholder="مکان" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id} className="text-foreground">
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted rounded-2xl">
                <Filter className="w-4 h-4 ml-2" />
                فیلتر پیشرفته
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Grid */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">در حال بارگذاری کالاها...</p>
        </div>
             ) : error ? (
               <Card className="bg-card/80 border-border rounded-3xl">
                 <CardContent className="p-8 text-center">
                   <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                   <h3 className="text-xl font-semibold text-foreground mb-2">خطا در بارگذاری</h3>
                   <p className="text-muted-foreground">{error}</p>
                 </CardContent>
               </Card>
             ) : filteredItems.length === 0 ? (
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">هیچ کالایی یافت نشد</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory !== "all" ? 'برای جستجوی مورد نظر نتیجه‌ای یافت نشد' : 'هنوز کالایی برای نمایش وجود ندارد'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
          <Card key={item.id} className="bg-card/80 border-border hover:border-border transition-all group rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              {item.image_urls && item.image_urls.trim() ? (
                <div className="relative">
                  <img
                    src={getFirstImageUrl(item.image_urls)}
                    alt={item.product_name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.style.display = 'none';
                    }}
                  />
                  <div className="absolute top-4 right-4">
                    {item.is_featured && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 rounded-full">
                        برجسته
                      </Badge>
                    )}
                  </div>
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {item.sale_type === 'wholesale' ? (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 rounded-full">
                        فروش عمده
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 rounded-full">
                        فروش تکی
                      </Badge>
                    )}
                    {item.is_hot_deal && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 rounded-full">
                        تخفیف ویژه
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                // Show badges even without image
                <div className="relative bg-muted/20 h-32 flex items-center justify-center">
                  <Package className="w-16 h-16 text-muted-foreground" />
                  <div className="absolute top-4 right-4">
                    {item.is_featured && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 rounded-full">
                        برجسته
                      </Badge>
                    )}
                  </div>
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {item.sale_type === 'wholesale' ? (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 rounded-full">
                        فروش عمده
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 rounded-full">
                        فروش تکی
                      </Badge>
                    )}
                    {item.is_hot_deal && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 rounded-full">
                        تخفیف ویژه
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="p-6">
                <h4 className="font-bold text-foreground mb-2 group-hover:text-green-600 dark:group-hover:text-green-300 transition-colors">
                  {item.product_name}
                </h4>
                <p className="text-muted-foreground text-sm mb-4">{item.description}</p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">موجودی:</span>
                    <span className="text-foreground">{item.available_quantity} {item.unit}</span>
                  </div>
                  
                  {item.sale_type === 'wholesale' && item.wholesale_price && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">قیمت عمده:</span>
                      <span className="text-foreground font-bold">{item.wholesale_price} {item.currency}</span>
                    </div>
                  )}
                  
                  {item.sale_type === 'retail' && item.retail_price && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">قیمت خرده:</span>
                      <span className="text-foreground font-bold">{item.retail_price} {item.currency}</span>
                    </div>
                  )}
                  
                  {item.quality && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">کیفیت:</span>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 rounded-full">
                        {item.quality}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">مکان:</span>
                    <span className="text-foreground">{item.location}</span>
                  </div>
                  
                  {item.added_by && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">اضافه شده توسط:</span>
                      <span className="text-foreground">{item.added_by.first_name} {item.added_by.last_name}</span>
                    </div>
                  )}
                  
                  {item.brand && (
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">برند:</span>
                      <span className="text-foreground">{item.brand}</span>
                    </div>
                  )}
                  
                  {/* Contact Phone with Limit */}
                  {(item.contact_phone || item.added_by) && (
                    <div className="flex items-center justify-between gap-2 text-sm pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">شماره تماس:</span>
                      </div>
                      <ContactViewButton
                        targetType="available_product"
                        targetId={item.id}
                        targetName={item.product_name}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
            ))}
          </div>
          
          {/* Pagination */}
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}
          </div>
        </div>
      </div>
    </LicenseGate>
  );
};

export default AslAvailable;
