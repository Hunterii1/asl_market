import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  AlertTriangle,
  User,
  Building,
  Package,
  DollarSign,
  CheckCircle,
  Info
} from 'lucide-react';
import { apiService } from '@/services/api';
import HeaderAuth from '@/components/ui/HeaderAuth';
import { ImageUpload } from '@/components/ImageUpload';
import { PRODUCT_CATEGORIES, SUPPLIER_SERVICES_DISCLAIMER } from '@/constants/productCategories';

interface SupplierProduct {
  product_name: string;
  product_type: string;
  description: string;
  needs_export_license: boolean;
  required_license_type: string;
  monthly_production_min: string;
}

interface SupplierFormData {
  full_name: string;
  mobile: string;
  brand_name: string;
  city: string;
  address: string;
  image_url: string;
  has_registered_business: boolean;
  business_registration_num: string;
  has_export_experience: boolean;
  export_price: string;
  wholesale_min_price: string;
  wholesale_high_volume_price: string;
  can_produce_private_label: boolean;
  products: SupplierProduct[];
}

const PRODUCT_TYPE_OPTIONS = PRODUCT_CATEGORIES.map((c) => ({ value: c.id, label: c.name }));

export default function SupplierRegistration() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState<SupplierFormData>({
    full_name: '',
    mobile: '',
    brand_name: '',
    city: '',
    address: '',
    image_url: '',
    has_registered_business: false,
    business_registration_num: '',
    has_export_experience: false,
    export_price: '',
    wholesale_min_price: '',
    wholesale_high_volume_price: '',
    can_produce_private_label: false,
    products: [{
      product_name: '',
      product_type: '',
      description: '',
      needs_export_license: false,
      required_license_type: '',
      monthly_production_min: '',
    }],
  });

  const updateFormData = (field: keyof SupplierFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, {
        product_name: '',
        product_type: '',
        description: '',
        needs_export_license: false,
        required_license_type: '',
        monthly_production_min: '',
      }]
    }));
  };

  const removeProduct = (index: number) => {
    if (formData.products.length > 1) {
      setFormData(prev => ({
        ...prev,
        products: prev.products.filter((_, i) => i !== index)
      }));
    }
  };

  const updateProduct = (index: number, field: keyof SupplierProduct, value: any) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => 
        i === index ? { ...product, [field]: value } : product
      )
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.full_name && formData.mobile && formData.city && formData.address);
      case 2:
        return formData.products.every(p => 
          p.product_name && p.product_type && p.description && p.monthly_production_min
        );
      case 3:
        return !!formData.wholesale_min_price;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "لطفا تمام فیلدهای الزامی را پر کنید",
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "لطفا تمام اطلاعات را کامل کنید",
      });
      return;
    }

    setLoading(true);
    try {
      await apiService.registerSupplier(formData);
      
      toast({
        title: "موفقیت‌آمیز",
        description: "درخواست ثبت‌نام تأمین‌کننده شما با موفقیت ارسال شد. پس از بررسی توسط تیم ما با شما تماس گرفته خواهد شد.",
        duration: 8000,
      });

      // Navigate to success page or supplier status
      navigate('/supplier-status');
      
    } catch (error) {
      console.error('Error registering supplier:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            برای ثبت‌نام به عنوان تأمین‌کننده، ابتدا وارد حساب کاربری خود شوید.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">۱. اطلاعات هویتی و تماس</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="full_name">نام و نام خانوادگی *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => updateFormData('full_name', e.target.value)}
            placeholder="نام کامل خود را وارد کنید"
            dir="rtl"
          />
        </div>

        <div>
          <Label htmlFor="mobile">شماره موبایل (واتساپ) *</Label>
          <Input
            id="mobile"
            value={formData.mobile}
            onChange={(e) => updateFormData('mobile', e.target.value)}
            placeholder="09123456789"
            dir="ltr"
          />
        </div>

        <div>
          <Label htmlFor="brand_name">نام برند (در صورت وجود)</Label>
          <Input
            id="brand_name"
            value={formData.brand_name}
            onChange={(e) => updateFormData('brand_name', e.target.value)}
            placeholder="نام برند شما"
            dir="rtl"
          />
        </div>

        <ImageUpload
          currentImage={formData.image_url}
          onImageChange={(imageUrl) => updateFormData('image_url', imageUrl)}
          uploadType="supplier"
          label="تصویر شخصی یا لوگو برند"
        />

        <div>
          <Label htmlFor="city">شهر / استان محل فعالیت *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => updateFormData('city', e.target.value)}
            placeholder="تهران، اصفهان، ..."
            dir="rtl"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">آدرس دقیق کارگاه یا محل تولید *</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => updateFormData('address', e.target.value)}
          placeholder="آدرس کامل محل تولید یا کارگاه"
          rows={3}
          dir="rtl"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Checkbox
            id="has_business"
            checked={formData.has_registered_business}
            onCheckedChange={(checked) => updateFormData('has_registered_business', checked)}
          />
          <Label htmlFor="has_business">کسب‌وکار ثبت‌شده دارم</Label>
        </div>

        {formData.has_registered_business && (
          <div>
            <Label htmlFor="business_reg">شماره ثبت / شناسه ملی شرکت</Label>
            <Input
              id="business_reg"
              value={formData.business_registration_num}
              onChange={(e) => updateFormData('business_registration_num', e.target.value)}
              placeholder="شماره ثبت شرکت"
              dir="ltr"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">۲. اطلاعات محصولات</h3>
      </div>

      {formData.products.map((product, index) => (
        <Card key={index} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">محصول {index + 1}</CardTitle>
              {formData.products.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeProduct(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>نام محصول *</Label>
                <Input
                  value={product.product_name}
                  onChange={(e) => updateProduct(index, 'product_name', e.target.value)}
                  placeholder="نام محصول"
                  dir="rtl"
                />
              </div>

              <div>
                <Label>نوع محصول *</Label>
                <Select
                  value={product.product_type}
                  onValueChange={(value) => updateProduct(index, 'product_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب نوع محصول" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>توضیح مختصر درباره محصول *</Label>
              <Textarea
                value={product.description}
                onChange={(e) => updateProduct(index, 'description', e.target.value)}
                placeholder="کیفیت، ویژگی خاص و مزایای محصول"
                rows={3}
                dir="rtl"
              />
            </div>

            <div>
              <Label>حداقل میزان تولید ماهانه *</Label>
              <Input
                value={product.monthly_production_min}
                onChange={(e) => updateProduct(index, 'monthly_production_min', e.target.value)}
                placeholder="مثال: ۱۰۰ کیلوگرم در ماه"
                dir="rtl"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  checked={product.needs_export_license}
                  onCheckedChange={(checked) => updateProduct(index, 'needs_export_license', checked)}
                />
                <Label>محصول نیاز به مجوز صادراتی دارد</Label>
              </div>

              {product.needs_export_license && (
                <div>
                  <Label>نوع مجوز موردنیاز</Label>
                  <Input
                    value={product.required_license_type}
                    onChange={(e) => updateProduct(index, 'required_license_type', e.target.value)}
                    placeholder="مثال: بهداشت، دامپزشکی، قرنطینه، گمرک"
                    dir="rtl"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addProduct}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        افزودن محصول جدید
      </Button>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">۳. سابقه صادراتی و قیمت‌گذاری</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Checkbox
            checked={formData.has_export_experience}
            onCheckedChange={(checked) => updateFormData('has_export_experience', checked)}
          />
          <Label>تاکنون صادرات داشته‌ام</Label>
        </div>

        {formData.has_export_experience && (
          <div>
            <Label htmlFor="export_price">قیمت تمام‌شده صادراتی</Label>
            <Textarea
              id="export_price"
              value={formData.export_price}
              onChange={(e) => updateFormData('export_price', e.target.value)}
              placeholder="قیمت محصول + هزینه ارسال به مقصد"
              rows={3}
              dir="rtl"
            />
          </div>
        )}
      </div>

      <Separator />

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>مهم:</strong> لطفا پایین‌ترین قیمت فروش موجود در بازار ایران را ارائه دهید. این قیمت صرفاً برای کارشناسی و ثبت داخلی است.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <Label htmlFor="wholesale_min">قیمت عمده حداقلی *</Label>
          <Textarea
            id="wholesale_min"
            value={formData.wholesale_min_price}
            onChange={(e) => updateFormData('wholesale_min_price', e.target.value)}
            placeholder="مثال: ۱۰۰ گرم زعفران – هر گرم ۱۲۰ هزار تومان"
            rows={3}
            dir="rtl"
          />
        </div>

        <div>
          <Label htmlFor="wholesale_high">قیمت عمده برای حجم بالا</Label>
          <Textarea
            id="wholesale_high"
            value={formData.wholesale_high_volume_price}
            onChange={(e) => updateFormData('wholesale_high_volume_price', e.target.value)}
            placeholder="مثال: بیش از ۱ کیلو زعفران – هر گرم ۱۱۰ هزار تومان"
            rows={3}
            dir="rtl"
          />
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <Checkbox
            checked={formData.can_produce_private_label}
            onCheckedChange={(checked) => updateFormData('can_produce_private_label', checked)}
          />
          <Label>امکان تولید محصول با برند سفارش‌دهنده را دارم</Label>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">۴. تایید و ارسال</h3>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="space-y-2">
          <p><strong>📌 توجه:</strong></p>
          <p>این فرم صرفاً برای ثبت اولیه محصولات شما در پلتفرم ASL MARKET طراحی شده است. تکمیل اطلاعات، صرفاً به معنای پذیرش نهایی نیست. بررسی و تماس پس از ارسال فرم انجام می‌شود.</p>
        </AlertDescription>
      </Alert>

      <div className="bg-muted p-4 rounded-lg space-y-3">
        <h4 className="font-semibold">خلاصه اطلاعات:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">نام:</span> {formData.full_name}
          </div>
          <div>
            <span className="font-medium">موبایل:</span> {formData.mobile}
          </div>
          <div>
            <span className="font-medium">شهر:</span> {formData.city}
          </div>
          <div>
            <span className="font-medium">تعداد محصولات:</span> {formData.products.length}
          </div>
        </div>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>✅ تایید:</strong> با ارسال این فرم، متعهد می‌شوم اطلاعات فوق دقیق بوده و در صورت پذیرش در تیم تأمین، همکاری بلندمدت با شرایط اعلام‌شده صورت گیرد.
        </AlertDescription>
      </Alert>

      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-6 text-lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            در حال ارسال...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-5 w-5" />
            ارسال درخواست ثبت‌نام
          </>
        )}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <HeaderAuth />
      <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            فرم ثبت‌نام تأمین‌کنندگان ASL SUPPLIER
          </CardTitle>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center mt-6">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{SUPPLIER_SERVICES_DISCLAIMER}</AlertDescription>
          </Alert>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Navigation buttons */}
          {currentStep < 4 && (
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                مرحله قبل
              </Button>
              <Button onClick={nextStep}>
                مرحله بعد
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}