import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Plus, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Package,
  Eye,
  Lock,
  Unlock,
  Search,
  Filter,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";

const AslSupplier = () => {
  const [activeTab, setActiveTab] = useState("browse");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dailyContactsUsed, setDailyContactsUsed] = useState(1);
  const maxDailyContacts = 3;

  const productCategories = [
    { id: "all", name: "همه محصولات" },
    { id: "saffron", name: "زعفران" },
    { id: "dates", name: "خرما" },
    { id: "pistachios", name: "پسته" },
    { id: "carpets", name: "فرش" },
    { id: "handicrafts", name: "صنایع دستی" }
  ];

  const suppliers = [
    {
      id: 1,
      name: "شرکت زعفران طلایی",
      contact: "احمد محمدی",
      phone: "09123456789",
      email: "info@goldensaffron.ir",
      city: "مشهد",
      province: "خراسان رضوی",
      products: ["زعفران سرگل", "زعفران پوشال"],
      rating: 4.8,
      reviewCount: 24,
      isVerified: true,
      joinDate: "۱۴۰۲/۰۳/۱۵",
      description: "تولیدکننده زعفران درجه یک با بیش از ۱۰ سال سابقه",
      category: "saffron",
      contactRevealed: false
    },
    {
      id: 2,
      name: "باغات خرمای جنوب",
      contact: "فاطمه احمدی",
      phone: "09187654321",
      email: "dates@south.ir",
      city: "اهواز",
      province: "خوزستان",
      products: ["خرما مجول", "خرما زاهدی", "خرما کبکاب"],
      rating: 4.6,
      reviewCount: 18,
      isVerified: true,
      joinDate: "۱۴۰۲/۰۵/۰۸",
      description: "تولید و بسته‌بندی انواع خرما با کیفیت صادراتی",
      category: "dates",
      contactRevealed: false
    },
    {
      id: 3,
      name: "پسته کرمان",
      contact: "علی رضایی",
      phone: "09131234567",
      email: "pistachio@kerman.ir",
      city: "کرمان",
      province: "کرمان",
      products: ["پسته اکبری", "پسته فندقی", "پسته کله قوچی"],
      rating: 4.9,
      reviewCount: 31,
      isVerified: true,
      joinDate: "۱۴۰۱/۱۲/۲۰",
      description: "بزرگترین تولیدکننده پسته در استان کرمان",
      category: "pistachios",
      contactRevealed: true
    }
  ];

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesProduct = selectedProduct === "all" || supplier.category === selectedProduct;
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.products.some(product => product.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesProduct && matchesSearch;
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

  const SupplierRegistrationForm = () => (
    <Card className="bg-gray-900/50 border-gray-800 rounded-3xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Plus className="w-6 h-6 text-orange-400" />
          ثبت‌نام در تیم تأمین‌کنندگان
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            placeholder="نام شرکت/کسب‌وکار"
            className="bg-gray-800 border-gray-700 text-white rounded-2xl"
          />
          <Input
            placeholder="نام و نام خانوادگی مسئول"
            className="bg-gray-800 border-gray-700 text-white rounded-2xl"
          />
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            placeholder="شماره تماس"
            className="bg-gray-800 border-gray-700 text-white rounded-2xl"
          />
          <Input
            placeholder="ایمیل"
            type="email"
            className="bg-gray-800 border-gray-700 text-white rounded-2xl"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Input
            placeholder="شهر"
            className="bg-gray-800 border-gray-700 text-white rounded-2xl"
          />
          <Input
            placeholder="استان"
            className="bg-gray-800 border-gray-700 text-white rounded-2xl"
          />
        </div>

        <Textarea
          placeholder="آدرس کامل"
          className="bg-gray-800 border-gray-700 text-white rounded-2xl"
          rows={3}
        />

        <Textarea
          placeholder="توضیحات محصولات و خدمات"
          className="bg-gray-800 border-gray-700 text-white rounded-2xl"
          rows={4}
        />

        <div className="flex gap-3">
          <Button className="flex-1 bg-orange-500 hover:bg-orange-600 rounded-2xl">
            ثبت درخواست
          </Button>
          <Button 
            variant="outline" 
            className="border-gray-700 text-gray-300 hover:bg-gray-800 rounded-2xl"
          >
            <ExternalLink className="w-4 h-4 ml-2" />
            لینک مستقیم
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const SupplierBrowser = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card className="bg-gray-900/50 border-gray-800 rounded-3xl">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="جستجو در تأمین‌کنندگان..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 bg-gray-800 border-gray-700 text-white rounded-2xl"
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
                      : "border-gray-700 text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Daily Contact Limit */}
          <div className="bg-gray-800/50 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                <span className="text-white font-medium">مشاهده اطلاعات تماس روزانه</span>
              </div>
              <Badge className={`rounded-full ${
                dailyContactsUsed >= maxDailyContacts 
                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                  : "bg-green-500/20 text-green-400 border-green-500/30"
              }`}>
                {dailyContactsUsed} از {maxDailyContacts}
              </Badge>
            </div>
            <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
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
          <Card key={supplier.id} className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-all rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-white">{supplier.name}</h4>
                    {supplier.isVerified && (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-yellow-400 font-medium">{supplier.rating}</span>
                    <span className="text-gray-400 text-sm">({supplier.reviewCount} نظر)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <MapPin className="w-4 h-4" />
                  {supplier.city}، {supplier.province}
                </div>
                
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Package className="w-4 h-4" />
                  {supplier.products.length} محصول
                </div>

                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Clock className="w-4 h-4" />
                  عضو از {supplier.joinDate}
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-4">{supplier.description}</p>

              <div className="mb-4">
                <span className="text-gray-400 text-sm block mb-2">محصولات:</span>
                <div className="flex flex-wrap gap-1">
                  {supplier.products.map((product, index) => (
                    <Badge key={index} variant="secondary" className="bg-gray-800 text-gray-300 rounded-xl text-xs">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {supplier.contactRevealed || dailyContactsUsed < maxDailyContacts ? (
                    <span className="text-white">{supplier.phone}</span>
                  ) : (
                    <span className="text-gray-500">09XX-XXX-XXXX</span>
                  )}
                  {!supplier.contactRevealed && (
                    <Lock className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {supplier.contactRevealed || dailyContactsUsed < maxDailyContacts ? (
                    <span className="text-white">{supplier.email}</span>
                  ) : (
                    <span className="text-gray-500">***@***.ir</span>
                  )}
                  {!supplier.contactRevealed && (
                    <Lock className="w-4 h-4 text-gray-500" />
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
                    مشاهده اطلاعات تماس
                  </Button>
                ) : supplier.contactRevealed ? (
                  <Button 
                    size="sm" 
                    className="flex-1 bg-green-500 hover:bg-green-600 rounded-2xl"
                  >
                    <CheckCircle className="w-4 h-4 ml-2" />
                    اطلاعات تماس فعال
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1 border-gray-700 text-gray-500 rounded-2xl"
                    disabled
                  >
                    <AlertTriangle className="w-4 h-4 ml-2" />
                    حد روزانه تمام شده
                  </Button>
                )}
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 rounded-2xl"
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card className="bg-gradient-to-r from-orange-900/20 to-orange-800/20 border-orange-700/50 rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-3xl flex items-center justify-center">
              <Users className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">تأمین‌کنندگان اصل</h2>
              <p className="text-orange-300">شبکه تأمین‌کنندگان معتبر و باکیفیت</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex gap-4">
        <Button
          variant={activeTab === "browse" ? "default" : "outline"}
          onClick={() => setActiveTab("browse")}
          className={`rounded-2xl ${
            activeTab === "browse"
              ? "bg-orange-500 hover:bg-orange-600"
              : "border-gray-700 text-gray-300 hover:bg-gray-800"
          }`}
        >
          <Search className="w-4 h-4 ml-2" />
          جستجو تأمین‌کنندگان
        </Button>
        <Button
          variant={activeTab === "register" ? "default" : "outline"}
          onClick={() => setActiveTab("register")}
          className={`rounded-2xl ${
            activeTab === "register"
              ? "bg-orange-500 hover:bg-orange-600"
              : "border-gray-700 text-gray-300 hover:bg-gray-800"
          }`}
        >
          <Plus className="w-4 h-4 ml-2" />
          ثبت‌نام تأمین‌کننده
        </Button>
      </div>

      {/* Content */}
      {activeTab === "browse" ? <SupplierBrowser /> : <SupplierRegistrationForm />}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-800 rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">۱۲۴</div>
            <p className="text-sm text-gray-400">تأمین‌کننده فعال</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900/50 border-gray-800 rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">۸۹%</div>
            <p className="text-sm text-gray-400">تأیید شده</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900/50 border-gray-800 rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">۴.۷</div>
            <p className="text-sm text-gray-400">امتیاز میانگین</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900/50 border-gray-800 rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">۳۴۵</div>
            <p className="text-sm text-gray-400">محصول موجود</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AslSupplier;