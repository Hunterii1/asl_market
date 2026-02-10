import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LicenseGate } from '@/components/LicenseGate';
import { SupplierLimitsDisplay } from '@/components/SupplierLimitsDisplay';
import { ContactViewButton } from '@/components/ContactViewButton';
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/hooks/useAuth';
import { apiService } from "@/services/api";
import { getImageUrl } from '@/utils/imageUrl';
import { PRODUCT_CATEGORIES, SUPPLIER_SERVICES_DISCLAIMER } from '@/constants/productCategories';
import { Pagination } from "@/components/ui/pagination";
import HeaderAuth from '@/components/ui/HeaderAuth';
import { SupplierPreviewDialog } from "@/components/SupplierPreviewDialog";
import { 
  Users, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Package,
  Eye,
  Lock,
  Unlock,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Building,
  X,
  Flame,
  ArrowLeft
} from "lucide-react";

const SUPPLIER_TAG_OPTIONS = [
  { id: 'first_class', name: 'دسته اول' },
  { id: 'good_price', name: 'خوش قیمت' },
  { id: 'export_experience', name: 'سابقه صادرات' },
  { id: 'export_packaging', name: 'بسته‌بندی صادراتی' },
  { id: 'supply_without_capital', name: 'تأمین بدون سرمایه' },
];

const productCategoriesForFilter = [
  { id: 'all', name: 'همه محصولات' },
  ...PRODUCT_CATEGORIES.map((c) => ({ id: c.id, name: c.name })),
];

const AslSupplier = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Read filters from URL on mount
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    const urlProduct = searchParams.get('product_type');
    const urlCity = searchParams.get('city');
    const urlTag = searchParams.get('tag');
    if (urlSearch != null) setSearchTerm(urlSearch);
    if (urlProduct != null && urlProduct !== 'all') setSelectedProduct(urlProduct);
    if (urlCity != null) setCityFilter(urlCity);
    if (urlTag != null) {
      const tags = urlTag.split(',').map(t => t.trim()).filter(Boolean);
      setSelectedTags(tags);
    }
  }, [searchParams]);
  
  // Debounce search input (400ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      debounceRef.current = null;
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);
  
  // Sync URL with filters
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (searchTerm.trim()) next.set('search', searchTerm.trim()); else next.delete('search');
    if (selectedProduct !== 'all') next.set('product_type', selectedProduct); else next.delete('product_type');
    if (cityFilter.trim()) next.set('city', cityFilter.trim()); else next.delete('city');
    if (selectedTags.length) next.set('tag', selectedTags.join(',')); else next.delete('tag');
    setSearchParams(next, { replace: true });
  }, [searchTerm, selectedProduct, cityFilter, selectedTags]);

  const [approvedSuppliers, setApprovedSuppliers] = useState<any[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [userSupplierStatus, setUserSupplierStatus] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  // Matching-capacity slider data (suppliers نزدیک پر شدن ظرفیت در ASL Match)
  const [capacitySuppliers, setCapacitySuppliers] = useState<any[]>([]);
  const [loadingCapacity, setLoadingCapacity] = useState(true);

  // Load suppliers data from API with pagination, search, city and tags
  useEffect(() => {
    const loadSuppliersData = async () => {
      try {
        setLoadingSuppliers(true);
        const response = await apiService.getApprovedSuppliers({
          page: currentPage,
          per_page: itemsPerPage,
          search: debouncedSearch || undefined,
          product_type: selectedProduct !== "all" ? selectedProduct : undefined,
          city: cityFilter.trim() || undefined,
          tag: selectedTags.length ? selectedTags.join(',') : undefined,
        });
        setApprovedSuppliers(response.suppliers || []);
        setTotalPages(response.total_pages || 1);
        setTotalItems(response.total || 0);
      } catch (error) {
        console.error('Error loading suppliers:', error);
        setApprovedSuppliers([]);
        setTotalPages(1);
      } finally {
        setLoadingSuppliers(false);
      }
    };

    loadSuppliersData();
  }, [currentPage, debouncedSearch, selectedProduct, cityFilter, selectedTags]);

  // Load matching-capacity suppliers for slider (independent از صفحه‌بندی اصلی)
  useEffect(() => {
    const loadCapacityData = async () => {
      try {
        setLoadingCapacity(true);
        // capacity=5 (سقف ۵ درخواست)، limit=20 و بعداً در فرانت دسته‌بندی می‌کنیم
        const response = await apiService.getSupplierMatchingCapacity({
          capacity: 5,
          limit: 20,
        });
        setCapacitySuppliers(response.suppliers || []);
      } catch (error) {
        console.error('Error loading supplier matching capacity:', error);
        setCapacitySuppliers([]);
      } finally {
        setLoadingCapacity(false);
      }
    };

    loadCapacityData();
  }, []);

  // Helper function to convert numbers to Farsi
  const toFarsiNumber = (num: number) => {
    return num.toLocaleString('fa-IR');
  };

  // Server handles search and filtering now, so only sort needed
  const filteredSuppliers = approvedSuppliers.sort((a, b) => {
    // Featured suppliers first (only if property exists)
    const aFeatured = a.hasOwnProperty('is_featured') && a.is_featured === true;
    const bFeatured = b.hasOwnProperty('is_featured') && b.is_featured === true;
    
    if (aFeatured && !bFeatured) return -1;
    if (!aFeatured && bFeatured) return 1;
    // Then by creation date (newest first)
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  // Featured suppliers slider (top suppliers)
  const featuredSuppliers = filteredSuppliers.filter(
    (supplier) => supplier.hasOwnProperty('is_featured') && supplier.is_featured === true
  );
  const featuredSliderSuppliers = featuredSuppliers.slice(0, 10);
  const hasFeaturedSlider = featuredSliderSuppliers.length > 0;

  // Radar visualization data (محدود به چند تأمین‌کننده نزدیک/برگزیده)
  const radarSuppliers = featuredSuppliers.length > 0
    ? featuredSuppliers.slice(0, 8)
    : filteredSuppliers.slice(0, 8);

  // Reset to page 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedProduct, cityFilter, selectedTags]);

  const hasActiveFilters = !!(searchTerm.trim() || selectedProduct !== 'all' || cityFilter.trim() || selectedTags.length);
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedProduct('all');
    setCityFilter('');
    setSelectedTags([]);
    setCurrentPage(1);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);
  };

  // --- Matching-capacity slider helpers ---
  const capacity = 5;

  const nearFullSuppliers = capacitySuppliers.filter((item) => item.remaining_slots <= 1);
  const midSuppliers = capacitySuppliers.filter(
    (item) => item.remaining_slots >= 2 && item.remaining_slots <= 2
  );

  // اگر nearFull خالی بود، از mid پرش می‌کنیم که اسلایدر خالی نباشد
  const sliderSuppliers = (nearFullSuppliers.length > 0 ? nearFullSuppliers : midSuppliers).slice(0, 9);

  const hasSlider = !loadingCapacity && sliderSuppliers.length > 0;

  // Supplier preview dialog state (برای اسلایدرها)
  const [previewSupplier, setPreviewSupplier] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);



  useEffect(() => {
    if (user) {
      checkUserSupplierStatus();
    }
  }, [user]);

  const checkUserSupplierStatus = async () => {
    try {
      const response = await apiService.getSupplierStatus();
      setUserSupplierStatus(response);
    } catch (error) {
      console.error('Error checking supplier status:', error);
    }
  };

  const SupplierBrowser = () => (
    <div className="space-y-6">
      {/* Supplier Registration Link */}
      <Card className="bg-gradient-to-r from-green-900/20 to-green-800/20 border-green-700/50 rounded-3xl">
        <CardContent className="p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">تأمین‌کننده هستید؟</h3>
                <p className="text-green-600 dark:text-green-300">در شبکه تأمین‌کنندگان اصل مارکت عضو شوید</p>
              </div>
              <Button
                className="bg-green-500 hover:bg-green-600 rounded-2xl"
                onClick={() => navigate('/supplier-registration')}
              >
                <Plus className="w-4 h-4 ml-2" />
                ثبت‌نام تأمین‌کننده
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{SUPPLIER_SERVICES_DISCLAIMER}</p>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Status Link */}
      {userSupplierStatus?.has_supplier && (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer mb-6" onClick={() => navigate('/supplier-status')}>
          <CardContent className="p-4 text-center">
            <div className="mb-2">
              <CheckCircle className="w-8 h-8 mx-auto text-green-500" />
            </div>
            <h3 className="font-semibold">وضعیت تأمین‌کننده من</h3>
            <p className="text-sm text-muted-foreground">مشاهده وضعیت درخواست شما</p>
          </CardContent>
        </Card>
      )}

      {/* Supplier Limits Display */}
      <SupplierLimitsDisplay className="mb-6" />

      {/* Supplier Radar Map – نمایش تأمین‌کننده‌ها دور کاربر مثل نقشه */}
      {radarSuppliers.length > 0 && (
        <Card className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-slate-800/70 rounded-3xl mb-6 overflow-hidden">
          <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5 sm:gap-6 items-stretch">
            {/* Radar graphic */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-44 h-44 sm:w-52 sm:h-52">
                {/* Outer soft ring */}
                <div className="absolute inset-1 rounded-full border border-orange-500/15" />

                {/* Rotating sweep line (radar effect) */}
                <div
                  className="absolute inset-3 rounded-full border-t-2 border-l-2 border-orange-400/60 border-transparent animate-spin"
                  style={{ animationDuration: "14s" }}
                />

                {/* Middle glow */}
                <div className="absolute inset-7 rounded-full bg-gradient-to-br from-orange-500/20 via-slate-900/90 to-purple-700/40 blur-xl animate-pulse" />

                {/* Inner circle (user / Asl Market) */}
                <div className="absolute inset-14 rounded-full bg-slate-950/95 border border-slate-700/70 flex flex-col items-center justify-center gap-1 shadow-lg shadow-orange-500/20">
                  <div className="relative">
                    {/* Ping effect */}
                    <span className="absolute inset-0 rounded-2xl bg-orange-400/30 animate-ping" />
                    <div className="relative w-9 h-9 rounded-2xl bg-orange-500/25 flex items-center justify-center">
                      <Users className="w-5 h-5 text-orange-200" />
                    </div>
                  </div>
                  <span className="text-xs text-slate-100 font-semibold mt-1">
                    اصل مارکت
                  </span>
                  <span className="text-[10px] text-slate-400">
                    مرکز شبکه تأمین
                  </span>
                </div>

                {/* Orbiting suppliers */}
                {radarSuppliers.map((supplier, index) => {
                  const count = radarSuppliers.length;
                  const angle = (index / count) * 2 * Math.PI;
                  const radius = 38; // in percent
                  const cx = 50 + radius * Math.cos(angle);
                  const cy = 50 + radius * Math.sin(angle);
                  const label =
                    supplier.brand_name ||
                    supplier.full_name ||
                    supplier.city ||
                    `#${supplier.id}`;

                  return (
                    <button
                      key={supplier.id ?? index}
                      type="button"
                      className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none"
                      style={{
                        left: `${cx}%`,
                        top: `${cy}%`,
                      }}
                      onClick={() => {
                        setPreviewSupplier(supplier);
                        setIsPreviewOpen(true);
                      }}
                    >
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-orange-500/70 to-amber-400/90 shadow-lg shadow-orange-500/40 flex items-center justify-center border border-white/70 group-hover:scale-110 group-hover:shadow-orange-400/70 transition-transform duration-300">
                        <span className="text-[10px] sm:text-xs font-bold text-slate-950 line-clamp-1 px-1">
                          {label.slice(0, 4)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Text + list on the side */}
            <div className="flex-1 flex flex-col gap-3 justify-center">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground mb-1 flex items-center gap-2">
                  تأمین‌کنندگان اطراف شما در شبکه اصل مارکت
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  این نقشه مفهومی، تأمین‌کننده‌های برگزیده و نزدیک به نیازهای شما را
                  دور هستهٔ «اصل مارکت» نشان می‌دهد. روی هر نقطه کلیک کنید تا
                  جزئیات آن تأمین‌کننده را ببینید.
                </p>
              </div>
              <div className="space-y-2 max-h-32 sm:max-h-36 overflow-y-auto pr-1">
                {radarSuppliers.map((supplier) => (
                  <button
                    key={`list-${supplier.id}`}
                    type="button"
                    onClick={() => {
                      setPreviewSupplier(supplier);
                      setIsPreviewOpen(true);
                    }}
                    className="w-full flex items-center justify-between gap-2 rounded-2xl bg-slate-900/70 border border-slate-700/70 px-3 py-1.5 hover:border-orange-500/60 hover:bg-slate-900 transition-colors text-right"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <Users className="w-3 h-3 text-orange-300" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {supplier.brand_name || supplier.full_name}
                        </p>
                        {supplier.city && (
                          <p className="text-[11px] text-slate-400 truncate">
                            {supplier.city}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-orange-300 whitespace-nowrap">
                      مشاهده
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matching-capacity slider: تأمین‌کننده‌هایی که نزدیک پر شدن ظرفیت ASL Match هستند */}
      {hasSlider && (
        <Card className="bg-gradient-to-r from-red-900/20 via-orange-900/20 to-amber-900/20 border-red-700/40 rounded-3xl mb-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-red-500/20 flex items-center justify-center">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-lg text-foreground">
                    تأمین‌کنندگان پرتقاضا در ASL Match
                  </CardTitle>
                  <p className="text-[11px] sm:text-sm text-red-200">
                    این تأمین‌کنندگان نزدیک پر شدن ظرفیت ۵ درخواست همزمان هستند
                  </p>
                </div>
              </div>
              <Badge className="bg-red-500/20 text-red-200 border-red-500/40 rounded-2xl text-xs">
                {toFarsiNumber(sliderSuppliers.length)} تأمین‌کننده
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-1 px-1">
              {sliderSuppliers.map((item) => {
                const supplier = item.supplier || item.Supplier || item;
                const remainingSlots = item.remaining_slots ?? Math.max(0, capacity - (item.active_requests ?? 0));
                const activeRequests = item.active_requests ?? (capacity - remainingSlots);
                return (
                  <div
                    key={supplier.id}
                    className="min-w-[180px] sm:min-w-[220px] max-w-[230px] sm:max-w-[260px] bg-card/80 border border-red-500/30 rounded-2xl p-3 flex-shrink-0 hover:border-orange-400/60 hover:shadow-lg transition-all duration-300 snap-start cursor-pointer"
                    onClick={() => {
                      setPreviewSupplier(supplier);
                      setIsPreviewOpen(true);
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-2xl bg-red-500/20 flex items-center justify-center">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 text-red-300" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs sm:text-sm font-bold text-foreground line-clamp-1">
                          {supplier.brand_name || supplier.full_name}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-red-200 flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                          <span>
                            {toFarsiNumber(
                              (supplier.average_rating && supplier.average_rating > 0
                                ? supplier.average_rating
                                : supplier.is_featured
                                ? 5
                                : 0
                              ) || 0
                            )}★
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="line-clamp-1">{supplier.city}</span>
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-red-100 bg-red-500/10 border border-red-500/30 rounded-xl px-2 py-1 flex items-center justify-between mb-2">
                      <span>درخواست‌های فعال:</span>
                      <span className="font-bold">
                        {toFarsiNumber(activeRequests)} / {toFarsiNumber(capacity)}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-100 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-2 py-1 flex items-center justify-between">
                      <span>ظرفیت باقیمانده:</span>
                      <span className="font-bold">
                        {remainingSlots > 0 ? `${toFarsiNumber(remainingSlots)} جای خالی` : 'در حال تکمیل'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <Card className="bg-card/80 border-border rounded-3xl">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="جستجو در تأمین‌کنندگان (نام، برند، شهر، آدرس...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 bg-muted border-border text-foreground rounded-2xl"
                />
              </div>
              <div className="flex gap-2 items-center shrink-0">
                <Input
                  placeholder="شهر"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-32 bg-muted border-border rounded-2xl"
                />
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="rounded-2xl">
                    <X className="w-4 h-4 ml-1" />
                    پاک کردن فیلترها
                  </Button>
                )}
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto flex-wrap">
              {productCategoriesForFilter.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedProduct === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedProduct(category.id)}
                  className={`rounded-2xl whitespace-nowrap ${
                    selectedProduct === category.id
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {category.name}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground ml-2">تگ‌ها:</span>
              {SUPPLIER_TAG_OPTIONS.map((tag) => (
                <Button
                  key={tag.id}
                  variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleTag(tag.id)}
                  className={`rounded-2xl ${
                    selectedTags.includes(tag.id)
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {tag.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Featured Suppliers Slider */}
      {hasFeaturedSlider && (
        <Card className="bg-gradient-to-r from-amber-900/20 via-yellow-900/20 to-orange-900/20 border-amber-500/40 rounded-3xl mb-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-lg text-foreground">
                    تأمین‌کنندگان برگزیده اصل مارکت
                  </CardTitle>
                  <p className="text-[11px] sm:text-sm text-amber-100/80">
                    بهترین تأمین‌کننده‌ها با امتیاز بالا و تگ‌های ویژه
                  </p>
                </div>
              </div>
              <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/40 rounded-2xl text-xs">
                {toFarsiNumber(featuredSliderSuppliers.length)} تأمین‌کننده برگزیده
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-1 px-1">
              {featuredSliderSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="min-w-[180px] sm:min-w-[220px] max-w-[230px] sm:max-w-[260px] bg-card/90 border border-amber-500/40 rounded-2xl p-3 flex-shrink-0 hover:border-yellow-400/70 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 group cursor-pointer snap-start"
                  onClick={() => {
                    setPreviewSupplier(supplier);
                    setIsPreviewOpen(true);
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-2xl bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 text-amber-200" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs sm:text-sm font-bold text-foreground line-clamp-1">
                        {supplier.brand_name || supplier.full_name}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-amber-100 flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-300 flex-shrink-0" />
                        <span>
                          {toFarsiNumber(
                            (supplier.average_rating && supplier.average_rating > 0
                              ? supplier.average_rating
                              : 5
                            ) || 5
                          )}★
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* City */}
                  {supplier.city && (
                    <div className="text-[10px] sm:text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="line-clamp-1">{supplier.city}</span>
                    </div>
                  )}

                  {/* Tags */}
                  {(supplier.tag_first_class ||
                    supplier.tag_good_price ||
                    supplier.tag_export_experience ||
                    supplier.tag_export_packaging ||
                    supplier.tag_supply_without_capital) && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {supplier.tag_first_class && (
                        <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/40 rounded-xl text-[10px]">
                          دسته اول
                        </Badge>
                      )}
                      {supplier.tag_good_price && (
                        <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-500/40 rounded-xl text-[10px]">
                          خوش قیمت
                        </Badge>
                      )}
                      {supplier.tag_export_experience && (
                        <Badge className="bg-sky-500/20 text-sky-200 border-sky-500/40 rounded-xl text-[10px]">
                          سابقه صادرات
                        </Badge>
                      )}
                      {supplier.tag_export_packaging && (
                        <Badge className="bg-violet-500/20 text-violet-200 border-violet-500/40 rounded-xl text-[10px]">
                          بسته‌بندی صادراتی
                        </Badge>
                      )}
                      {supplier.tag_supply_without_capital && (
                        <Badge className="bg-slate-500/20 text-slate-200 border-slate-500/40 rounded-xl text-[10px]">
                          تأمین بدون سرمایه
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <div className="mt-2 flex items-center justify-between text-[10px] sm:text-[11px] text-amber-100/90">
                    <span className="truncate">مشاهده تأمین‌کنندگان مشابه</span>
                    <ArrowLeft className="w-3 h-3 flex-shrink-0 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approved Suppliers Section */}
      <Card className="bg-gradient-to-r from-orange-900/20 to-orange-800/20 border-orange-700/50 rounded-3xl mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-3xl flex items-center justify-center">
              <Users className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">تأمین‌کنندگان تأیید شده</h2>
              <p className="text-orange-300">فهرست کامل تأمین‌کنندگان با مجوز فعالیت</p>
            </div>
            <div className="mr-auto">
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 rounded-2xl">
                {toFarsiNumber(totalItems)} تأمین‌کننده
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers List */}
      {loadingSuppliers ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">در حال بارگذاری تأمین‌کنندگان...</p>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-8 text-center">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">هیچ تأمین‌کننده‌ای یافت نشد</h3>
            <p className="text-muted-foreground">
              {hasActiveFilters
                ? 'با فیلترهای فعلی نتیجه‌ای یافت نشد. فیلترها را تغییر دهید یا پاک کنید.'
                : 'هنوز تأمین‌کننده تأیید شده‌ای وجود ندارد'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="mt-4 rounded-2xl">
                <X className="w-4 h-4 ml-2" />
                پاک کردن فیلترها
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier) => (
          <Card key={supplier.id} className="bg-card/80 border-border hover:border-orange-400/40 transition-all rounded-3xl group overflow-hidden">
            <CardContent className="p-0">
              {/* Supplier Image */}
              {supplier.image_url && supplier.image_url.trim() ? (
                <div className="relative">
                  <img
                    src={getImageUrl(supplier.image_url)}
                    alt={supplier.brand_name || supplier.full_name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.style.display = 'none';
                    }}
                  />
                  {supplier.is_featured === true && supplier.hasOwnProperty('is_featured') && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full px-3 py-1 text-sm font-medium">
                        ⭐ برگزیده
                      </span>
                    </div>
                  )}
                </div>
              ) : null}
              
              <div className="p-6">
              {/* نام محصول اصلی - اول */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors">
                      {supplier.products?.[0]?.product_name || supplier.brand_name || supplier.full_name}
                    </h4>
                    {supplier.status === 'approved' && (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-yellow-400 font-medium">
                      {supplier.is_featured ? '5.0' : (supplier.average_rating?.toFixed(1) || '0.0')}
                    </span>
                    {supplier.total_ratings > 0 ? (
                      <span className="text-muted-foreground text-sm">({supplier.total_ratings} امتیاز)</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">(بدون امتیاز)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* آدرس - دوم */}
              <div className="flex items-start gap-2 text-muted-foreground text-sm mb-3">
                <MapPin className="w-4 h-4 mt-0.5" />
                <div className="flex-1">
                  <span className="block font-medium text-foreground mb-1">آدرس:</span>
                  <span className="block">{supplier.address}</span>
                </div>
              </div>

              {/* شهر - سوم */}
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                <Building className="w-4 h-4" />
                <span className="font-medium text-foreground">شهر:</span>
                <span>{supplier.city}</span>
              </div>

              {/* نام تامین‌کننده - چهارم */}
              <div className="mb-3">
                <button
                  onClick={() => navigate(`/profile/${supplier.user_id}`)}
                  className="text-sm font-medium text-foreground hover:text-orange-500 transition-colors underline decoration-dotted"
                >
                  {supplier.brand_name || supplier.full_name}
                </button>
              </div>

              {/* اطلاعات کسب‌وکار */}
              <div className="bg-muted/30 rounded-2xl p-4 mb-4">
                <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  اطلاعات کسب‌وکار
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span className="text-muted-foreground">تعداد محصولات:</span>
                    <span className="text-foreground">{supplier.products?.length || 0}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-muted-foreground">وضعیت عضویت:</span>
                    <span className="text-foreground">عضو جدید</span>
                  </div>
                  
                  {supplier.has_registered_business && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-muted-foreground">کسب‌وکار ثبت شده:</span>
                      <span className="text-green-400">بله</span>
                    </div>
                  )}
                  
                  {supplier.has_export_experience && (
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-muted-foreground">تجربه صادرات:</span>
                      <span className="text-yellow-400">دارد</span>
                    </div>
                  )}

                  {supplier.can_produce_private_label && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="text-muted-foreground">تولید برند اختصاصی:</span>
                      <span className="text-blue-400">قابل انجام</span>
                    </div>
                  )}
                </div>
              </div>

              {/* تگ‌های تأمین‌کننده */}
              {(supplier.tag_first_class || supplier.tag_good_price || supplier.tag_export_experience || supplier.tag_export_packaging || supplier.tag_supply_without_capital) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {supplier.tag_first_class && (
                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30 rounded-xl text-xs">تأمین‌کننده دسته اول</Badge>
                  )}
                  {supplier.tag_good_price && (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30 rounded-xl text-xs">خوش قیمت</Badge>
                  )}
                  {supplier.tag_export_experience && (
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30 rounded-xl text-xs">سابقه صادرات</Badge>
                  )}
                  {supplier.tag_export_packaging && (
                    <Badge variant="secondary" className="bg-violet-500/20 text-violet-400 border-violet-500/30 rounded-xl text-xs">بسته‌بندی صادراتی</Badge>
                  )}
                  {supplier.tag_supply_without_capital && (
                    <Badge variant="secondary" className="bg-slate-500/20 text-slate-400 border-slate-500/30 rounded-xl text-xs">تأمین بدون سرمایه</Badge>
                  )}
                </div>
              )}

              {/* محصولات */}
              <div className="mb-4">
                <span className="text-muted-foreground text-sm block mb-2">محصولات:</span>
                <div className="flex flex-wrap gap-1">
                  {supplier.products?.map((product, index) => (
                    <Badge key={index} variant="secondary" className="bg-muted text-muted-foreground rounded-xl text-xs">
                      {product.product_name || product}
                    </Badge>
                  ))}
                </div>
              </div>

              {supplier.business_registration_num && (
                <div className="mb-4">
                  <span className="text-muted-foreground text-sm block mb-2">مجوز کسب‌وکار:</span>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 rounded-xl text-xs">
                    {supplier.business_registration_num}
                  </Badge>
                </div>
              )}

              {/* Contact Information (Hidden) */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">+98xxxxxxxxxx</span>
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
                
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">xxx@xxxx.xxx</span>
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <div className="flex justify-center">
                <ContactViewButton
                  targetType="supplier"
                  targetId={supplier.id}
                  targetName={supplier.business_name || supplier.full_name}
                  className="rounded-2xl"
                  variant="outline"
                  size="sm"
                />
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

      {/* Global Supplier Preview Dialog برای این صفحه (با دکمه دیدن اطلاعات تماس) */}
      <SupplierPreviewDialog
        supplier={previewSupplier}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        showContactButton
      />
    </div>
  );

  // Check if page was opened from search
  const isFromSearch = searchParams.get('search') !== null;

  return (
    <LicenseGate>
      <div className="min-h-screen bg-background" dir="rtl">
        <HeaderAuth />
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="space-y-6 animate-fade-in transition-colors duration-300">
        {/* Header */}
        <Card className="bg-gradient-to-r from-orange-900/20 to-orange-800/20 border-orange-700/50 rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-3xl flex items-center justify-center">
                <Users className="w-8 h-8 text-orange-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">تأمین‌کنندگان اصل</h2>
                <p className="text-orange-600 dark:text-orange-300">شبکه تأمین‌کنندگان معتبر و باکیفیت</p>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Content */}
      <SupplierBrowser />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{totalItems > 0 ? toFarsiNumber(totalItems) : '۰'}</div>
            <p className="text-sm text-muted-foreground">تأمین‌کننده فعال</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {totalItems > 0 ? '۱۰۰%' : '۰%'}
            </div>
            <p className="text-sm text-muted-foreground">تأیید شده</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۴.۷</div>
            <p className="text-sm text-muted-foreground">امتیاز میانگین</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">-</div>
            <p className="text-sm text-muted-foreground">محصول موجود</p>
          </CardContent>
        </Card>
      </div>
          </div>
        </div>
      </div>
    </LicenseGate>
  );
};

export default AslSupplier;