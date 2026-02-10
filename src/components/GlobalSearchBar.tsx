import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  X, 
  Building, 
  User, 
  Package, 
  Target,
  Sparkles,
  Loader2,
  MessageSquare,
  Bot
} from 'lucide-react';
import { apiService } from '@/services/api';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/utils/imageUrl';

interface SearchResult {
  suppliers: Array<{
    id: number;
    brand_name?: string;
    full_name: string;
    city?: string;
    image_url?: string;
  }>;
  visitors: Array<{
    id: number;
    full_name: string;
    city_province?: string;
    email?: string;
  }>;
  available_products: Array<{
    id: number;
    product_name: string;
    category?: string;
    location?: string;
    image_urls?: string;
  }>;
  research_products: Array<{
    id: number;
    name: string;
    category?: string;
  }>;
  chats?: Array<{
    id: number;
    title: string;
    user_id: number;
    user_name: string;
    created_at: string;
  }>;
  messages?: Array<{
    id: number;
    chat_id: number;
    chat_title: string;
    content: string;
    role: string;
    user_id: number;
    user_name: string;
    created_at: string;
  }>;
  total: number;
}

interface GlobalSearchBarProps {
  className?: string;
  mobile?: boolean;
}

export function GlobalSearchBar({ className, mobile = false }: GlobalSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await apiService.globalSearch(searchQuery);
      setResults(response);
      setIsOpen(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to best-matching page when user presses Enter (مثل سایت‌های بزرگ)
  const handleSubmit = () => {
    const searchQuery = query.trim();
    if (!searchQuery) return;

    const qp = `search=${encodeURIComponent(searchQuery)}`;

    // اگر نتایج داریم، براساس اولویت به بهترین بخش ببریم
    if (results) {
      if (results.suppliers && results.suppliers.length > 0) {
        navigate(`/aslsupplier?${qp}`);
        return;
      }
      if (results.available_products && results.available_products.length > 0) {
        navigate(`/aslavailable?${qp}`);
        return;
      }
      if (results.visitors && results.visitors.length > 0) {
        navigate(`/aslvisit?${qp}`);
        return;
      }
      if (results.research_products && results.research_products.length > 0) {
        navigate(`/?activeSection=products&${qp}`);
        return;
      }
      if ((results.chats && results.chats.length > 0) || (results.messages && results.messages.length > 0)) {
        navigate(`/aslai?${qp}`);
        return;
      }
    }

    // اگر هنوز نتیجه‌ای نیامده یا نتایج خالی است، به صورت پیش‌فرض به کالاهای موجود برو
    navigate(`/aslavailable?${qp}`);
    setIsOpen(false);
    setFocused(false);
  };

  const handleFocus = () => {
    setFocused(true);
    if (results && query.trim()) {
      setIsOpen(true);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults(null);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleResultClick = (type: string, id: number, chatId?: number) => {
    setIsOpen(false);
    setFocused(false);
    
    // Navigate with search query parameter
    const searchQuery = query.trim() ? `search=${encodeURIComponent(query.trim())}` : '';
    
    switch (type) {
      case 'supplier':
        navigate(searchQuery ? `/aslsupplier?${searchQuery}` : `/aslsupplier`);
        break;
      case 'visitor':
        navigate(searchQuery ? `/aslvisit?${searchQuery}` : `/aslvisit`);
        break;
      case 'available_product':
        navigate(searchQuery ? `/aslavailable?${searchQuery}` : `/aslavailable`);
        break;
      case 'research_product':
        navigate(searchQuery ? `/?activeSection=products&${searchQuery}` : `/?activeSection=products`);
        break;
      case 'chat':
        navigate(searchQuery ? `/aslai?chat=${id}&${searchQuery}` : `/aslai?chat=${id}`);
        break;
      case 'message':
        navigate(searchQuery ? `/aslai?chat=${chatId || id}&${searchQuery}` : `/aslai?chat=${chatId || id}`);
        break;
    }
  };

  const totalResults = results?.total || 0;
  const hasResults = totalResults > 0;

  return (
    <div 
      ref={searchRef}
      className={cn(
        "relative w-full",
        mobile ? "mb-4" : "max-w-md mx-auto",
        className
      )}
    >
      {/* Search Input - iOS Style */}
      <div
        className={cn(
          "relative flex items-center transition-all duration-300",
          "bg-background/80 backdrop-blur-xl",
          "border rounded-full",
          "shadow-lg",
          focused || isOpen
            ? "border-primary shadow-primary/20 scale-[1.02]"
            : "border-border shadow-sm",
          mobile ? "h-12" : "h-11"
        )}
      >
        <div className="absolute right-4 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder="جستجو در همه بخش‌ها..."
          className={cn(
            "w-full pr-10 pl-4 border-0 bg-transparent",
            "focus-visible:ring-0 focus-visible:ring-offset-0",
            "placeholder:text-muted-foreground/60",
            mobile ? "h-12 text-base" : "h-11 text-sm"
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        {query && (
          <button
            onClick={handleClear}
            className="absolute left-4 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Dropdown Results - iOS Style */}
      {isOpen && (query.trim() || hasResults) && (
        <div
          className={cn(
            "absolute top-full mt-2 w-full z-50",
            "bg-background/95 backdrop-blur-xl",
            "border border-border rounded-2xl",
            "shadow-2xl",
            "overflow-hidden",
            "animate-in fade-in slide-in-from-top-2 duration-200"
          )}
        >
          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : !hasResults ? (
            <div className="p-8 text-center">
              <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">نتیجه‌ای یافت نشد</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              {/* Suppliers */}
              {results?.suppliers && results.suppliers.length > 0 && (
                <div className="border-b border-border">
                  <div className="px-4 py-2 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-orange-500" />
                      <span className="text-xs font-semibold text-muted-foreground">
                        تأمین‌کنندگان ({results.suppliers.length})
                      </span>
                    </div>
                  </div>
                  {results.suppliers.map((supplier) => (
                    <button
                      key={supplier.id}
                      onClick={() => handleResultClick('supplier', supplier.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-right"
                    >
                      {supplier.image_url ? (
                        <img
                          src={getImageUrl(supplier.image_url)}
                          alt={supplier.brand_name || supplier.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                          <Building className="w-5 h-5 text-orange-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {supplier.brand_name || supplier.full_name}
                        </p>
                        {supplier.city && (
                          <p className="text-xs text-muted-foreground truncate">
                            {supplier.city}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Visitors */}
              {results?.visitors && results.visitors.length > 0 && (
                <div className="border-b border-border">
                  <div className="px-4 py-2 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-semibold text-muted-foreground">
                        ویزیتورها ({results.visitors.length})
                      </span>
                    </div>
                  </div>
                  {results.visitors.map((visitor) => (
                    <button
                      key={visitor.id}
                      onClick={() => handleResultClick('visitor', visitor.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-right"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {visitor.full_name}
                        </p>
                        {visitor.city_province && (
                          <p className="text-xs text-muted-foreground truncate">
                            {visitor.city_province}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Available Products */}
              {results?.available_products && results.available_products.length > 0 && (
                <div className="border-b border-border">
                  <div className="px-4 py-2 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-semibold text-muted-foreground">
                        کالاهای موجود ({results.available_products.length})
                      </span>
                    </div>
                  </div>
                  {results.available_products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleResultClick('available_product', product.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-right"
                    >
                      {product.image_urls ? (
                        <img
                          src={getImageUrl(product.image_urls.split(',')[0])}
                          alt={product.product_name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <Package className="w-5 h-5 text-purple-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {product.product_name}
                        </p>
                        {(product.category || product.location) && (
                          <p className="text-xs text-muted-foreground truncate">
                            {product.category && product.location
                              ? `${product.category} • ${product.location}`
                              : product.category || product.location}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Research Products */}
              {results?.research_products && results.research_products.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-semibold text-muted-foreground">
                        محصولات تحقیقی ({results.research_products.length})
                      </span>
                    </div>
                  </div>
                  {results.research_products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleResultClick('research_product', product.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-right"
                    >
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Target className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {product.name}
                        </p>
                        {product.category && (
                          <p className="text-xs text-muted-foreground truncate">
                            {product.category}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Total Results Badge */}
              {totalResults > 0 && (
              <div className="px-4 py-3 border-t border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {totalResults} نتیجه یافت شد
                  </Badge>
                  {/* Quick actions برای رفتن به صفحات اصلی جستجو */}
                  <div className="flex flex-wrap gap-1 justify-end">
                    {results?.suppliers && results.suppliers.length > 0 && (
                      <button
                        onClick={() => handleResultClick('supplier', 0)}
                        className="text-[11px] px-2 py-1 rounded-full bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-colors flex items-center gap-1"
                      >
                        <Building className="w-3 h-3" />
                        همه تأمین‌کنندگان
                      </button>
                    )}
                    {results?.available_products && results.available_products.length > 0 && (
                      <button
                        onClick={() => handleResultClick('available_product', 0)}
                        className="text-[11px] px-2 py-1 rounded-full bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-colors flex items-center gap-1"
                      >
                        <Package className="w-3 h-3" />
                        همه کالاهای موجود
                      </button>
                    )}
                    {results?.visitors && results.visitors.length > 0 && (
                      <button
                        onClick={() => handleResultClick('visitor', 0)}
                        className="text-[11px] px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors flex items-center gap-1"
                      >
                        <User className="w-3 h-3" />
                        همه ویزیتورها
                      </button>
                    )}
                    {results?.research_products && results.research_products.length > 0 && (
                      <button
                        onClick={() => handleResultClick('research_product', 0)}
                        className="text-[11px] px-2 py-1 rounded-full bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors flex items-center gap-1"
                      >
                        <Target className="w-3 h-3" />
                        همه محصولات تحقیقی
                      </button>
                    )}
                  </div>
                </div>
              </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
