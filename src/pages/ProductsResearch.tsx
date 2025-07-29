import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Search, 
  TrendingUp, 
 
  DollarSign,
  BarChart3,
  Eye,
  Star,
  Package,
  ArrowUpRight,
  Filter,
  RefreshCw
} from "lucide-react";

const ProductsResearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMarket, setSelectedMarket] = useState("all");

  const categories = [
    { id: "all", name: "همه دسته‌ها" },
    { id: "food", name: "مواد غذایی" },
    { id: "handicrafts", name: "صنایع دستی" },
    { id: "textile", name: "نساجی" },
    { id: "agriculture", name: "کشاورزی" },
    { id: "cosmetics", name: "آرایشی بهداشتی" }
  ];

  const targetMarkets = [
    { id: "all", name: "همه بازارها" },
    { id: "AE", name: "امارات متحده عربی", flag: "🇦🇪" },
    { id: "SA", name: "عربستان سعودی", flag: "🇸🇦" },
    { id: "KW", name: "کویت", flag: "🇰🇼" },
    { id: "QA", name: "قطر", flag: "🇶🇦" },
    { id: "BH", name: "بحرین", flag: "🇧🇭" },
    { id: "OM", name: "عمان", flag: "🇴🇲" }
  ];

  const researchProducts = [
    {
      id: 1,
      name: "زعفران سرگل",
      category: "food",
      exportValue: 2500000, // دلار
      growthRate: 15.2,
      difficulty: "آسان",
      profitMargin: "40-60%",
      targetMarkets: ["AE", "SA", "KW", "QA"],
      description: "محصول پرفروش با تقاضای بالا در کشورهای عربی",
      marketShare: 85,
      competition: "متوسط",
      seasonality: "همه فصل",
      minInvestment: 5000,
      image: "https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=300"
    },
    {
      id: 2,
      name: "خرما مجول",
      category: "food",
      exportValue: 1800000,
      growthRate: 12.8,
      difficulty: "آسان",
      profitMargin: "25-40%",
      targetMarkets: ["AE", "SA", "BH"],
      description: "محصول محبوب در ماه رمضان و مناسبات مذهبی",
      marketShare: 70,
      competition: "بالا",
      seasonality: "رمضان",
      minInvestment: 3000,
      image: "https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=300"
    },
    {
      id: 3,
      name: "پسته اکبری",
      category: "food",
      exportValue: 3200000,
      growthRate: 18.5,
      difficulty: "متوسط",
      profitMargin: "30-50%",
      targetMarkets: ["AE", "SA", "KW", "QA", "OM"],
      description: "کیفیت بالا و تقاضای مداوم در بازارهای عربی",
      marketShare: 92,
      competition: "کم",
      seasonality: "همه فصل",
      minInvestment: 8000,
      image: "https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=300"
    },
    {
      id: 4,
      name: "فرش دستباف",
      category: "handicrafts",
      exportValue: 1500000,
      growthRate: 8.3,
      difficulty: "سخت",
      profitMargin: "50-80%",
      targetMarkets: ["AE", "QA"],
      description: "محصول لوکس با مشتریان خاص",
      marketShare: 45,
      competition: "کم",
      seasonality: "همه فصل",
      minInvestment: 15000,
      image: "https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=300"
    },
    {
      id: 5,
      name: "برنج هاشمی",
      category: "food",
      exportValue: 2100000,
      growthRate: 10.7,
      difficulty: "متوسط",
      profitMargin: "20-35%",
      targetMarkets: ["AE", "SA", "KW"],
      description: "برنج باکیفیت با طرفداران زیاد",
      marketShare: 65,
      competition: "متوسط",
      seasonality: "همه فصل",
      minInvestment: 4000,
      image: "https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=300"
    },
    {
      id: 6,
      name: "عسل طبیعی",
      category: "food",
      exportValue: 800000,
      growthRate: 22.1,
      difficulty: "آسان",
      profitMargin: "35-55%",
      targetMarkets: ["AE", "SA", "QA", "BH"],
      description: "محصول ارگانیک با رشد سریع",
      marketShare: 55,
      competition: "متوسط",
      seasonality: "همه فصل",
      minInvestment: 2500,
      image: "https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=300"
    }
  ];

  const filteredProducts = researchProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesMarket = selectedMarket === "all" || product.targetMarkets.includes(selectedMarket);
    return matchesSearch && matchesCategory && matchesMarket;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "آسان": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "متوسط": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "سخت": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case "کم": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "متوسط": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "بالا": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-blue-700/50 rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-3xl flex items-center justify-center">
              <Target className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">محصولات تحقیقی</h2>
              <p className="text-blue-300">محصولات پیشنهادی بر اساس آمار گمرک و صادرات ایران</p>
            </div>
            <div className="mr-auto">
              <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted rounded-2xl">
                <RefreshCw className="w-4 h-4 ml-2" />
                بروزرسانی داده‌ها
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="bg-card/80 border-border rounded-3xl">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="جستجو در محصولات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 bg-muted border-border text-foreground rounded-2xl"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-muted border-border text-foreground rounded-2xl md:w-48">
                <SelectValue placeholder="دسته‌بندی" />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id} className="text-foreground">
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMarket} onValueChange={setSelectedMarket}>
              <SelectTrigger className="bg-muted border-border text-foreground rounded-2xl md:w-48">
                <SelectValue placeholder="بازار هدف" />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                {targetMarkets.map((market) => (
                  <SelectItem key={market.id} value={market.id} className="text-foreground">
                    {market.flag ? `${market.flag} ${market.name}` : market.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="bg-card/80 border-border hover:border-border transition-all group rounded-3xl">
            <CardContent className="p-0">
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-t-3xl"
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 rounded-full">
                    رشد: {product.growthRate}%
                  </Badge>
                </div>
                <div className="absolute top-4 left-4">
                  <Badge className={`${getDifficultyColor(product.difficulty)} rounded-full`}>
                    {product.difficulty}
                  </Badge>
                </div>
              </div>

              <div className="p-6">
                <h4 className="font-bold text-foreground mb-2 group-hover:text-blue-300 transition-colors">
                  {product.name}
                </h4>
                <p className="text-muted-foreground text-sm mb-4">{product.description}</p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">ارزش صادرات:</span>
                    <span className="text-foreground font-bold">${product.exportValue.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">حاشیه سود:</span>
                    <span className="text-green-600 dark:text-green-400 font-bold">{product.profitMargin}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">سهم بازار:</span>
                    <span className="text-foreground">{product.marketShare}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">رقابت:</span>
                    <Badge className={`${getCompetitionColor(product.competition)} rounded-full`}>
                      {product.competition}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">سرمایه اولیه:</span>
                    <span className="text-orange-600 dark:text-orange-400 font-bold">${product.minInvestment.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-muted-foreground text-sm block mb-2">بازارهای هدف:</span>
                  <div className="flex flex-wrap gap-1">
                    {product.targetMarkets.map((marketId, index) => {
                      const market = targetMarkets.find(m => m.id === marketId);
                      return (
                        <Badge key={index} variant="secondary" className="bg-muted text-muted-foreground rounded-xl text-xs">
                          {market?.flag} {market?.name.split(' ')[0]}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-blue-500 hover:bg-blue-600 rounded-2xl"
                  >
                    <Eye className="w-4 h-4 ml-2" />
                    مطالعه کامل
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-border text-muted-foreground hover:bg-muted rounded-2xl"
                  >
                    <ArrowUpRight className="w-4 h-4" />
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
            <div className="text-2xl font-bold text-foreground">۲۴</div>
            <p className="text-sm text-muted-foreground">محصول تحقیق شده</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۶</div>
            <p className="text-sm text-muted-foreground">بازار هدف</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">$۱۲M</div>
            <p className="text-sm text-muted-foreground">کل ارزش صادرات</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۱۵%</div>
            <p className="text-sm text-muted-foreground">میانگین رشد</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductsResearch;