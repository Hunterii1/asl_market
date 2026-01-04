import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { apiService } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LicenseGate } from '@/components/LicenseGate';
import { Pagination } from "@/components/ui/pagination";
import { 
  Target, 
  Search, 
  TrendingUp, 
  
  DollarSign,
  BarChart3,
  Star,
  Package,
  Filter,
  RefreshCw
} from "lucide-react";

const ProductsResearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [researchProducts, setResearchProducts] = useState([]);
  const [categories, setCategories] = useState([
    { id: "all", name: "همه دسته‌ها" }
  ]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;
  
  // Read search query from URL on mount
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch) {
      setSearchTerm(urlSearch);
    }
  }, [searchParams]);

  // Load data from API with pagination
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [productsResponse, categoriesResponse] = await Promise.all([
          apiService.getActiveResearchProducts({
            page: currentPage,
            per_page: itemsPerPage,
          }),
          apiService.getResearchProductCategories()
        ]);

        setResearchProducts(productsResponse.products || []);
        setTotalPages(productsResponse.total_pages || 1);
        setTotalItems(productsResponse.total || 0);

        const allCategories = [
          { id: "all", name: "همه دسته‌ها" },
          ...(categoriesResponse.categories || []).map((cat: any) => ({ id: cat, name: cat }))
        ];
        setCategories(allCategories);
      } catch (error) {
        console.error('Error loading research products:', error);
        setResearchProducts([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentPage, searchTerm]);

  // Helper functions for styling and text conversion
  const getMarketDemandColor = (demand: string) => {
    switch (demand) {
      case "high": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getMarketDemandText = (demand: string) => {
    switch (demand) {
      case "high": return "تقاضای بالا";
      case "medium": return "تقاضای متوسط";
      case "low": return "تقاضای پایین";
      default: return demand;
    }
  };

  const getProfitPotentialColor = (potential: string) => {
    switch (potential) {
      case "high": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getProfitPotentialText = (potential: string) => {
    switch (potential) {
      case "high": return "بالا";
      case "medium": return "متوسط";
      case "low": return "پایین";
      default: return potential;
    }
  };

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case "low": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "high": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getCompetitionText = (competition: string) => {
    switch (competition) {
      case "low": return "کم";
      case "medium": return "متوسط";
      case "high": return "بالا";
      default: return competition;
    }
  };

  // Helper function to convert numbers to Farsi
  const toFarsiNumber = (num: number) => {
    return num.toLocaleString('fa-IR');
  };

  // Client-side filtering (server handles pagination)
  const filteredProducts = researchProducts.filter((product: any) => {
    const matchesSearch = !searchTerm 
      || (product.hs_code && String(product.hs_code).toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  if (loading) {
    return (
      <LicenseGate>
        <div className="space-y-6 animate-fade-in">
          <Card className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-blue-700/50 rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-3xl flex items-center justify-center">
                  <Target className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">محصولات تحقیقی</h2>
                  <p className="text-blue-600 dark:text-blue-300">در حال بارگذاری...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </LicenseGate>
    );
  }

  return (
    <LicenseGate>
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
              <p className="text-blue-600 dark:text-blue-300">محصولات پیشنهادی بر اساس آمار گمرک و صادرات ایران</p>
            </div>
            <div className="mr-auto flex items-center gap-3">
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 rounded-2xl">
                {totalItems > 0 ? toFarsiNumber(totalItems) : filteredProducts.length} محصول
              </Badge>
              <Button 
                variant="outline" 
                className="border-border text-muted-foreground hover:bg-muted rounded-2xl"
                onClick={() => window.location.reload()}
              >
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
                placeholder="جستجو بر اساس کد HS (مثال: 390120)..."
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
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-8 text-center">
            <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">هیچ محصول تحقیقی یافت نشد</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory !== "all" ? 'برای جستجوی مورد نظر نتیجه‌ای یافت نشد' : 'هنوز محصول تحقیقی برای نمایش وجود ندارد'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
          <Card key={product.id} className="bg-card/80 border-border hover:border-border transition-all group rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-2">
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 rounded-full">
                    #{product.id}
                  </Badge>
                  {product.hs_code && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 rounded-full text-xs">
                      HS: {product.hs_code}
                    </Badge>
                  )}
                </div>
                <Badge className={`${getMarketDemandColor(product.market_demand)} rounded-full`}>
                  {getMarketDemandText(product.market_demand)}
                </Badge>
              </div>
              
              <h4 className="font-bold text-foreground mb-2 group-hover:text-blue-300 transition-colors">
                {product.name}
              </h4>
              <p className="text-muted-foreground text-sm mb-4">{product.description}</p>

              <div className="space-y-3 mb-4">
                {product.export_value && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">ارزش صادرات:</span>
                    <span className="text-foreground font-bold">{product.export_value}</span>
                  </div>
                )}

                {product.target_country && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">کشور هدف:</span>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 rounded-full">
                      {product.target_country}
                    </Badge>
                  </div>
                )}

                {product.iran_purchase_price && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">قیمت خرید (ایران):</span>
                    <span className="text-foreground font-bold">
                      {product.iran_purchase_price} {product.price_currency || 'USD'}
                    </span>
                  </div>
                )}

                {product.target_country_price && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">قیمت فروش (هدف):</span>
                    <span className="text-foreground font-bold">
                      {product.target_country_price} {product.price_currency || 'USD'}
                    </span>
                  </div>
                )}

                {product.profit_margin && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">حاشیه سود:</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 rounded-full">
                      {product.profit_margin}
                    </Badge>
                  </div>
                )}
                
                {product.profit_potential && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">پتانسیل سود:</span>
                    <Badge className={`${getProfitPotentialColor(product.profit_potential)} rounded-full`}>
                      {getProfitPotentialText(product.profit_potential)}
                    </Badge>
                  </div>
                )}

                {product.competition_level && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">رقابت:</span>
                    <Badge className={`${getCompetitionColor(product.competition_level)} rounded-full`}>
                      {getCompetitionText(product.competition_level)}
                    </Badge>
                  </div>
                )}

                {product.seasonal_factors && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">فصلی بودن:</span>
                    <span className="text-foreground text-sm">{product.seasonal_factors}</span>
                  </div>
                )}
              </div>

              {product.target_countries && (
                <div className="mb-4">
                  <span className="text-muted-foreground text-sm block mb-2">بازارهای هدف:</span>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="bg-muted text-muted-foreground rounded-xl text-xs">
                      {product.target_countries}
                    </Badge>
                  </div>
                </div>
              )}

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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{totalItems > 0 ? toFarsiNumber(totalItems) : '۰'}</div>
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
    </LicenseGate>
  );
};

export default ProductsResearch;