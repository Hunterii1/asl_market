import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import HeaderAuth from "@/components/ui/HeaderAuth";
import { 
  Building, 
  Package, 
  Upload, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  Star,
  Globe,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  Clock
} from "lucide-react";

interface ProductData {
  product_name: string;
  product_type: string;
  description: string;
  needs_export_license: boolean;
  required_license_type: string;
  monthly_production_min: string;
}

const PublicSupplierRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal & Contact Information
    full_name: "",
    mobile: "",
    brand_name: "",
    image_url: "",
    city: "",
    address: "",
    has_registered_business: false,
    business_registration_num: "",
    
    // Export Experience
    has_export_experience: false,
    export_price: "",
    
    // Pricing
    wholesale_min_price: "",
    wholesale_high_volume_price: "",
    can_produce_private_label: false,
    
    // Products
    products: [{ 
      product_name: "", 
      product_type: "", 
      description: "", 
      needs_export_license: false, 
      required_license_type: "", 
      monthly_production_min: "" 
    }] as ProductData[]
  });

  const productTypes = [
    { id: "food", name: "مواد غذایی" },
    { id: "herbal", name: "گیاهان دارویی" },
    { id: "health", name: "محصولات سلامت" },
    { id: "handicraft", name: "صنایع دستی" },
    { id: "industrial", name: "صنعتی" },
    { id: "home", name: "لوازم خانگی" },
    { id: "other", name: "سایر" }
  ];

  const cities = [
    "تهران", "اصفهان", "مشهد", "شیراز", "تبریز", "کرج", "اهواز", "قم", "کرمانشاه", "ارومیه",
    "زاهدان", "رشت", "کرمان", "یزد", "همدان", "اردبیل", "بندرعباس", "اسلام‌شهر", "زنجان", "کاشان"
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInputChangeWithDelay = (field: string, value: any) => {
    // Use a timeout to debounce the input changes
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }, 0);
  };

  const handleProductChange = (index: number, field: string, value: any) => {
    const newProducts = [...formData.products];
    newProducts[index] = {
      ...newProducts[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      products: newProducts
    }));
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { 
        product_name: "", 
        product_type: "", 
        description: "", 
        needs_export_license: false, 
        required_license_type: "", 
        monthly_production_min: "" 
      }]
    }));
  };

  const removeProduct = (index: number) => {
    if (formData.products.length > 1) {
      const newProducts = formData.products.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        products: newProducts
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/v1/public/supplier/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "ثبت‌نام موفق",
          description: "درخواست شما با موفقیت ثبت شد. پس از تأیید ادمین، اطلاعات شما در پلتفرم نمایش داده خواهد شد.",
        });
        navigate('/');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'خطا در ثبت‌نام');
      }
    } catch (error: any) {
      toast({
        title: "خطا در ثبت‌نام",
        description: error.message || "خطایی رخ داده است. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all duration-300 ${
            step <= currentStep 
              ? "bg-blue-500 text-white shadow-lg" 
              : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
          }`}>
            {step}
          </div>
          {step < 4 && (
            <div className={`w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 transition-all duration-300 ${
              step < currentStep ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-600"
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const Step1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Building className="w-16 h-16 mx-auto text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-foreground">اطلاعات شخصی و تماس</h2>
        <p className="text-muted-foreground">لطفاً اطلاعات شخصی و تماس خود را وارد کنید</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="full_name">نام و نام خانوادگی *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => {
              const value = e.target.value;
              setFormData(prev => ({
                ...prev,
                full_name: value
              }));
            }}
            placeholder="نام و نام خانوادگی خود را وارد کنید"
            required
            className="text-right"
            dir="rtl"
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobile">شماره موبایل *</Label>
          <Input
            id="mobile"
            value={formData.mobile}
            onChange={(e) => {
              const value = e.target.value;
              setFormData(prev => ({
                ...prev,
                mobile: value
              }));
            }}
            placeholder="09123456789"
            required
            className="text-right"
            dir="ltr"
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand_name">نام برند</Label>
          <Input
            id="brand_name"
            key="brand_name"
            value={formData.brand_name}
            onChange={(e) => handleInputChange('brand_name', e.target.value)}
            placeholder="نام برند یا شرکت شما"
            className="text-right"
            dir="rtl"
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">شهر *</Label>
          <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
            <SelectTrigger className="text-right">
              <SelectValue placeholder="شهر خود را انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city} value={city} className="text-right">
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="address">آدرس کامل *</Label>
          <Textarea
            id="address"
            key="address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="آدرس کامل محل کار یا تولید خود را وارد کنید"
            required
            className="text-right"
            dir="rtl"
            rows={3}
            autoComplete="off"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="image_url">لینک تصویر</Label>
          <Input
            id="image_url"
            key="image_url"
            value={formData.image_url}
            onChange={(e) => handleInputChange('image_url', e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="text-right"
            dir="ltr"
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );

  const Step2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <FileText className="w-16 h-16 mx-auto text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-foreground">اطلاعات کسب‌وکار</h2>
        <p className="text-muted-foreground">اطلاعات مربوط به کسب‌وکار و مجوزهای شما</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Checkbox
            id="has_registered_business"
            checked={formData.has_registered_business}
            onCheckedChange={(checked) => handleInputChange('has_registered_business', checked)}
          />
          <Label htmlFor="has_registered_business">کسب‌وکار ثبت شده دارم</Label>
        </div>

        {formData.has_registered_business && (
          <div className="space-y-2">
            <Label htmlFor="business_registration_num">شماره ثبت کسب‌وکار</Label>
              <Input
                id="business_registration_num"
                key="business_registration_num"
                value={formData.business_registration_num}
                onChange={(e) => handleInputChange('business_registration_num', e.target.value)}
                placeholder="شماره ثبت کسب‌وکار خود را وارد کنید"
                className="text-right"
                dir="ltr"
                autoComplete="off"
              />
          </div>
        )}

        <div className="flex items-center space-x-2 space-x-reverse">
          <Checkbox
            id="has_export_experience"
            checked={formData.has_export_experience}
            onCheckedChange={(checked) => handleInputChange('has_export_experience', checked)}
          />
          <Label htmlFor="has_export_experience">تجربه صادرات دارم</Label>
        </div>

        {formData.has_export_experience && (
          <div className="space-y-2">
            <Label htmlFor="export_price">قیمت صادرات</Label>
              <Textarea
                id="export_price"
                key="export_price"
                value={formData.export_price}
                onChange={(e) => handleInputChange('export_price', e.target.value)}
                placeholder="اطلاعات مربوط به قیمت‌گذاری صادرات خود را وارد کنید"
                className="text-right"
                dir="rtl"
                rows={3}
                autoComplete="off"
              />
          </div>
        )}

        <div className="flex items-center space-x-2 space-x-reverse">
          <Checkbox
            id="can_produce_private_label"
            checked={formData.can_produce_private_label}
            onCheckedChange={(checked) => handleInputChange('can_produce_private_label', checked)}
          />
          <Label htmlFor="can_produce_private_label">قابلیت تولید برند اختصاصی دارم</Label>
        </div>
      </div>
    </div>
  );

  const Step3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <DollarSign className="w-16 h-16 mx-auto text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-foreground">قیمت‌گذاری</h2>
        <p className="text-muted-foreground">اطلاعات مربوط به قیمت‌گذاری محصولات شما</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="wholesale_min_price">حداقل قیمت عمده‌فروشی *</Label>
          <Input
            id="wholesale_min_price"
            key="wholesale_min_price"
            value={formData.wholesale_min_price}
            onChange={(e) => handleInputChange('wholesale_min_price', e.target.value)}
            placeholder="مثال: 100000 تومان"
            required
            className="text-right"
            dir="rtl"
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wholesale_high_volume_price">قیمت عمده‌فروشی حجم بالا</Label>
          <Input
            id="wholesale_high_volume_price"
            key="wholesale_high_volume_price"
            value={formData.wholesale_high_volume_price}
            onChange={(e) => handleInputChange('wholesale_high_volume_price', e.target.value)}
            placeholder="مثال: 80000 تومان"
            className="text-right"
            dir="rtl"
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );

  const Step4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Package className="w-16 h-16 mx-auto text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-foreground">محصولات</h2>
        <p className="text-muted-foreground">اطلاعات محصولاتی که ارائه می‌دهید</p>
      </div>

      <div className="space-y-6">
        {formData.products.map((product, index) => (
          <Card key={index} className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">محصول {index + 1}</h3>
              {formData.products.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeProduct(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  حذف
                </Button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نام محصول *</Label>
                <Input
                  key={`product_name_${index}`}
                  value={product.product_name}
                  onChange={(e) => handleProductChange(index, 'product_name', e.target.value)}
                  placeholder="نام محصول را وارد کنید"
                  required
                  className="text-right"
                  dir="rtl"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label>نوع محصول *</Label>
                <Select 
                  value={product.product_type} 
                  onValueChange={(value) => handleProductChange(index, 'product_type', value)}
                >
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="نوع محصول را انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id} className="text-right">
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label>توضیحات محصول *</Label>
                <Textarea
                  key={`product_description_${index}`}
                  value={product.description}
                  onChange={(e) => handleProductChange(index, 'description', e.target.value)}
                  placeholder="توضیحات کامل محصول را وارد کنید"
                  required
                  className="text-right"
                  dir="rtl"
                  rows={3}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label>حداقل تولید ماهانه *</Label>
                <Input
                  key={`product_production_${index}`}
                  value={product.monthly_production_min}
                  onChange={(e) => handleProductChange(index, 'monthly_production_min', e.target.value)}
                  placeholder="مثال: 1000 کیلوگرم"
                  required
                  className="text-right"
                  dir="rtl"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    checked={product.needs_export_license}
                    onCheckedChange={(checked) => handleProductChange(index, 'needs_export_license', checked)}
                  />
                  <Label>نیاز به مجوز صادرات دارد</Label>
                </div>
              </div>

              {product.needs_export_license && (
                <div className="space-y-2">
                  <Label>نوع مجوز مورد نیاز</Label>
                  <Input
                    value={product.required_license_type}
                    onChange={(e) => handleProductChange(index, 'required_license_type', e.target.value)}
                    placeholder="نوع مجوز مورد نیاز را وارد کنید"
                    className="text-right"
                    dir="rtl"
                  />
                </div>
              )}
            </div>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addProduct}
          className="w-full"
        >
          <Package className="w-4 h-4 ml-2" />
          افزودن محصول جدید
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <HeaderAuth />
      <div className="container mx-auto px-2 sm:px-4 max-w-4xl py-4 sm:py-8">
        <StepIndicator />
        <Card className="shadow-2xl">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-3">
              <Building className="w-6 h-6 sm:w-8 sm:h-8" />
              ثبت‌نام تأمین‌کننده
            </CardTitle>
            <p className="text-blue-100 mt-2 text-sm sm:text-base">
              در شبکه تأمین‌کنندگان اصل مارکت عضو شوید
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-8">
            <form onSubmit={handleSubmit}>
              {currentStep === 1 && <Step1 />}
              {currentStep === 2 && <Step2 />}
              {currentStep === 3 && <Step3 />}
              {currentStep === 4 && <Step4 />}

              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  قبلی
                </Button>

                {currentStep < 4 ? (
                  <Button type="button" onClick={nextStep}>
                    بعدی
                    <ArrowRight className="w-4 h-4 mr-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        در حال ثبت‌نام...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        ثبت‌نام نهایی
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>

            <Alert className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                پس از ثبت‌نام، درخواست شما توسط تیم ادمین بررسی شده و در صورت تأیید، 
                اطلاعات شما در پلتفرم نمایش داده خواهد شد. این فرآیند ممکن است 24-48 ساعت طول بکشد.
              </AlertDescription>
            </Alert>

            <div className="mt-6 text-center">
              <Button 
                onClick={() => window.location.href = `/public/registration-status?mobile=${formData.mobile}&type=supplier`} 
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Clock className="w-4 h-4 ml-2" />
                بررسی وضعیت درخواست
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicSupplierRegistration;
