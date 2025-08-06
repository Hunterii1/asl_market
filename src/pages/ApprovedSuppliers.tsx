import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  User,
  Phone,
  MapPin,
  Building,
  Package,
  Star,
  Search,
  CheckCircle,
  ExternalLink,
  Eye,
  Heart,
  Loader2
} from 'lucide-react';
import { apiService } from '@/services/api';
import { LicenseGate } from '@/components/LicenseGate';

interface SupplierProduct {
  id: number;
  product_name: string;
  product_type: string;
  description: string;
  needs_export_license: boolean;
  required_license_type: string;
  monthly_production_min: string;
  created_at: string;
}

interface Supplier {
  id: number;
  user_id: number;
  full_name: string;
  mobile: string;
  brand_name: string;
  city: string;
  has_registered_business: boolean;
  has_export_experience: boolean;
  can_produce_private_label: boolean;
  approved_at: string;
  created_at: string;
  products: SupplierProduct[];
}

const PRODUCT_TYPE_LABELS = {
  food: 'غذایی',
  herbal: 'گیاهی',
  health: 'بهداشتی',
  handicraft: 'دستی',
  industrial: 'صنعتی',
  home: 'خانگی',
  other: 'سایر'
};

export default function ApprovedSuppliers() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [suppliers, searchTerm, selectedCategory, selectedCity]);

  const loadSuppliers = async () => {
    try {
      const response = await apiService.getApprovedSuppliers();
      setSuppliers(response.suppliers || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSuppliers = () => {
    let filtered = suppliers;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(supplier => 
        supplier.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.products.some(product => 
          product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filter by product category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(supplier =>
        supplier.products.some(product => product.product_type === selectedCategory)
      );
    }

    // Filter by city
    if (selectedCity !== 'all') {
      filtered = filtered.filter(supplier => supplier.city === selectedCity);
    }

    setFilteredSuppliers(filtered);
  };

  const getUniqueProductTypes = () => {
    const types = new Set<string>();
    suppliers.forEach(supplier => {
      supplier.products.forEach(product => {
        types.add(product.product_type);
      });
    });
    return Array.from(types);
  };

  const getUniqueCities = () => {
    const cities = new Set<string>();
    suppliers.forEach(supplier => {
      cities.add(supplier.city);
    });
    return Array.from(cities).sort();
  };

  const handleContactSupplier = (supplier: Supplier) => {
    // In real app, this would track contact attempts and potentially reveal contact info
    const message = `سلام، از طریق سایت ASL Market محصولات شما را دیدم و علاقه‌مند به همکاری هستم.`;
    const whatsappUrl = `https://wa.me/98${supplier.mobile.substring(1)}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const SupplierCard = ({ supplier }: { supplier: Supplier }) => (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {supplier.brand_name || supplier.full_name}
              {supplier.has_registered_business && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  ثبت‌شده
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {supplier.full_name}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {supplier.city}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {supplier.has_export_experience && (
              <Badge variant="outline" className="text-xs">
                صادراتی
              </Badge>
            )}
            {supplier.can_produce_private_label && (
              <Badge variant="outline" className="text-xs">
                برند خصوصی
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Products */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Package className="w-4 h-4" />
            محصولات ({supplier.products.length})
          </h4>
          <div className="space-y-2">
            {supplier.products.slice(0, 3).map((product) => (
              <div key={product.id} className="p-3 bg-muted rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{product.product_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {PRODUCT_TYPE_LABELS[product.product_type as keyof typeof PRODUCT_TYPE_LABELS] || product.product_type}
                    </div>
                    {product.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>
                  {product.needs_export_license && (
                    <Badge variant="outline" className="text-xs ml-2">
                      مجوز صادرات
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  تولید: {product.monthly_production_min}
                </div>
              </div>
            ))}
            
            {supplier.products.length > 3 && (
              <div className="text-center">
                <Button variant="ghost" size="sm" className="text-xs">
                  <Eye className="w-3 h-3 mr-1" />
                  مشاهده {supplier.products.length - 3} محصول دیگر
                </Button>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={() => handleContactSupplier(supplier)}
            className="flex-1"
          >
            <Phone className="w-4 h-4 mr-2" />
            تماس با تأمین‌کننده
          </Button>
          <Button variant="outline" size="sm">
            <Heart className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>

        {/* Member since */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          عضو از: {new Date(supplier.created_at).toLocaleDateString('fa-IR')}
          {supplier.approved_at && (
            <> • تأیید: {new Date(supplier.approved_at).toLocaleDateString('fa-IR')}</>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <LicenseGate>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">تأمین‌کنندگان تأیید شده</h1>
            <p className="text-muted-foreground">
              شبکه قابل اعتماد تأمین‌کنندگان ASL Market
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Input
                    placeholder="جستجو در نام، برند، شهر یا محصولات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                    dir="rtl"
                  />
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="دسته‌بندی محصول" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه دسته‌ها</SelectItem>
                    {getUniqueProductTypes().map((type) => (
                      <SelectItem key={type} value={type}>
                        {PRODUCT_TYPE_LABELS[type as keyof typeof PRODUCT_TYPE_LABELS] || type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="شهر" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه شهرها</SelectItem>
                    {getUniqueCities().map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Search className="w-4 h-4" />
                  {filteredSuppliers.length} تأمین‌کننده یافت شد
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mr-2" />
              در حال بارگذاری تأمین‌کنندگان...
            </div>
          )}

          {/* No results */}
          {!loading && filteredSuppliers.length === 0 && (
            <Alert>
              <AlertDescription className="text-center py-8">
                {suppliers.length === 0 
                  ? 'هنوز تأمین‌کننده‌ای تأیید نشده است.'
                  : 'تأمین‌کننده‌ای با فیلترهای انتخابی یافت نشد.'
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Suppliers Grid */}
          {!loading && filteredSuppliers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSuppliers.map((supplier) => (
                <SupplierCard key={supplier.id} supplier={supplier} />
              ))}
            </div>
          )}
        </div>
      </div>
    </LicenseGate>
  );
}