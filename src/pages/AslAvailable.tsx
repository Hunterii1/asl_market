import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LicenseGate } from '@/components/LicenseGate';
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  User,
  Eye,
  ShoppingCart,
  Percent,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ExternalLink
} from "lucide-react";

const AslAvailable = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");

  const categories = [
    { id: "all", name: "همه محصولات", count: 45 },
    { id: "saffron", name: "زعفران", count: 12 },
    { id: "dates", name: "خرما", count: 8 },
    { id: "pistachios", name: "پسته", count: 6 },
    { id: "carpets", name: "فرش", count: 4 },
    { id: "handicrafts", name: "صنایع دستی", count: 15 }
  ];

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

  const availableItems = [
    {
      id: 1,
      name: "زعفران سرگل ممتاز",
      category: "saffron",
      condition: "new",
      quantity: 5,
      unit: "کیلوگرم",
      location: "مشهد",
      owner: "احمد محمدی",
      ownerRating: 4.8,
      price: 850,
      currency: "USD",
      isForSale: true,
      affiliateCommission: 15,
      description: "زعفران درجه یک با کیفیت صادراتی",
      images: ["https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=300"],
      addedDate: "۱۴۰۳/۰۸/۲۰",
      views: 45,
      interested: 8
    },
    {
      id: 2,
      name: "خرما مجول درجه یک",
      category: "dates",
      condition: "sample",
      quantity: 2,
      unit: "کیلوگرم",
      location: "اهواز",
      owner: "فاطمه احمدی",
      ownerRating: 4.6,
      price: 120,
      currency: "USD",
      isForSale: true,
      affiliateCommission: 20,
      description: "نمونه خرما برای تست کیفیت",
      images: ["https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=300"],
      addedDate: "۱۴۰۳/۰۸/۱۸",
      views: 32,
      interested: 5
    },
    {
      id: 3,
      name: "پسته اکبری",
      category: "pistachios",
      condition: "new",
      quantity: 10,
      unit: "کیلوگرم",
      location: "کرمان",
      owner: "علی رضایی",
      ownerRating: 4.9,
      price: 450,
      currency: "USD",
      isForSale: true,
      affiliateCommission: 12,
      description: "پسته تازه برداشت شده",
      images: ["https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=300"],
      addedDate: "۱۴۰۳/۰۸/۲۲",
      views: 28,
      interested: 3
    },
    {
      id: 4,
      name: "فرش دستباف اصفهان",
      category: "carpets",
      condition: "new",
      quantity: 1,
      unit: "عدد",
      location: "اصفهان",
      owner: "مریم صادقی",
      ownerRating: 4.7,
      price: 2500,
      currency: "USD",
      isForSale: false,
      affiliateCommission: 25,
      description: "فرش دستباف با طرح سنتی",
      images: ["https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=300"],
      addedDate: "۱۴۰۳/۰۸/۱۵",
      views: 67,
      interested: 12
    }
  ];

  const filteredItems = availableItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesCondition = selectedCondition === "all" || item.condition === selectedCondition;
    const matchesLocation = selectedLocation === "all" || item.location.includes(selectedLocation);
    
    return matchesSearch && matchesCategory && matchesCondition && matchesLocation;
  });

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "new": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "sample": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "used": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getConditionText = (condition: string) => {
    switch (condition) {
      case "new": return "جدید";
      case "sample": return "نمونه";
      case "used": return "استفاده شده";
      default: return "نامشخص";
    }
  };

  return (
    <LicenseGate>
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
            <div className="mr-auto">
              <Button
                onClick={() => navigate("/available-products")}
                className="bg-green-500 hover:bg-green-600 text-white rounded-2xl flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                مشاهده کالاها
                <ExternalLink className="w-4 h-4" />
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
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id} className="text-foreground">
                      {category.name} ({category.count})
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
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className="bg-card/80 border-border hover:border-border transition-all group rounded-3xl">
            <CardContent className="p-0">
              <div className="relative">
                <img
                  src={item.images[0]}
                  alt={item.name}
                  className="w-full h-48 object-cover rounded-t-3xl"
                />
                <div className="absolute top-4 right-4">
                  <Badge className={`${getConditionColor(item.condition)} rounded-full`}>
                    {getConditionText(item.condition)}
                  </Badge>
                </div>
                <div className="absolute top-4 left-4">
                  {item.isForSale ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 rounded-full">
                      فروش
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 rounded-full">
                      افیلیت
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-6">
                <h4 className="font-bold text-foreground mb-2 group-hover:text-green-600 dark:group-hover:text-green-300 transition-colors">
                  {item.name}
                </h4>
                <p className="text-muted-foreground text-sm mb-4">{item.description}</p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">مقدار:</span>
                    <span className="text-foreground">{item.quantity} {item.unit}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">قیمت:</span>
                    <span className="text-foreground font-bold">${item.price}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">کمیسیون:</span>
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 rounded-full">
                      {item.affiliateCommission}%
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">مکان:</span>
                    <span className="text-foreground">{item.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">فروشنده:</span>
                    <span className="text-foreground">{item.owner}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-yellow-400 text-xs">{item.ownerRating}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {item.views} بازدید
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {item.interested} علاقه‌مند
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-green-500 hover:bg-green-600 rounded-2xl"
                  >
                    <ShoppingCart className="w-4 h-4 ml-2" />
                    شروع فروش
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-border text-muted-foreground hover:bg-muted rounded-2xl"
                  >
                    <Eye className="w-4 h-4 ml-2" />
                    جزئیات
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۴۵</div>
            <p className="text-sm text-muted-foreground">محصول موجود</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۲۸</div>
            <p className="text-sm text-muted-foreground">فروشنده فعال</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۱۵%</div>
            <p className="text-sm text-muted-foreground">میانگین کمیسیون</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">$۱۲,۳۴۵</div>
            <p className="text-sm text-muted-foreground">ارزش کل محصولات</p>
          </CardContent>
        </Card>
      </div>
    </div>
    </LicenseGate>
  );
};

export default AslAvailable;