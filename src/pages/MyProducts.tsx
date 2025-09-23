import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LicenseGate } from '@/components/LicenseGate';
import HeaderAuth from '@/components/ui/HeaderAuth';
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  Edit, 
  Trash2, 
  Eye, 
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";

interface Product {
  id: number;
  product_name: string;
  category: string;
  subcategory: string;
  description: string;
  wholesale_price: string;
  retail_price: string;
  export_price: string;
  currency: string;
  available_quantity: number;
  min_order_quantity: number;
  max_order_quantity: number;
  unit: string;
  brand: string;
  model: string;
  origin: string;
  quality: string;
  packaging_type: string;
  weight: string;
  dimensions: string;
  shipping_cost: string;
  location: string;
  contact_phone: string;
  contact_email: string;
  contact_whatsapp: string;
  can_export: boolean;
  requires_license: boolean;
  license_type: string;
  export_countries: string;
  image_urls: string;
  video_url: string;
  catalog_url: string;
  status: string;
  is_featured: boolean;
  is_hot_deal: boolean;
  tags: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface ProductFormData {
  product_name: string;
  category: string;
  subcategory: string;
  description: string;
  wholesale_price: string;
  retail_price: string;
  export_price: string;
  currency: string;
  available_quantity: number;
  min_order_quantity: number;
  max_order_quantity: number;
  unit: string;
  brand: string;
  model: string;
  origin: string;
  quality: string;
  packaging_type: string;
  weight: string;
  dimensions: string;
  shipping_cost: string;
  location: string;
  contact_phone: string;
  contact_email: string;
  contact_whatsapp: string;
  can_export: boolean;
  requires_license: boolean;
  license_type: string;
  export_countries: string;
  image_urls: string;
  video_url: string;
  catalog_url: string;
  tags: string;
  notes: string;
}

const MyProducts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<ProductFormData>({
    product_name: '',
    category: '',
    subcategory: '',
    description: '',
    wholesale_price: '',
    retail_price: '',
    export_price: '',
    currency: 'USD',
    available_quantity: 0,
    min_order_quantity: 1,
    max_order_quantity: 0,
    unit: 'piece',
    brand: '',
    model: '',
    origin: '',
    quality: '',
    packaging_type: '',
    weight: '',
    dimensions: '',
    shipping_cost: '',
    location: '',
    contact_phone: '',
    contact_email: '',
    contact_whatsapp: '',
    can_export: false,
    requires_license: false,
    license_type: '',
    export_countries: '',
    image_urls: '',
    video_url: '',
    catalog_url: '',
    tags: '',
    notes: ''
  });

  const categories = [
    'زعفران', 'خرما', 'خشکبار', 'صنایع دستی', 'فرش', 'مواد غذایی', 
    'لباس', 'کیف و کفش', 'لوازم خانگی', 'الکترونیک', 'کتاب', 'ورزش', 'سایر'
  ];

  const currencies = [
    { value: 'USD', label: 'دلار آمریکا (USD)' },
    { value: 'EUR', label: 'یورو (EUR)' },
    { value: 'IRR', label: 'ریال ایران (IRR)' },
    { value: 'AED', label: 'درهم امارات (AED)' }
  ];

  const units = [
    { value: 'piece', label: 'عدد' },
    { value: 'kg', label: 'کیلوگرم' },
    { value: 'gram', label: 'گرم' },
    { value: 'ton', label: 'تن' },
    { value: 'liter', label: 'لیتر' },
    { value: 'meter', label: 'متر' },
    { value: 'box', label: 'جعبه' },
    { value: 'pack', label: 'بسته' }
  ];

