import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LicenseGate } from '@/components/LicenseGate';
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
  Plus
} from "lucide-react";

const AslSupplier = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dailyContactsUsed, setDailyContactsUsed] = useState(1);
  const maxDailyContacts = 3;
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
      } finally {
        setLoadingSuppliers(false);
      }
    };

    loadSuppliersData();
  }, []);

  const filteredSuppliers = approvedSuppliers.filter(supplier => {
    const matchesSearch = supplier.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.main_products?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleRevealContact = (supplierId: number) => {
    if (dailyContactsUsed >= maxDailyContacts) {
      alert("شما امروز حداکثر تعداد مجاز برای مشاهده اطلاعات تماس را استفاده کرده‌اید.");
      return;
    }
    
    setDailyContactsUsed(prev => prev + 1);
    // Update supplier contact revealed status
    // This would typically be handled by a state management solution
  };

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

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/approved-suppliers')}>
          <CardContent className="p-4 text-center">
            <div className="mb-2">
              <Users className="w-8 h-8 mx-auto text-primary" />
            </div>
            <h3 className="font-semibold">مشاهده تأمین‌کنندگان</h3>
            <p className="text-sm text-muted-foreground">فهرست کامل تأمین‌کنندگان تأیید شده</p>
          </CardContent>
        </Card>
        
        {userSupplierStatus?.has_supplier && (
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/supplier-status')}>
            <CardContent className="p-4 text-center">
              <div className="mb-2">
                <CheckCircle className="w-8 h-8 mx-auto text-green-500" />
              </div>
              <h3 className="font-semibold">وضعیت تأمین‌کننده من</h3>
              <p className="text-sm text-muted-foreground">مشاهده وضعیت درخواست شما</p>
            </CardContent>
          </Card>
        )}
      </div>

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

          {/* Daily Contact Limit */}
          <div className="bg-muted/50 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                <span className="text-foreground font-medium">مشاهده اطلاعات تماس روزانه</span>
              </div>
              <Badge className={`rounded-full ${
                dailyContactsUsed >= maxDailyContacts 
                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                  : "bg-green-500/20 text-green-400 border-green-500/30"
              }`}>
                {dailyContactsUsed} از {maxDailyContacts}
              </Badge>
            </div>
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${(dailyContactsUsed / maxDailyContacts) * 100}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => (
          <Card key={supplier.id} className="bg-card/80 border-border hover:border-orange-400/40 transition-all rounded-3xl group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors">{supplier.name}</h4>
                    {supplier.isVerified && (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-yellow-400 font-medium">{supplier.rating}</span>
                    <span className="text-muted-foreground text-sm">({supplier.reviewCount} نظر)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <MapPin className="w-4 h-4" />
                  {supplier.city}، {supplier.province}
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Package className="w-4 h-4" />
                  {supplier.products.length} محصول
                </div>

                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock className="w-4 h-4" />
                  عضو از {supplier.joinDate}
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Package className="w-4 h-4" />
                  ظرفیت: {supplier.capacity}
                </div>

                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Users className="w-4 h-4" />
                  اندازه: {supplier.companySize}
                </div>
              </div>

              <p className="text-muted-foreground text-sm mb-4">{supplier.description}</p>

              <div className="mb-4">
                <span className="text-muted-foreground text-sm block mb-2">محصولات:</span>
                <div className="flex flex-wrap gap-1">
                  {supplier.products.map((product, index) => (
                    <Badge key={index} variant="secondary" className="bg-muted text-muted-foreground rounded-xl text-xs">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <span className="text-muted-foreground text-sm block mb-2">گواهینامه‌ها:</span>
                <div className="flex flex-wrap gap-1">
                  {supplier.certifications.map((cert, index) => (
                    <Badge key={index} className="bg-blue-500/20 text-blue-400 border-blue-500/30 rounded-xl text-xs">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {supplier.contactRevealed ? (
                    <span className="text-foreground">{supplier.phone}</span>
                  ) : (
                    <span className="text-muted-foreground">09XX-XXX-XXXX</span>
                  )}
                  {!supplier.contactRevealed && dailyContactsUsed >= maxDailyContacts && (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {supplier.contactRevealed ? (
                    <span className="text-foreground">{supplier.email}</span>
                  ) : (
                    <span className="text-muted-foreground">***@***.ir</span>
                  )}
                  {!supplier.contactRevealed && dailyContactsUsed >= maxDailyContacts && (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {!supplier.contactRevealed && dailyContactsUsed < maxDailyContacts ? (
                  <Button 
                    size="sm" 
                    className="flex-1 bg-orange-500 hover:bg-orange-600 rounded-2xl"
                    onClick={() => handleRevealContact(supplier.id)}
                  >
                    <Unlock className="w-4 h-4 ml-2" />
                    باز کردن اطلاعات تماس
                  </Button>
                ) : supplier.contactRevealed ? (
                  <Button 
                    size="sm" 
                    className="flex-1 bg-green-500 hover:bg-green-600 rounded-2xl"
                  >
                    <CheckCircle className="w-4 h-4 ml-2" />
                    اطلاعات باز شده
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1 border-border text-muted-foreground rounded-2xl"
                    disabled
                  >
                    <AlertTriangle className="w-4 h-4 ml-2" />
                    حد روزانه تمام شده
                  </Button>
                )}
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-border text-muted-foreground hover:bg-muted rounded-2xl"
                >
                  جزئیات
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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