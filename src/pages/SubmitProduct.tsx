import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { LicenseGate } from '@/components/LicenseGate';
import HeaderAuth from '@/components/ui/HeaderAuth';
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { PRODUCT_CATEGORIES } from "@/constants/productCategories";
import { ImageUpload } from '@/components/ImageUpload';
import { 
  Package, 
  ShoppingCart, 
  Store,
  MapPin, 
  Phone,
  Mail,
  DollarSign,
  Scale,
  Tag,
  FileText,
  Send,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface ProductSubmissionForm {
  sale_type: 'wholesale' | 'retail' | '';
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

const SubmitProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState<ProductSubmissionForm>({
    sale_type: '',
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

  const categories = PRODUCT_CATEGORIES;

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
    { value: 'carton', label: 'کارتن' },
    { value: 'pack', label: 'بسته' }
  ];

  const qualities = [
    { value: 'A+', label: 'A+ (عالی)' },
    { value: 'A', label: 'A (بسیار خوب)' },
    { value: 'B', label: 'B (خوب)' },
    { value: 'C', label: 'C (متوسط)' }
  ];

  const handleInputChange = (field: keyof ProductSubmissionForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.sale_type) {
      toast({
        title: "خطا",
        description: "لطفا نوع فروش را انتخاب کنید",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.product_name || !formData.category || !formData.location) {
      toast({
        title: "خطا", 
        description: "لطفا فیلدهای الزامی را پر کنید",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      await apiService.submitAvailableProduct(formData);
      
      setSubmitted(true);
      toast({
        title: "موفق",
        description: "کالای شما با موفقیت ثبت شد و در انتظار بررسی ادمین است",
      });
      
    } catch (error) {
      console.error('Error submitting product:', error);
      toast({
        title: "خطا",
        description: "خطا در ثبت کالا. لطفا دوباره تلاش کنید",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <LicenseGate>
        <HeaderAuth />
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-card/80 border-border rounded-3xl">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">کالا ثبت شد!</h2>
              <p className="text-muted-foreground mb-6">
                کالای شما با موفقیت ثبت شد و پس از بررسی ادمین در سایت نمایش داده خواهد شد.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/')}
                  className="w-full bg-green-500 hover:bg-green-600 text-white rounded-2xl"
                >
                  بازگشت به صفحه اصلی
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      sale_type: '',
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
                  }}
                  className="w-full border-border text-muted-foreground rounded-2xl"
                >
                  ثبت کالای جدید
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </LicenseGate>
    );
  }

  return (
    <LicenseGate>
      <HeaderAuth />
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-blue-700/50 rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-3xl flex items-center justify-center">
                  <Package className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">ثبت کالای موجود</h1>
                  <p className="text-blue-600 dark:text-blue-300">کالای خود را برای فروش در ASL Market معرفی کنید</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sale Type Selection */}
            <Card className="bg-card/80 border-border rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  نوع فروش
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                      formData.sale_type === 'wholesale' 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-border hover:border-blue-300'
                    }`}
                    onClick={() => handleInputChange('sale_type', 'wholesale')}
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="w-6 h-6 text-blue-400" />
                      <div>
                        <h3 className="font-semibold text-foreground">فروش عمده</h3>
                        <p className="text-sm text-muted-foreground">برای فروش با حجم بالا و قیمت عمده</p>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                      formData.sale_type === 'retail' 
                        ? 'border-green-500 bg-green-500/10' 
                        : 'border-border hover:border-green-300'
                    }`}
                    onClick={() => handleInputChange('sale_type', 'retail')}
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-6 h-6 text-green-400" />
                      <div>
                        <h3 className="font-semibold text-foreground">فروش تکی</h3>
                        <p className="text-sm text-muted-foreground">برای فروش تک‌عدد یا مقادیر کم</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card className="bg-card/80 border-border rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  اطلاعات اصلی محصول
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">نام محصول *</label>
                    <Input
                      value={formData.product_name}
                      onChange={(e) => handleInputChange('product_name', e.target.value)}
                      placeholder="مثال: زعفران سرگل ممتاز"
                      className="rounded-2xl border-border"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">دسته‌بندی *</label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger className="rounded-2xl border-border">
                        <SelectValue placeholder="انتخاب دسته‌بندی" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">زیر دسته</label>
                    <Input
                      value={formData.subcategory}
                      onChange={(e) => handleInputChange('subcategory', e.target.value)}
                      placeholder="مثال: سرگل"
                      className="rounded-2xl border-border"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">برند</label>
                    <Input
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      placeholder="نام برند"
                      className="rounded-2xl border-border"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">توضیحات</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="توضیحات کامل محصول..."
                    className="rounded-2xl border-border min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="bg-card/80 border-border rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  قیمت‌گذاری
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {formData.sale_type === 'wholesale' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">قیمت عمده</label>
                      <Input
                        value={formData.wholesale_price}
                        onChange={(e) => handleInputChange('wholesale_price', e.target.value)}
                        placeholder="قیمت عمده"
                        className="rounded-2xl border-border"
                      />
                    </div>
                  )}
                  
                  {formData.sale_type === 'retail' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">قیمت خرده</label>
                      <Input
                        value={formData.retail_price}
                        onChange={(e) => handleInputChange('retail_price', e.target.value)}
                        placeholder="قیمت خرده"
                        className="rounded-2xl border-border"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">قیمت صادراتی</label>
                    <Input
                      value={formData.export_price}
                      onChange={(e) => handleInputChange('export_price', e.target.value)}
                      placeholder="قیمت صادراتی"
                      className="rounded-2xl border-border"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">واحد پول</label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                      <SelectTrigger className="rounded-2xl border-border">
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
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">هزینه حمل</label>
                    <Input
                      value={formData.shipping_cost}
                      onChange={(e) => handleInputChange('shipping_cost', e.target.value)}
                      placeholder="هزینه حمل"
                      className="rounded-2xl border-border"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quantity & Availability */}
            <Card className="bg-card/80 border-border rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5" />
                  موجودی و مقادیر
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">موجودی</label>
                    <Input
                      type="number"
                      value={formData.available_quantity}
                      onChange={(e) => handleInputChange('available_quantity', parseInt(e.target.value) || 0)}
                      placeholder="موجودی"
                      className="rounded-2xl border-border"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">حداقل سفارش</label>
                    <Input
                      type="number"
                      value={formData.min_order_quantity}
                      onChange={(e) => handleInputChange('min_order_quantity', parseInt(e.target.value) || 1)}
                      placeholder="حداقل سفارش"
                      className="rounded-2xl border-border"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">حداکثر سفارش</label>
                    <Input
                      type="number"
                      value={formData.max_order_quantity}
                      onChange={(e) => handleInputChange('max_order_quantity', parseInt(e.target.value) || 0)}
                      placeholder="0 = بدون محدودیت"
                      className="rounded-2xl border-border"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">واحد</label>
                    <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                      <SelectTrigger className="rounded-2xl border-border">
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
              </CardContent>
            </Card>

            {/* Product Details */}
            <Card className="bg-card/80 border-border rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  جزئیات محصول
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">مدل</label>
                    <Input
                      value={formData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      placeholder="مدل محصول"
                      className="rounded-2xl border-border"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">منشاء</label>
                    <Input
                      value={formData.origin}
                      onChange={(e) => handleInputChange('origin', e.target.value)}
                      placeholder="کشور تولید"
                      className="rounded-2xl border-border"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">کیفیت</label>
                    <Select value={formData.quality} onValueChange={(value) => handleInputChange('quality', value)}>
                      <SelectTrigger className="rounded-2xl border-border">
                        <SelectValue placeholder="انتخاب کیفیت" />
                      </SelectTrigger>
                      <SelectContent>
                        {qualities.map((quality) => (
                          <SelectItem key={quality.value} value={quality.value}>
                            {quality.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">نوع بسته‌بندی</label>
                    <Input
                      value={formData.packaging_type}
                      onChange={(e) => handleInputChange('packaging_type', e.target.value)}
                      placeholder="نوع بسته‌بندی"
                      className="rounded-2xl border-border"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">وزن</label>
                    <Input
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      placeholder="مثال: 1kg"
                      className="rounded-2xl border-border"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">ابعاد</label>
                    <Input
                      value={formData.dimensions}
                      onChange={(e) => handleInputChange('dimensions', e.target.value)}
                      placeholder="مثال: 20x15x5cm"
                      className="rounded-2xl border-border"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location & Contact */}
            <Card className="bg-card/80 border-border rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  مکان و تماس
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">مکان *</label>
                    <Input
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="شهر، استان، کشور"
                      className="rounded-2xl border-border"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">شماره تماس</label>
                    <Input
                      value={formData.contact_phone}
                      onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                      placeholder="شماره تلفن"
                      className="rounded-2xl border-border"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">ایمیل</label>
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      placeholder="آدرس ایمیل"
                      className="rounded-2xl border-border"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">واتساپ</label>
                    <Input
                      value={formData.contact_whatsapp}
                      onChange={(e) => handleInputChange('contact_whatsapp', e.target.value)}
                      placeholder="شماره واتساپ"
                      className="rounded-2xl border-border"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card className="bg-card/80 border-border rounded-3xl">
              <CardHeader>
                <CardTitle>گزینه‌های صادرات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="can_export"
                    checked={formData.can_export}
                    onCheckedChange={(checked) => handleInputChange('can_export', checked)}
                  />
                  <label htmlFor="can_export" className="text-sm font-medium text-foreground">
                    قابل صادرات است
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requires_license"
                    checked={formData.requires_license}
                    onCheckedChange={(checked) => handleInputChange('requires_license', checked)}
                  />
                  <label htmlFor="requires_license" className="text-sm font-medium text-foreground">
                    نیاز به مجوز دارد
                  </label>
                </div>
                
                {formData.requires_license && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">نوع مجوز</label>
                    <Input
                      value={formData.license_type}
                      onChange={(e) => handleInputChange('license_type', e.target.value)}
                      placeholder="نوع مجوز مورد نیاز"
                      className="rounded-2xl border-border"
                    />
                  </div>
                )}
                
                {formData.can_export && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">کشورهای هدف صادرات</label>
                    <Input
                      value={formData.export_countries}
                      onChange={(e) => handleInputChange('export_countries', e.target.value)}
                      placeholder="کشورها را با کاما جدا کنید"
                      className="rounded-2xl border-border"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Media & Additional Info */}
            <Card className="bg-card/80 border-border rounded-3xl">
              <CardHeader>
                <CardTitle>اطلاعات تکمیلی</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageUpload
                  currentImage={formData.image_urls}
                  onImageChange={(imageUrl) => handleInputChange('image_urls', imageUrl)}
                  uploadType="product"
                  label="تصاویر محصول"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">لینک ویدئو</label>
                    <Input
                      value={formData.video_url}
                      onChange={(e) => handleInputChange('video_url', e.target.value)}
                      placeholder="لینک ویدئو محصول"
                      className="rounded-2xl border-border"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">لینک کاتالوگ</label>
                    <Input
                      value={formData.catalog_url}
                      onChange={(e) => handleInputChange('catalog_url', e.target.value)}
                      placeholder="لینک کاتالوگ محصول"
                      className="rounded-2xl border-border"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">برچسب‌ها</label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    placeholder="برچسب‌ها را با کاما جدا کنید"
                    className="rounded-2xl border-border"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">یادداشت‌ها</label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="یادداشت‌ها یا توضیحات اضافی..."
                    className="rounded-2xl border-border"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1 border-border text-muted-foreground hover:bg-muted rounded-2xl"
              >
                انصراف
              </Button>
              
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl"
              >
                {loading ? (
                  <>
                    <AlertCircle className="w-4 h-4 ml-2 animate-spin" />
                    در حال ثبت...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 ml-2" />
                    ثبت کالا
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </LicenseGate>
  );
};

export default SubmitProduct;