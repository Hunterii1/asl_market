import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  Target, 
  Play, 
  CheckCircle, 
  Search,
  Filter,
  Star,
  Clock,
  Users,
  TrendingUp
} from "lucide-react";

const AslLearn = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const productCategories = [
    { id: "all", name: "همه محصولات", count: 45 },
    { id: "saffron", name: "زعفران", count: 8 },
    { id: "dates", name: "خرما", count: 12 },
    { id: "pistachios", name: "پسته", count: 6 },
    { id: "carpets", name: "فرش", count: 4 },
    { id: "handicrafts", name: "صنایع دستی", count: 15 }
  ];

  const recommendedProducts = [
    {
      id: 1,
      name: "زعفران سرگل ممتاز",
      category: "saffron",
      difficulty: "آسان",
      profit: "بالا",
      marketDemand: 95,
      image: "https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=300",
      description: "محصول پرفروش در بازارهای عربی با سود بالا",
      estimatedProfit: "۳۰-۵۰%",
      targetMarkets: ["امارات", "عربستان", "کویت"],
      hasTraining: true
    },
    {
      id: 2,
      name: "خرما مجول درجه یک",
      category: "dates",
      difficulty: "متوسط",
      profit: "متوسط",
      marketDemand: 88,
      image: "https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=300",
      description: "محصول محبوب در ماه رمضان",
      estimatedProfit: "۲۰-۳۵%",
      targetMarkets: ["امارات", "قطر", "بحرین"],
      hasTraining: true
    },
    {
      id: 3,
      name: "پسته اکبری",
      category: "pistachios",
      difficulty: "آسان",
      profit: "بالا",
      marketDemand: 92,
      image: "https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=300",
      description: "کیفیت بالا و تقاضای مداوم",
      estimatedProfit: "۲۵-۴۰%",
      targetMarkets: ["امارات", "عربستان", "کویت", "قطر"],
      hasTraining: true
    }
  ];

  const trainingModules = [
    {
      id: 1,
      title: "شناخت بازار کشورهای عربی",
      duration: "۴۵ دقیقه",
      lessons: 6,
      completed: false,
      difficulty: "مقدماتی"
    },
    {
      id: 2,
      title: "تکنیک‌های فروش بین‌المللی",
      duration: "۶۰ دقیقه",
      lessons: 8,
      completed: false,
      difficulty: "متوسط"
    },
    {
      id: 3,
      title: "مذاکره و قرارداد نویسی",
      duration: "۹۰ دقیقه",
      lessons: 12,
      completed: false,
      difficulty: "پیشرفته"
    },
    {
      id: 4,
      title: "بازاریابی دیجیتال در خاورمیانه",
      duration: "۷۵ دقیقه",
      lessons: 10,
      completed: false,
      difficulty: "متوسط"
    }
  ];

  const filteredProducts = recommendedProducts.filter(product => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "آسان": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "متوسط": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "پیشرفته": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getProfitColor = (profit: string) => {
    switch (profit) {
      case "بالا": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "متوسط": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "پایین": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-100/40 to-blue-200/40 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200/70 dark:border-blue-700/50 rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-200/40 dark:bg-blue-500/20 rounded-3xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">آموزش اصل مارکت</h2>
              <p className="text-blue-600 dark:text-blue-300">انتخاب محصول و آموزش فروش حرفه‌ای</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card className="bg-card/70 border-border rounded-3xl">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="جستجو در محصولات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 bg-background border-border text-foreground rounded-2xl"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {productCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`rounded-2xl whitespace-nowrap ${
                    selectedCategory === category.id
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {category.name} ({category.count})
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Products */}
      <div>
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-orange-400" />
          محصولات پیشنهادی برای شروع
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="bg-card/80 border-border hover:border-accent transition-all group rounded-3xl">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-t-3xl"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-orange-100/60 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-200/70 dark:border-orange-500/30 rounded-full">
                      تقاضا: {product.marketDemand}%
                    </Badge>
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="font-bold text-foreground mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors">
                    {product.name}
                  </h4>
                  <p className="text-muted-foreground text-sm mb-4">{product.description}</p>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">سطح دشواری:</span>
                      <Badge className={`${getDifficultyColor(product.difficulty)} rounded-2xl`}>
                        {product.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">سود تخمینی:</span>
                      <Badge className={`${getProfitColor(product.profit)} rounded-2xl`}>
                        {product.estimatedProfit}
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="text-muted-foreground text-sm block mb-2">بازارهای هدف:</span>
                    <div className="flex flex-wrap gap-1">
                      {product.targetMarkets.map((market, index) => (
                        <Badge key={index} variant="secondary" className="bg-muted text-muted-foreground rounded-xl text-xs">
                          {market}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl"
                    >
                      <Play className="w-4 h-4 ml-2" />
                      شروع آموزش
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-border text-foreground hover:bg-muted rounded-2xl"
                    >
                      جزئیات
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Training Modules */}
      <div>
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-400" />
          دوره‌های آموزشی فروش
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {trainingModules.map((module) => (
            <Card key={module.id} className="bg-card/80 border-border hover:border-accent transition-all rounded-3xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-foreground mb-2">{module.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {module.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {module.lessons} درس
                      </div>
                    </div>
                  </div>
                  <Badge className={`${getDifficultyColor(module.difficulty)} rounded-2xl`}>
                    {module.difficulty}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {module.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <Play className="w-5 h-5 text-orange-400" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {module.completed ? "تکمیل شده" : "شروع نشده"}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    variant={module.completed ? "outline" : "default"}
                    className={`rounded-2xl ${
                      module.completed 
                        ? "border-border text-foreground hover:bg-muted" 
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                  >
                    {module.completed ? "مرور" : "شروع"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-blue-200/40 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">۴۵</div>
            <p className="text-sm text-muted-foreground">محصول آموزشی</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-green-200/40 dark:bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">۱۲۳</div>
            <p className="text-sm text-muted-foreground">دانشجوی فعال</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-orange-200/40 dark:bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">۸۷%</div>
            <p className="text-sm text-muted-foreground">نرخ موفقیت</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-purple-200/40 dark:bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Star className="w-6 h-6 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">۴.۸</div>
            <p className="text-sm text-muted-foreground">امتیاز دوره‌ها</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AslLearn;