import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LicenseGate } from '@/components/LicenseGate';
import { VisitorLimitsDisplay } from '@/components/VisitorLimitsDisplay';
import { ContactViewButton } from '@/components/ContactViewButton';
import HeaderAuth from '@/components/ui/HeaderAuth';
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { 
  Users, 
  MapPin, 
  Star, 
  Phone, 
  Mail, 
  User,
  CheckCircle,
  Clock,
  Plus,
  Languages,
  Briefcase,
  Award,
  Lock,
  Home,
  Plane,
  Search,
  X
} from "lucide-react";

const AslVisit = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCountry, setSelectedCountry] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;
  
  // Read search and country from URL on mount
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    const urlCountry = searchParams.get('country');
    if (urlSearch != null) setSearchTerm(urlSearch);
    if (urlCountry != null) setSelectedCountry(urlCountry);
  }, [searchParams]);

  const countries = [
    { 
      code: "AE", 
      name: "امارات متحده عربی", 
      flag: "🇦🇪",
      cities: ["دبی", "ابوظبی", "شارجه", "عجمان"],
      visitors: 12
    },
    { 
      code: "SA", 
      name: "عربستان سعودی", 
      flag: "🇸🇦",
      cities: ["ریاض", "جده", "دمام", "مکه"],
      visitors: 8
    },
    { 
      code: "KW", 
      name: "کویت", 
      flag: "🇰🇼",
      cities: ["کویت سیتی", "الاحمدی", "حولی"],
      visitors: 5
    },
    { 
      code: "QA", 
      name: "قطر", 
      flag: "🇶🇦",
      cities: ["دوحه", "الریان", "الوکره"],
      visitors: 4
    },
    { 
      code: "BH", 
      name: "بحرین", 
      flag: "🇧🇭",
      cities: ["منامه", "المحرق", "مدینه حمد"],
      visitors: 3
    },
    { 
      code: "OM", 
      name: "عمان", 
      flag: "🇴🇲",
      cities: ["مسقط", "صلاله", "نزوا"],
      visitors: 6
    }
  ];

  // Sync URL with filters
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (searchTerm.trim()) next.set('search', searchTerm.trim()); else next.delete('search');
    if (selectedCountry) next.set('country', selectedCountry); else next.delete('country');
    setSearchParams(next, { replace: true });
  }, [searchTerm, selectedCountry]);

  const cityProvinceForApi = selectedCountry ? (countries.find(c => c.code === selectedCountry)?.name || '') : '';

  // Load visitors data from API with pagination, search and city_province
  useEffect(() => {
    const loadVisitorsData = async () => {
      try {
        setLoading(true);
        const response = await apiService.getApprovedVisitors({
          page: currentPage,
          per_page: itemsPerPage,
          search: searchTerm.trim() || undefined,
          city_province: cityProvinceForApi || undefined,
        });
        setVisitors(response.visitors || []);
        setTotalPages(response.total_pages || 1);
        setTotalItems(response.total || 0);
      } catch (error) {
        console.error('Error loading visitors:', error);
        setVisitors([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    loadVisitorsData();
  }, [currentPage, searchTerm, cityProvinceForApi]);

  // Helper function to convert numbers to Farsi
  const toFarsiNumber = (num: number) => {
    return num.toLocaleString('fa-IR');
  };

  // Helper function for language level display
  const getLanguageText = (level: string) => {
    switch (level) {
      case 'excellent': return '🌟 عالی';
      case 'good': return '👍 خوب';
      case 'weak': return '👎 ضعیف';
      case 'none': return '❌ بلد نیستم';
      default: return level;
    }
  };

  // Server returns filtered list; no client-side filter needed
  const filteredVisitors = visitors;

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCountry]);

  const hasActiveFilters = !!(searchTerm.trim() || selectedCountry);
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCountry('');
    setCurrentPage(1);
  };

  const VisitorBrowser = () => (
    <div className="space-y-6">
      {/* Visitor Limits Display */}
      <VisitorLimitsDisplay className="mb-6" />

      {/* Visitor Registration */}
      <Card className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-blue-700/50 rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">ویزیتور در کشورهای عربی هستید؟</h3>
              <p className="text-blue-600 dark:text-blue-300">در شبکه ویزیتورهای اصل مارکت عضو شوید</p>
            </div>
            <Button className="bg-blue-500 hover:bg-blue-600 rounded-2xl"
            onClick={() => navigate("/visitor-registration")}>
              <Plus className="w-4 h-4 ml-2" />
              ثبت‌نام ویزیتور
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search and Country Filter */}
      <Card className="bg-card border-border rounded-3xl transition-colors duration-300">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="جستجو در ویزیتورها (نام، موبایل، شهر، مهارت...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 bg-muted border-border rounded-2xl"
                />
              </div>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="rounded-2xl shrink-0">
                  <X className="w-4 h-4 ml-2" />
                  پاک کردن فیلترها
                </Button>
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-foreground font-medium mb-3">انتخاب کشور</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {countries.map((country) => (
                  <Button
                    key={country.code}
                    variant={selectedCountry === country.code ? "default" : "outline"}
                    onClick={() => setSelectedCountry(selectedCountry === country.code ? "" : country.code)}
                    className={`rounded-2xl flex justify-between items-center transition-colors duration-300 ${
                      selectedCountry === country.code
                        ? "bg-blue-500 hover:bg-blue-600"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0">{country.flag}</span>
                      <span className="truncate text-right">{country.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{country.code}</span>
                    </span>
                    <Badge className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full shrink-0">
                      {country.visitors}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visitors List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">در حال بارگذاری ویزیتورها...</p>
        </div>
      ) : filteredVisitors.length === 0 ? (
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-8 text-center">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">هیچ ویزیتوری یافت نشد</h3>
            <p className="text-muted-foreground">
              {hasActiveFilters
                ? 'با فیلترهای فعلی نتیجه‌ای یافت نشد. فیلترها را تغییر دهید یا پاک کنید.'
                : 'هنوز ویزیتوری برای نمایش وجود ندارد'}
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
            {filteredVisitors.map((visitor) => (
            <Card key={visitor.id} className="bg-card border-border hover:border-border transition-all rounded-3xl transition-colors duration-300">
              <CardContent className="p-6">
                {/* نام ویزیتور - اول */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-foreground">{visitor.full_name}</h4>
                      {visitor.status === 'approved' && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                      {visitor.passport_number && (
                        <User className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-yellow-400 font-medium">
                        {visitor.is_featured ? '5.0' : (visitor.average_rating?.toFixed(1) || '0.0')}
                      </span>
                      {visitor.total_ratings > 0 ? (
                        <span className="text-muted-foreground text-sm">({visitor.total_ratings} امتیاز)</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">(بدون امتیاز)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* آدرس و محل سکونت - دوم */}
                <div className="flex items-start gap-2 text-muted-foreground text-sm mb-3">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <div className="flex-1">
                    <span className="block font-medium text-foreground mb-1">آدرس محل سکونت:</span>
                    <span className="block">{visitor.residence_address}</span>
                  </div>
                </div>

                {/* شهر/استان - سوم */}
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                  <Home className="w-4 h-4" />
                  <span className="font-medium text-foreground">شهر/استان:</span>
                  <span>{visitor.city_province}</span>
                </div>

                {/* شهرهای مقصد */}
                <div className="flex items-start gap-2 text-muted-foreground text-sm mb-3">
                  <Plane className="w-4 h-4 mt-0.5" />
                  <div className="flex-1">
                    <span className="block font-medium text-foreground mb-1">شهرهای مقصد:</span>
                    <span className="block">{visitor.destination_cities}</span>
                  </div>
                </div>

                {/* آشنای محلی */}
                {visitor.has_local_contact && (
                  <div className="flex items-start gap-2 text-muted-foreground text-sm mb-3">
                    <User className="w-4 h-4 mt-0.5" />
                    <div className="flex-1">
                      <span className="block font-medium text-foreground mb-1">آشنای محلی:</span>
                      <span className="block text-green-400">بله</span>
                      {visitor.local_contact_details && (
                        <span className="block text-xs mt-1">{visitor.local_contact_details}</span>
                      )}
                    </div>
                  </div>
                )}


                {/* تجربه و مهارت‌ها */}
                <div className="space-y-3 mb-4">
                  {visitor.has_marketing_experience && (
                    <div className="flex items-start gap-2 text-muted-foreground text-sm">
                      <Briefcase className="w-4 h-4 mt-0.5" />
                      <div className="flex-1">
                        <span className="block font-medium text-foreground">تجربه بازاریابی:</span>
                        <span className="block text-green-400">دارد</span>
                        {visitor.marketing_experience_desc && (
                          <span className="block text-xs mt-1">{visitor.marketing_experience_desc}</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Languages className="w-4 h-4" />
                    <span className="font-medium text-foreground">سطح زبان:</span>
                    <span>{getLanguageText(visitor.language_level)}</span>
                  </div>

                  {visitor.special_skills && (
                    <div className="flex items-start gap-2 text-muted-foreground text-sm">
                      <Star className="w-4 h-4 mt-0.5" />
                      <div className="flex-1">
                        <span className="block font-medium text-foreground mb-2">مهارت‌های ویژه:</span>
                        <div className="flex flex-wrap gap-1">
                          {visitor.special_skills.split('، ').map((skill, index) => (
                            <Badge key={index} variant="secondary" className="bg-muted text-muted-foreground rounded-xl text-xs">
                              {skill.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {visitor.interested_products && (
                    <div className="flex items-start gap-2 text-muted-foreground text-sm">
                      <Award className="w-4 h-4 mt-0.5 text-yellow-500" />
                      <div className="flex-1">
                        <span className="block font-medium text-foreground mb-1">⭐ محصولات مورد علاقه:</span>
                        <span className="block text-sm">{visitor.interested_products}</span>
                      </div>
                    </div>
                  )}
                </div>



                {/* Contact Information (Hidden) */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground text-sm">+98xxxxxxxxxx</span>
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground text-sm">xxx@xxxx.xxx</span>
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="flex justify-center">
                  <ContactViewButton
                    targetType="visitor"
                    targetId={visitor.id}
                    targetName={visitor.full_name}
                    className="rounded-2xl"
                    variant="outline"
                    size="sm"
                  />
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
      <Card className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-blue-700/50 rounded-3xl transition-colors duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-3xl flex items-center justify-center">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">ویزیتورهای اصل مارکت</h2>
              <p className="text-blue-600 dark:text-blue-300">شبکه نمایندگان در کشورهای عربی</p>
            </div>
            <div className="mr-auto">
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 rounded-2xl">
                {toFarsiNumber(totalItems)} ویزیتور
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/visitor-status")}
          className="rounded-2xl border-border text-muted-foreground hover:bg-muted transition-colors duration-300"
        >
          <CheckCircle className="w-4 h-4 ml-2" />
          وضعیت ویزیتور
        </Button>
      </div>

      {/* Content */}
      <VisitorBrowser />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border rounded-3xl transition-colors duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{totalItems > 0 ? toFarsiNumber(totalItems) : '۰'}</div>
            <p className="text-sm text-muted-foreground">ویزیتور فعال</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border rounded-3xl transition-colors duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۶</div>
            <p className="text-sm text-muted-foreground">کشور تحت پوشش</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border rounded-3xl transition-colors duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۴.۸</div>
            <p className="text-sm text-muted-foreground">امتیاز میانگین</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border rounded-3xl transition-colors duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۹۲%</div>
            <p className="text-sm text-muted-foreground">نرخ موفقیت</p>
          </CardContent>
        </Card>
          </div>
        </div>
        </div>
      </div>
    </LicenseGate>
  );
};

export default AslVisit;