  const qualities = [
    { value: 'A+', label: 'A+ (عالی)' },
    { value: 'A', label: 'A (بسیار خوب)' },
    { value: 'B', label: 'B (خوب)' },
    { value: 'C', label: 'C (متوسط)' }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserProducts({ page: 1, per_page: 50 });
      setProducts(response.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت محصولات. لطفا دوباره تلاش کنید",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      product_name: product.product_name,
      category: product.category,
      subcategory: product.subcategory,
      description: product.description,
      wholesale_price: product.wholesale_price,
      retail_price: product.retail_price,
      export_price: product.export_price,
      currency: product.currency,
      available_quantity: product.available_quantity,
      min_order_quantity: product.min_order_quantity,
      max_order_quantity: product.max_order_quantity,
      unit: product.unit,
      brand: product.brand,
      model: product.model,
      origin: product.origin,
      quality: product.quality,
      packaging_type: product.packaging_type,
      weight: product.weight,
      dimensions: product.dimensions,
      shipping_cost: product.shipping_cost,
      location: product.location,
      contact_phone: product.contact_phone,
      contact_email: product.contact_email,
      contact_whatsapp: product.contact_whatsapp,
      can_export: product.can_export,
      requires_license: product.requires_license,
      license_type: product.license_type,
      export_countries: product.export_countries,
      image_urls: product.image_urls,
      video_url: product.video_url,
      catalog_url: product.catalog_url,
      tags: product.tags,
      notes: product.notes
    });
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingProduct) return;

    try {
      setSaving(true);
      await apiService.updateUserProduct(editingProduct.id, formData);
      
      toast({
        title: "موفق",
        description: "محصول با موفقیت به‌روزرسانی شد",
      });
      
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی محصول. لطفا دوباره تلاش کنید",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      await apiService.deleteUserProduct(productToDelete.id);
      
      toast({
        title: "موفق",
        description: "محصول با موفقیت حذف شد",
      });
      
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "خطا",
        description: "خطا در حذف محصول. لطفا دوباره تلاش کنید",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">فعال</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">غیرفعال</Badge>;
      case 'out_of_stock':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">تمام شده</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">در انتظار</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">{status}</Badge>;
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <LicenseGate>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
          <HeaderAuth />
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری محصولات...</p>
              </div>
            </div>
          </div>
        </div>
      </LicenseGate>
    );
  }

  return (
    <LicenseGate>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        <HeaderAuth />
        
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              مدیریت محصولات من
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              محصولات خود را مشاهده، ویرایش و حذف کنید
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="جستجو در محصولات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue placeholder="فیلتر وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="inactive">غیرفعال</SelectItem>
                <SelectItem value="out_of_stock">تمام شده</SelectItem>
                <SelectItem value="pending">در انتظار</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => navigate('/submit-product')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 ml-2" />
              افزودن محصول جدید
            </Button>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                  هیچ محصولی یافت نشد
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'هیچ محصولی با فیلترهای انتخابی یافت نشد'
                    : 'هنوز محصولی اضافه نکرده‌اید'
                  }
                </p>
                <Button 
                  onClick={() => navigate('/submit-product')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  افزودن اولین محصول
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                          {product.product_name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                          {getStatusBadge(product.status)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Description */}
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {product.description}
                      </p>

                      {/* Pricing */}
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-medium">
                          {product.wholesale_price} {product.currency}
                        </span>
                        <span className="text-gray-500">عمده</span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <MapPin className="w-4 h-4" />
                        <span>{product.location}</span>
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Package className="w-4 h-4" />
                        <span>{product.available_quantity} {product.unit}</span>
                      </div>

                      {/* Created Date */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(product.created_at).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(product)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 ml-1" />
                        ویرایش
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProductToDelete(product);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>ویرایش محصول</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">نام محصول *</label>
                    <Input
                      value={formData.product_name}
                      onChange={(e) => handleInputChange('product_name', e.target.value)}
                      placeholder="نام محصول"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">دسته‌بندی *</label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب دسته‌بندی" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">زیردسته‌بندی</label>
                    <Input
                      value={formData.subcategory}
                      onChange={(e) => handleInputChange('subcategory', e.target.value)}
                      placeholder="زیردسته‌بندی"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">برند</label>
                    <Input
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      placeholder="برند"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">توضیحات</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="توضیحات محصول"
                    rows={3}
                  />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">قیمت عمده</label>
                    <Input
                      value={formData.wholesale_price}
                      onChange={(e) => handleInputChange('wholesale_price', e.target.value)}
                      placeholder="قیمت عمده"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">قیمت خرده</label>
                    <Input
                      value={formData.retail_price}
                      onChange={(e) => handleInputChange('retail_price', e.target.value)}
                      placeholder="قیمت خرده"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">قیمت صادراتی</label>
                    <Input
                      value={formData.export_price}
                      onChange={(e) => handleInputChange('export_price', e.target.value)}
                      placeholder="قیمت صادراتی"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">واحد پول</label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">واحد</label>
                    <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Quantity */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">موجودی</label>
                    <Input
                      type="number"
                      value={formData.available_quantity}
                      onChange={(e) => handleInputChange('available_quantity', parseInt(e.target.value) || 0)}
                      placeholder="موجودی"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">حداقل سفارش</label>
                    <Input
                      type="number"
                      value={formData.min_order_quantity}
                      onChange={(e) => handleInputChange('min_order_quantity', parseInt(e.target.value) || 1)}
                      placeholder="حداقل سفارش"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">حداکثر سفارش</label>
                    <Input
                      type="number"
                      value={formData.max_order_quantity}
                      onChange={(e) => handleInputChange('max_order_quantity', parseInt(e.target.value) || 0)}
                      placeholder="حداکثر سفارش"
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">شماره تماس</label>
                    <Input
                      value={formData.contact_phone}
                      onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                      placeholder="شماره تماس"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">ایمیل</label>
                    <Input
                      value={formData.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      placeholder="ایمیل"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">واتساپ</label>
                    <Input
                      value={formData.contact_whatsapp}
                      onChange={(e) => handleInputChange('contact_whatsapp', e.target.value)}
                      placeholder="شماره واتساپ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">موقعیت مکانی *</label>
                    <Input
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="موقعیت مکانی"
                    />
                  </div>
                </div>

                {/* Export Options */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_export"
                      checked={formData.can_export}
                      onCheckedChange={(checked) => handleInputChange('can_export', checked)}
                    />
                    <label htmlFor="can_export" className="text-sm font-medium">
                      قابلیت صادرات
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requires_license"
                      checked={formData.requires_license}
                      onCheckedChange={(checked) => handleInputChange('requires_license', checked)}
                    />
                    <label htmlFor="requires_license" className="text-sm font-medium">
                      نیاز به مجوز
                    </label>
                  </div>
                </div>

                {/* Media URLs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">لینک تصاویر (جدا شده با کاما)</label>
                    <Input
                      value={formData.image_urls}
                      onChange={(e) => handleInputChange('image_urls', e.target.value)}
                      placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">لینک ویدیو</label>
                    <Input
                      value={formData.video_url}
                      onChange={(e) => handleInputChange('video_url', e.target.value)}
                      placeholder="https://example.com/video.mp4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">لینک کاتالوگ</label>
                    <Input
                      value={formData.catalog_url}
                      onChange={(e) => handleInputChange('catalog_url', e.target.value)}
                      placeholder="https://example.com/catalog.pdf"
                    />
                  </div>
                </div>

                {/* Tags and Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">برچسب‌ها (جدا شده با کاما)</label>
                    <Input
                      value={formData.tags}
                      onChange={(e) => handleInputChange('tags', e.target.value)}
                      placeholder="برچسب1, برچسب2, برچسب3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">یادداشت‌ها</label>
                    <Input
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="یادداشت‌های اضافی"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1"
                >
                  انصراف
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>حذف محصول</AlertDialogTitle>
                <AlertDialogDescription>
                  آیا مطمئن هستید که می‌خواهید محصول "{productToDelete?.product_name}" را حذف کنید؟
                  این عمل قابل بازگشت نیست.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>انصراف</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </LicenseGate>
  );
};

export default MyProducts;
