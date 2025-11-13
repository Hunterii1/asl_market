import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LicenseGate } from '@/components/LicenseGate';
import { DailyLimitsDisplay } from '@/components/DailyLimitsDisplay';
import { ContactViewButton } from '@/components/ContactViewButton';
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/hooks/useAuth';
import { apiService } from "@/services/api";
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
  Building
} from "lucide-react";

const AslSupplier = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [approvedSuppliers, setApprovedSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [userSupplierStatus, setUserSupplierStatus] = useState(null);

  const productCategories = [
    { id: "all", name: "همه محصولات" },
    { id: "saffron", name: "زعفران" },
    { id: "dates", name: "خرما" },
    { id: "pistachios", name: "پسته" },
    { id: "carpets", name: "فرش" },
    { id: "handicrafts", name: "صنایع دستی" }
  ];

  // Load suppliers data from API
  useEffect(() => {
    const loadSuppliersData = async () => {
      try {
        setLoadingSuppliers(true);
        const response = await apiService.getApprovedSuppliers();
        setApprovedSuppliers(response.suppliers || []);
      } catch (error) {
        console.error('Error loading suppliers:', error);
        // Set empty array on error to prevent map error
        setApprovedSuppliers([]);
      } finally {
        setLoadingSuppliers(false);
      }
    };

    loadSuppliersData();
  }, []);

  const filteredSuppliers = approvedSuppliers
    .filter(supplier => {
      const matchesSearch = supplier.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.city?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      // Featured suppliers first
      if (a.is_featured === true && b.is_featured !== true) return -1;
      if (a.is_featured !== true && b.is_featured === true) return 1;
      // Then by creation date (newest first)
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });



  useEffect(() => {
    if (user) {
      loadApprovedSuppliers();
      checkUserSupplierStatus();
  
    }
  }, [user]);



  const loadApprovedSuppliers = async () => {
    try {
      const response = await apiService.getApprovedSuppliers();
      setApprovedSuppliers(response.suppliers || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      // اگر خطا لایسنس باشد، نیازی نیست کاری انجام دهیم زیرا LicenseGate خودکار هندل می‌کند
    } finally {
      setLoadingSuppliers(false);
    }
  };

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
          <div className="flex items-center justify-between">
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

      {/* Daily Limits Display */}
      <DailyLimitsDisplay className="mb-6" />

      {/* Search and Filter */}
      <Card className="bg-card/80 border-border rounded-3xl">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="جستجو در تأمین‌کنندگان..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 bg-muted border-border text-foreground rounded-2xl"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {productCategories.map((category) => (
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
          </div>


        </CardContent>
      </Card>

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
                {filteredSuppliers.length} تأمین‌کننده
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
              {searchTerm ? 'برای جستجوی مورد نظر نتیجه‌ای یافت نشد' : 'هنوز تأمین‌کننده تأیید شده‌ای وجود ندارد'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => (
          <Card key={supplier.id} className="bg-card/80 border-border hover:border-orange-400/40 transition-all rounded-3xl group">
            <CardContent className="p-6">
              {/* نام محصول اصلی - اول */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {supplier.is_featured === true && (
                      <span className="text-yellow-500 text-lg">⭐</span>
                    )}
                    <h4 className="font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors">
                      {supplier.products?.[0]?.product_name || supplier.brand_name || supplier.full_name}
                    </h4>
                    {supplier.status === 'approved' && (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-yellow-400 font-medium">4.5</span>
                    <span className="text-muted-foreground text-sm">(تازه عضو)</span>
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
                <span className="text-sm font-medium text-foreground">{supplier.brand_name || supplier.full_name}</span>
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
            </CardContent>
          </Card>
        ))}
        </div>
      )}
    </div>
  );

  return (
    <LicenseGate>
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
            <div className="text-2xl font-bold text-foreground">۱۲۴</div>
            <p className="text-sm text-muted-foreground">تأمین‌کننده فعال</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۸۹%</div>
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
            <div className="text-2xl font-bold text-foreground">۳۴۵</div>
            <p className="text-sm text-muted-foreground">محصول موجود</p>
          </CardContent>
        </Card>
      </div>
    </div>
    </LicenseGate>
  );
};

export default AslSupplier;