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
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  AlertTriangle,
  User,
  MapPin,
  CreditCard,
  Briefcase,
  FileCheck,
  Info,
  CheckCircle,
  Phone,
  Mail,
  Calendar,
  IdCard,
  Home,
  Plane,
  Building,
  Languages,
  Star,
  Save,
  ArrowLeft
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import HeaderAuth from '@/components/ui/HeaderAuth';

interface VisitorFormData {
  // Personal Identification Information
  full_name: string;
  national_id: string;
  passport_number: string;
  birth_date: string;
  mobile: string;
  whatsapp_number: string;
  email: string;
  
  // Residence and Travel Information
  residence_address: string;
  city_province: string;
  destination_cities: string;
  has_local_contact: boolean;
  local_contact_details: string;
  
  // Banking and Payment Information
  bank_account_iban: string;
  bank_name: string;
  account_holder_name: string;
  
  // Work Experience and Skills
  has_marketing_experience: boolean;
  marketing_experience_desc: string;
  language_level: string;
  special_skills: string;
  
  // Commitments and Agreements
  agrees_to_use_approved_products: boolean;
  agrees_to_violation_consequences: boolean;
  agrees_to_submit_reports: boolean;
  digital_signature: string;
  signature_date: string;
}

const LANGUAGE_LEVELS = [
  { value: 'excellent', label: 'عالی' },
  { value: 'good', label: 'متوسط' },
  { value: 'weak', label: 'ضعیف' },
  { value: 'none', label: 'بلد نیستم' },
];

