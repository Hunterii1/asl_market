import { useState, useEffect } from 'react';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  AlertTriangle,
  User,
  MapPin,
  Building,
  Package,
  Plus,
  Trash2,
  Save,
  ArrowLeft
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import HeaderAuth from '@/components/ui/HeaderAuth';

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

const PRODUCT_TYPES = [
  { value: 'food', label: 'غذایی' },
  { value: 'herbal', label: 'گیاهی' },
  { value: 'health', label: 'بهداشتی' },
  { value: 'handicraft', label: 'دستی' },
  { value: 'industrial', label: 'صنعتی' },
  { value: 'home', label: 'خانگی' },
  { value: 'other', label: 'سایر' },
];

export default function EditSupplier() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [supplierData, setSupplierData] = useState<any>(null);

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

  useEffect(() => {
    fetchSupplierData();
  }, []);

  const fetchSupplierData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSupplierStatus();
      
      if (response.has_supplier) {
        setSupplierData(response.supplier);
        setFormData({
          full_name: response.supplier.full_name || '',
          mobile: response.supplier.mobile || '',
          brand_name: response.supplier.brand_name || '',
          city: response.supplier.city || '',
          address: response.supplier.address || '',
          image_url: response.supplier.image_url || '',
          has_registered_business: response.supplier.has_registered_business || false,
          business_registration_num: response.supplier.business_registration_num || '',
          has_export_experience: response.supplier.has_export_experience || false,
          export_price: response.supplier.export_price || '',
          wholesale_min_price: response.supplier.wholesale_min_price || '',
          wholesale_high_volume_price: response.supplier.wholesale_high_volume_price || '',
          can_produce_private_label: response.supplier.can_produce_private_label || false,
          products: response.supplier.products?.map((product: any) => ({
            product_name: product.product_name || '',
            product_type: product.product_type || '',
            description: product.description || '',
            needs_export_license: product.needs_export_license || false,
            required_license_type: product.required_license_type || '',
            monthly_production_min: product.monthly_production_min || '',
          })) || [{
            product_name: '',
            product_type: '',
            description: '',
            needs_export_license: false,
            required_license_type: '',
            monthly_production_min: '',
          }],
        });
      }
    } catch (error) {
      console.error('Error fetching supplier data:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "خطا در دریافت اطلاعات تأمین‌کننده",
      });
    } finally {
      setLoading(false);
    }
  };

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
        return !!(formData.full_name && formData.mobile && formData.city && 
                 formData.address && formData.wholesale_min_price);
      case 2:
        return formData.products.every(product => 
          product.product_name && product.product_type && product.description
        );
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 2));
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
    if (!validateStep(2)) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "لطفا تمام اطلاعات را کامل کنید",
      });
      return;
    }

    setSaving(true);
    try {
      await apiService.updateSupplier(formData);
      
      toast({
        title: "موفقیت‌آمیز",
        description: "اطلاعات تأمین‌کننده با موفقیت به‌روزرسانی شد. پس از بررسی مجدد توسط تیم ما، وضعیت شما اعلام خواهد شد.",
        duration: 8000,
      });

      navigate('/supplier-status');
      
    } catch (error: any) {
      console.error('Error updating supplier:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: error?.message || "خطا در به‌روزرسانی اطلاعات تأمین‌کننده. لطفا دوباره تلاش کنید",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await apiService.deleteSupplier();
      
      toast({
        title: "موفقیت‌آمیز",
        description: "اطلاعات تأمین‌کننده با موفقیت حذف شد",
      });

      navigate('/supplier-status');
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: error?.message || "خطا در حذف اطلاعات تأمین‌کننده. لطفا دوباره تلاش کنید",
      });
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            برای ویرایش اطلاعات تأمین‌کننده، ابتدا وارد حساب کاربری خود شوید.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>در حال بارگذاری اطلاعات...</p>
        </div>
      </div>
    );
  }

  if (!supplierData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            شما هنوز به عنوان تأمین‌کننده ثبت‌نام نکرده‌اید.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">اطلاعات شخصی و تماس</h2>
        <p className="text-gray-600">اطلاعات هویتی و تماس خود را وارد کنید</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="full_name" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            نام کامل *
          </Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => updateFormData('full_name', e.target.value)}
            placeholder="نام و نام خانوادگی"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobile">شماره موبایل *</Label>
          <Input
            id="mobile"
            type="tel"
            value={formData.mobile}
            onChange={(e) => updateFormData('mobile', e.target.value)}
            placeholder="شماره موبایل"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="brand_name">نام برند</Label>
          <Input
            id="brand_name"
            value={formData.brand_name}
            onChange={(e) => updateFormData('brand_name', e.target.value)}
            placeholder="نام برند یا شرکت"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            شهر *
          </Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => updateFormData('city', e.target.value)}
            placeholder="شهر"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">آدرس کامل *</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => updateFormData('address', e.target.value)}
          placeholder="آدرس کامل محل کار"
          rows={3}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image_url">لینک تصویر</Label>
        <Input
          id="image_url"
          type="url"
          value={formData.image_url}
          onChange={(e) => updateFormData('image_url', e.target.value)}
          placeholder="لینک تصویر برند یا محصول"
        />
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Building className="h-5 w-5" />
          اطلاعات کسب‌وکار
        </h3>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_registered_business"
              checked={formData.has_registered_business}
              onCheckedChange={(checked) => updateFormData('has_registered_business', checked)}
            />
            <Label htmlFor="has_registered_business">آیا کسب‌وکار ثبت شده دارید؟</Label>
          </div>

          {formData.has_registered_business && (
            <div className="space-y-2">
              <Label htmlFor="business_registration_num">شماره ثبت کسب‌وکار</Label>
              <Input
                id="business_registration_num"
                value={formData.business_registration_num}
                onChange={(e) => updateFormData('business_registration_num', e.target.value)}
                placeholder="شماره ثبت کسب‌وکار"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_export_experience"
              checked={formData.has_export_experience}
              onCheckedChange={(checked) => updateFormData('has_export_experience', checked)}
            />
            <Label htmlFor="has_export_experience">آیا تجربه صادرات دارید؟</Label>
          </div>

          {formData.has_export_experience && (
            <div className="space-y-2">
              <Label htmlFor="export_price">قیمت‌گذاری صادرات</Label>
              <Textarea
                id="export_price"
                value={formData.export_price}
                onChange={(e) => updateFormData('export_price', e.target.value)}
                placeholder="توضیح قیمت‌گذاری برای صادرات"
                rows={3}
              />
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">قیمت‌گذاری</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="wholesale_min_price">حداقل قیمت عمده‌فروشی *</Label>
            <Input
              id="wholesale_min_price"
              value={formData.wholesale_min_price}
              onChange={(e) => updateFormData('wholesale_min_price', e.target.value)}
              placeholder="حداقل قیمت عمده‌فروشی"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wholesale_high_volume_price">قیمت عمده‌فروشی حجم بالا</Label>
            <Input
              id="wholesale_high_volume_price"
              value={formData.wholesale_high_volume_price}
              onChange={(e) => updateFormData('wholesale_high_volume_price', e.target.value)}
              placeholder="قیمت برای حجم‌های بالا"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="can_produce_private_label"
            checked={formData.can_produce_private_label}
            onCheckedChange={(checked) => updateFormData('can_produce_private_label', checked)}
          />
          <Label htmlFor="can_produce_private_label">آیا می‌توانید برچسب خصوصی تولید کنید؟</Label>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">محصولات</h2>
        <p className="text-gray-600">محصولات خود را معرفی کنید</p>
      </div>

      <div className="space-y-4">
        {formData.products.map((product, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">محصول {index + 1}</CardTitle>
                {formData.products.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeProduct(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`product_name_${index}`}>نام محصول *</Label>
                  <Input
                    id={`product_name_${index}`}
                    value={product.product_name}
                    onChange={(e) => updateProduct(index, 'product_name', e.target.value)}
                    placeholder="نام محصول"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`product_type_${index}`}>نوع محصول *</Label>
                  <Select
                    value={product.product_type}
                    onValueChange={(value) => updateProduct(index, 'product_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="نوع محصول را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`description_${index}`}>توضیحات محصول *</Label>
                <Textarea
                  id={`description_${index}`}
                  value={product.description}
                  onChange={(e) => updateProduct(index, 'description', e.target.value)}
                  placeholder="توضیحات کامل محصول"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`monthly_production_min_${index}`}>حداقل تولید ماهانه</Label>
                  <Input
                    id={`monthly_production_min_${index}`}
                    value={product.monthly_production_min}
                    onChange={(e) => updateProduct(index, 'monthly_production_min', e.target.value)}
                    placeholder="حداقل تولید ماهانه"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`required_license_type_${index}`}>نوع لایسنس مورد نیاز</Label>
                  <Input
                    id={`required_license_type_${index}`}
                    value={product.required_license_type}
                    onChange={(e) => updateProduct(index, 'required_license_type', e.target.value)}
                    placeholder="نوع لایسنس مورد نیاز"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`needs_export_license_${index}`}
                  checked={product.needs_export_license}
                  onCheckedChange={(checked) => updateProduct(index, 'needs_export_license', checked)}
                />
                <Label htmlFor={`needs_export_license_${index}`}>
                  آیا برای صادرات این محصول نیاز به لایسنس دارید؟
                </Label>
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
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <HeaderAuth />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/supplier-status')}
              className="mb-4 hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              بازگشت به وضعیت تأمین‌کننده
            </Button>
            
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">ویرایش اطلاعات تأمین‌کننده</h1>
                    <p className="text-muted-foreground mt-2">
                      اطلاعات تأمین‌کننده خود را به‌روزرسانی کنید
                    </p>
                  </div>
                  
                  <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={deleting || saving || loading}
                        className="flex items-center gap-2 rounded-xl"
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف تأمین‌کننده
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl border-border">
                      <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                          </div>
                          <AlertDialogTitle className="text-2xl text-foreground">حذف اطلاعات تأمین‌کننده</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-base pt-4 space-y-3">
                          <p className="text-foreground">
                            آیا مطمئن هستید که می‌خواهید اطلاعات تأمین‌کننده خود را حذف کنید؟
                          </p>
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                              <div className="space-y-1">
                                <p className="font-semibold text-red-800 dark:text-red-300">این عمل قابل بازگشت نیست</p>
                                <p className="text-sm text-red-700 dark:text-red-400">
                                  تمام اطلاعات تأمین‌کننده و محصولات مرتبط از سیستم حذف خواهد شد و دیگر قادر به دسترسی به این اطلاعات نخواهید بود.
                                </p>
                              </div>
                            </div>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel disabled={deleting} className="rounded-xl">انصراف</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={deleting}
                          className="bg-red-600 hover:bg-red-700 text-white rounded-xl gap-2"
                        >
                          {deleting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              در حال حذف...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              حذف
                            </>
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
            </Card>
          </div>

          <Card className="shadow-lg border-border">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground">مرحله {currentStep} از 2</CardTitle>
                <div className="flex space-x-2">
                  {[1, 2].map((step) => (
                    <div
                      key={step}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step <= currentStep
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}

              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  قبلی
                </Button>

                {currentStep < 2 ? (
                  <Button onClick={nextStep}>
                    بعدی
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={saving || deleting}
                    className="flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        در حال ذخیره...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        به‌روزرسانی اطلاعات
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