export default function EditVisitor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [visitorData, setVisitorData] = useState<any>(null);

  const [formData, setFormData] = useState<VisitorFormData>({
    full_name: '',
    national_id: '',
    passport_number: '',
    birth_date: '',
    mobile: '',
    whatsapp_number: '',
    email: '',
    residence_address: '',
    city_province: '',
    destination_cities: '',
    has_local_contact: false,
    local_contact_details: '',
    bank_account_iban: '',
    bank_name: '',
    account_holder_name: '',
    has_marketing_experience: false,
    marketing_experience_desc: '',
    language_level: '',
    special_skills: '',
    agrees_to_use_approved_products: false,
    agrees_to_violation_consequences: false,
    agrees_to_submit_reports: false,
    digital_signature: '',
    signature_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchVisitorData();
  }, []);

  const fetchVisitorData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyVisitorStatus();
      
      if (response.has_visitor) {
        setVisitorData(response.visitor);
        setFormData({
          full_name: response.visitor.full_name || '',
          national_id: response.visitor.national_id || '',
          passport_number: response.visitor.passport_number || '',
          birth_date: response.visitor.birth_date || '',
          mobile: response.visitor.mobile || '',
          whatsapp_number: response.visitor.whatsapp_number || '',
          email: response.visitor.email || '',
          residence_address: response.visitor.residence_address || '',
          city_province: response.visitor.city_province || '',
          destination_cities: response.visitor.destination_cities || '',
          has_local_contact: response.visitor.has_local_contact || false,
          local_contact_details: response.visitor.local_contact_details || '',
          bank_account_iban: response.visitor.bank_account_iban || '',
          bank_name: response.visitor.bank_name || '',
          account_holder_name: response.visitor.account_holder_name || '',
          has_marketing_experience: response.visitor.has_marketing_experience || false,
          marketing_experience_desc: response.visitor.marketing_experience_desc || '',
          language_level: response.visitor.language_level || '',
          special_skills: response.visitor.special_skills || '',
          agrees_to_use_approved_products: response.visitor.agrees_to_use_approved_products || false,
          agrees_to_violation_consequences: response.visitor.agrees_to_violation_consequences || false,
          agrees_to_submit_reports: response.visitor.agrees_to_submit_reports || false,
          digital_signature: response.visitor.digital_signature || '',
          signature_date: response.visitor.signature_date || new Date().toISOString().split('T')[0],
        });
      }
    } catch (error) {
      console.error('Error fetching visitor data:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "خطا در دریافت اطلاعات ویزیتور",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof VisitorFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // List of Iranian cities to validate against
  const iranianCities = [
    "تهران", "مشهد", "اصفهان", "شیراز", "تبریز", "کرج", "اهواز", "قم", 
    "کرمانشاه", "ارومیه", "یزد", "زاهدان", "رشت", "کرمان", "همدان", 
    "اردبیل", "بندرعباس", "اسلامشهر", "زنجان", "سنندج", "یاسوج", 
    "بوشهر", "بیرجند", "شهرکرد", "گرگان", "ساری", "اراک", "بابل", 
    "قزوین", "خرمآباد", "سمنان", "کاشان", "گلستان", "سیستان", 
    "بلوچستان", "کهگیلویه", "بویراحمد", "ایران", "جمهوری اسلامی"
  ];

  const isIranianLocation = (location: string) => {
    return iranianCities.some(city => 
      location.toLowerCase().includes(city.toLowerCase())
    );
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Validate city/province format and location
        if (!formData.residence_address || !formData.city_province || !formData.destination_cities) {
          return false;
        }
        
        // Check if city/province contains space (City Country format)
        if (!formData.city_province.includes(' ')) {
          toast({
            title: "فرمت نادرست",
            description: "لطفا شهر و کشور را به فرمت صحیح وارد کنید (مثل: مسقط عمان)",
            variant: "destructive",
          });
          return false;
        }
        
        // Check if destination cities contain space
        if (!formData.destination_cities.includes(' ')) {
          toast({
            title: "فرمت نادرست",
            description: "لطفا شهرهای مقصد را به فرمت صحیح وارد کنید (مثل: مسقط عمان، دبی امارات)",
            variant: "destructive",
          });
          return false;
        }
        
        // Check if location is Iranian
        if (isIranianLocation(formData.city_province)) {
          toast({
            title: "مکان نامعتبر",
            description: "ویزیتورها باید ساکن کشورهای عربی باشند، نه ایران",
            variant: "destructive",
          });
          return false;
        }
        
        // Check if destination is Iranian
        if (isIranianLocation(formData.destination_cities)) {
          toast({
            title: "مقصد نامعتبر",
            description: "شهرهای مقصد باید خارج از ایران باشد",
            variant: "destructive",
          });
          return false;
        }
        
        return !!(formData.full_name && formData.national_id && formData.birth_date && 
                 formData.mobile && formData.whatsapp_number);
      case 2:
        return !!(formData.bank_account_iban && formData.bank_name && formData.account_holder_name);
      case 3:
        return !!(formData.language_level && formData.digital_signature);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
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

    if (!formData.agrees_to_use_approved_products || !formData.agrees_to_violation_consequences || 
        !formData.agrees_to_submit_reports) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "لطفا تمام توافق‌نامه‌ها را بپذیرید",
      });
      return;
    }

    setSaving(true);
    try {
      await apiService.updateVisitor(formData);
      
      toast({
        title: "موفقیت‌آمیز",
        description: "اطلاعات ویزیتور با موفقیت به‌روزرسانی شد. پس از بررسی مجدد توسط تیم ما، وضعیت شما اعلام خواهد شد.",
        duration: 8000,
      });

      navigate('/visitor-status');
      
    } catch (error: any) {
      console.error('Error updating visitor:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: error?.message || "خطا در به‌روزرسانی اطلاعات ویزیتور. لطفا دوباره تلاش کنید",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            برای ویرایش اطلاعات ویزیتور، ابتدا وارد حساب کاربری خود شوید.
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

  if (!visitorData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            شما هنوز به عنوان ویزیتور ثبت‌نام نکرده‌اید.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">اطلاعات شخصی</h2>
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
          <Label htmlFor="national_id" className="flex items-center gap-2">
            <IdCard className="h-4 w-4" />
            کد ملی *
          </Label>
          <Input
            id="national_id"
            value={formData.national_id}
            onChange={(e) => updateFormData('national_id', e.target.value)}
            placeholder="کد ملی"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="passport_number">شماره پاسپورت</Label>
          <Input
            id="passport_number"
            value={formData.passport_number}
            onChange={(e) => updateFormData('passport_number', e.target.value)}
            placeholder="شماره پاسپورت (اختیاری)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birth_date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            تاریخ تولد *
          </Label>
          <Input
            id="birth_date"
            type="date"
            value={formData.birth_date}
            onChange={(e) => updateFormData('birth_date', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mobile" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            شماره موبایل *
          </Label>
          <Input
            id="mobile"
            type="tel"
            value={formData.mobile}
            onChange={(e) => updateFormData('mobile', e.target.value)}
            placeholder="شماره موبایل"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp_number">شماره واتساپ *</Label>
          <Input
            id="whatsapp_number"
            type="tel"
            value={formData.whatsapp_number}
            onChange={(e) => updateFormData('whatsapp_number', e.target.value)}
            placeholder="+971501234567 (مثال: شماره امارات)"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          ایمیل
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          placeholder="ایمیل (اختیاری)"
        />
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Home className="h-5 w-5" />
          اطلاعات محل سکونت و سفر
        </h3>

        <div className="space-y-2">
          <Label htmlFor="residence_address">آدرس محل سکونت *</Label>
          <Textarea
            id="residence_address"
            value={formData.residence_address}
            onChange={(e) => updateFormData('residence_address', e.target.value)}
            placeholder="آدرس کامل محل سکونت"
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city_province">شهر و کشور محل سکونت *</Label>
            <Input
              id="city_province"
              value={formData.city_province}
              onChange={(e) => updateFormData('city_province', e.target.value)}
              placeholder="مسقط عمان (مثال: شهر کشور)"
              required
            />
            <p className="text-sm text-muted-foreground">
              لطفا شهر و کشور را به فرمت صحیح وارد کنید (مثل: مسقط عمان، دبی امارات)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination_cities" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              شهرهای مقصد برای ویزیت *
            </Label>
            <Textarea
              id="destination_cities"
              value={formData.destination_cities}
              onChange={(e) => updateFormData('destination_cities', e.target.value)}
              placeholder="مسقط عمان، دبی امارات، ریاض عربستان (مثال: شهر کشور، شهر کشور)"
              rows={3}
              required
            />
            <p className="text-sm text-muted-foreground">
              لطفا شهرهای مقصد را به فرمت صحیح وارد کنید (مثل: مسقط عمان، دبی امارات)
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_local_contact"
              checked={formData.has_local_contact}
              onCheckedChange={(checked) => updateFormData('has_local_contact', checked)}
            />
            <Label htmlFor="has_local_contact">آیا تماس محلی در کشور مقصد دارید؟</Label>
          </div>

          {formData.has_local_contact && (
            <div className="space-y-2">
              <Label htmlFor="local_contact_details">جزئیات تماس محلی</Label>
              <Textarea
                id="local_contact_details"
                value={formData.local_contact_details}
                onChange={(e) => updateFormData('local_contact_details', e.target.value)}
                placeholder="نام، شماره تماس و آدرس تماس محلی"
                rows={2}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">اطلاعات بانکی</h2>
        <p className="text-gray-600">اطلاعات حساب بانکی برای دریافت پرداخت‌ها</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          اطلاعات حساب بانکی
        </h3>

        <div className="space-y-2">
          <Label htmlFor="bank_account_iban">شماره شبا *</Label>
          <Input
            id="bank_account_iban"
            value={formData.bank_account_iban}
            onChange={(e) => updateFormData('bank_account_iban', e.target.value)}
            placeholder="IR123456789012345678901234"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bank_name" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              نام بانک *
            </Label>
            <Input
              id="bank_name"
              value={formData.bank_name}
              onChange={(e) => updateFormData('bank_name', e.target.value)}
              placeholder="نام بانک"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_holder_name">نام صاحب حساب</Label>
            <Input
              id="account_holder_name"
              value={formData.account_holder_name}
              onChange={(e) => updateFormData('account_holder_name', e.target.value)}
              placeholder="نام صاحب حساب"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          تجربه کاری و مهارت‌ها
        </h3>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_marketing_experience"
              checked={formData.has_marketing_experience}
              onCheckedChange={(checked) => updateFormData('has_marketing_experience', checked)}
            />
            <Label htmlFor="has_marketing_experience">آیا تجربه بازاریابی دارید؟</Label>
          </div>

          {formData.has_marketing_experience && (
            <div className="space-y-2">
              <Label htmlFor="marketing_experience_desc">توضیح تجربه بازاریابی</Label>
              <Textarea
                id="marketing_experience_desc"
                value={formData.marketing_experience_desc}
                onChange={(e) => updateFormData('marketing_experience_desc', e.target.value)}
                placeholder="تجربه‌های بازاریابی خود را شرح دهید"
                rows={3}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="language_level" className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            سطح زبان انگلیسی *
          </Label>
          <Select
            value={formData.language_level}
            onValueChange={(value) => updateFormData('language_level', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="سطح زبان خود را انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="special_skills">مهارت‌های خاص</Label>
          <Textarea
            id="special_skills"
            value={formData.special_skills}
            onChange={(e) => updateFormData('special_skills', e.target.value)}
            placeholder="مهارت‌های خاص و تخصص‌های خود را بنویسید"
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">تأیید و امضا</h2>
        <p className="text-gray-600">توافق‌نامه‌ها را مطالعه و تأیید کنید</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          توافق‌نامه‌ها
        </h3>

        <div className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="agrees_to_use_approved_products"
              checked={formData.agrees_to_use_approved_products}
              onCheckedChange={(checked) => updateFormData('agrees_to_use_approved_products', checked)}
            />
            <div className="space-y-1">
              <Label htmlFor="agrees_to_use_approved_products" className="text-sm">
                موافقم که فقط از محصولات تأیید شده توسط پلتفرم استفاده کنم
              </Label>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="agrees_to_violation_consequences"
              checked={formData.agrees_to_violation_consequences}
              onCheckedChange={(checked) => updateFormData('agrees_to_violation_consequences', checked)}
            />
            <div className="space-y-1">
              <Label htmlFor="agrees_to_violation_consequences" className="text-sm">
                موافقم که در صورت نقض قوانین، عواقب آن را بپذیرم
              </Label>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="agrees_to_submit_reports"
              checked={formData.agrees_to_submit_reports}
              onCheckedChange={(checked) => updateFormData('agrees_to_submit_reports', checked)}
            />
            <div className="space-y-1">
              <Label htmlFor="agrees_to_submit_reports" className="text-sm">
                موافقم که گزارش‌های مورد نیاز را ارائه دهم
              </Label>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Star className="h-5 w-5" />
          امضای دیجیتال
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="digital_signature">امضای دیجیتال *</Label>
            <Input
              id="digital_signature"
              value={formData.digital_signature}
              onChange={(e) => updateFormData('digital_signature', e.target.value)}
              placeholder="نام کامل خود را به عنوان امضا وارد کنید"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signature_date">تاریخ امضا *</Label>
            <Input
              id="signature_date"
              type="date"
              value={formData.signature_date}
              onChange={(e) => updateFormData('signature_date', e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          با ارسال این فرم، اطلاعات شما برای بررسی مجدد ارسال می‌شود و پس از تأیید، وضعیت جدید شما اعلام خواهد شد.
        </AlertDescription>
      </Alert>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderAuth />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/visitor-status')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              بازگشت به وضعیت ویزیتور
            </Button>
            
            <h1 className="text-3xl font-bold text-gray-900">ویرایش اطلاعات ویزیتور</h1>
            <p className="text-gray-600 mt-2">
              اطلاعات ویزیتور خود را به‌روزرسانی کنید
            </p>
            
            {/* Important Notice Alert */}
            <Alert className="mt-4 border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong className="block mb-2">⚠️ توجه مهم - شرایط ویزیتور:</strong>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>مکان سکونت:</strong> ویزیتورها باید ساکن کشورهای عربی باشند، نه ایران</li>
                  <li><strong>شهرهای مقصد:</strong> باید خارج از ایران باشد (مثل: دبی امارات، مسقط عمان)</li>
                  <li><strong>فرمت آدرس:</strong> حتماً "شهر کشور" بنویسید (مثال: مسقط عمان، ریاض عربستان)</li>
                  <li><strong>شماره واتساپ:</strong> برای ارتباط الزامی است (مثال: +971501234567)</li>
                  <li><strong>شهرهای ایرانی ممنوع:</strong> تهران، مشهد، اصفهان، شیراز و... قابل قبول نیست</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>مرحله {currentStep} از 3</CardTitle>
                <div className="flex space-x-2">
                  {[1, 2, 3].map((step) => (
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
              {currentStep === 3 && renderStep3()}

              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  قبلی
                </Button>

                {currentStep < 3 ? (
                  <Button onClick={nextStep}>
                    بعدی
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={saving}
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
