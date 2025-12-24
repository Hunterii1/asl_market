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
  Star
} from 'lucide-react';
import { apiService } from '@/services/api';
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
  
  // Interested Products
  interested_products: string;
  
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

export default function VisitorRegistration() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

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
    interested_products: '',
    agrees_to_use_approved_products: false,
    agrees_to_violation_consequences: false,
    agrees_to_submit_reports: false,
    digital_signature: '',
    signature_date: new Date().toISOString().split('T')[0],
  });

  const updateFormData = (field: keyof VisitorFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // List of countries with cities for dropdown selection
  const countries = [
    { code: "AE", name: "امارات متحده عربی", cities: ["دبی", "ابوظبی", "شارجه", "عجمان", "راس الخیمه", "فجیره", "ام القوین"] },
    { code: "SA", name: "عربستان سعودی", cities: ["ریاض", "جده", "دمام", "مکه", "مدینه", "طائف", "خبر", "ابها"] },
    { code: "KW", name: "کویت", cities: ["کویت سیتی", "الاحمدی", "حولی", "الفروانیه", "الجهراء"] },
    { code: "QA", name: "قطر", cities: ["دوحه", "الریان", "الوکره", "الخور", "دخان"] },
    { code: "BH", name: "بحرین", cities: ["منامه", "المحرق", "مدینه حمد", "ستره", "رفاع"] },
    { code: "OM", name: "عمان", cities: ["مسقط", "صلاله", "نزوا", "صور", "صحار", "البريمي"] },
    { code: "YE", name: "یمن", cities: ["صنعا", "عدن", "تعز", "حدیده"] },
    { code: "JO", name: "اردن", cities: ["عمان", "زرقا", "اربد", "عقبه"] },
    { code: "LB", name: "لبنان", cities: ["بیروت", "طرابلس", "صیدا", "صور"] },
    { code: "IQ", name: "عراق", cities: ["بغداد", "بصره", "موصل", "کربلا", "نجف"] },
    { code: "EG", name: "مصر", cities: ["قاهره", "اسکندریه", "جیزه", "شرم الشیخ"] }
  ];

  // List of Arabic countries (only these are allowed) - expanded and flexible
  const arabicCountries = [
    "عمان", "امارات", "امارات متحده عربی", "امارات متحده", "دبی", "ابوظبی", "شارجه", "عجمان",
    "عربستان", "عربستان سعودی", "سعودی", "ریاض", "جده", "دمام", "مکه",
    "کویت", "کویت سیتی", "الاحمدی", "حولی",
    "قطر", "دوحه", "الریان", "الوکره",
    "بحرین", "منامه", "المحرق", "مدینه حمد",
    "یمن", "اردن", "سوریه", "لبنان", 
    "عراق", "فلسطین", "مصر", "لیبی", "تونس", "الجزایر", "مراکش", "سودان"
  ];

  // List of Iranian cities and terms to validate against (not allowed)
  const iranianTerms = [
    "تهران", "مشهد", "اصفهان", "شیراز", "تبریز", "کرج", "اهواز", "قم", 
    "کرمانشاه", "ارومیه", "یزد", "زاهدان", "رشت", "کرمان", "همدان", 
    "اردبیل", "بندرعباس", "اسلامشهر", "زنجان", "سنندج", "یاسوج", 
    "بوشهر", "بیرجند", "شهرکرد", "گرگان", "ساری", "اراک", "بابل", 
    "قزوین", "خرمآباد", "سمنان", "کاشان", "گلستان", "سیستان", 
    "بلوچستان", "کهگیلویه", "بویراحمد", "ایران", "جمهوری اسلامی", 
    "ایرانی", "تهرانی", "مشهدی", "اصفهانی"
  ];

  // Check if location contains Iranian terms (not allowed)
  const isIranianLocation = (location: string) => {
    const locationLower = location.toLowerCase();
    return iranianTerms.some(term => 
      locationLower.includes(term.toLowerCase())
    );
  };

  // Check if location contains only Arabic countries (allowed)
  const isArabicCountry = (location: string) => {
    const locationLower = location.toLowerCase();
    return arabicCountries.some(country => 
      locationLower.includes(country.toLowerCase())
    );
  };

  // Validate that location is Arabic and not Iranian - SIMPLIFIED and FLEXIBLE
  const validateArabicLocation = (location: string, fieldName: string): boolean => {
    const locationLower = location.toLowerCase().trim();
    
    // Empty check
    if (!locationLower) {
      toast({
        title: "اطلاعات ناقص",
        description: `لطفا ${fieldName} را وارد کنید`,
        variant: "destructive",
      });
      return false;
    }
    
    // Check if Iranian (strict - reject immediately)
    if (isIranianLocation(location)) {
      toast({
        title: "مکان نامعتبر",
        description: `${fieldName} نمی‌تواند شامل شهرها یا کشورهای ایرانی باشد. ویزیتورها باید فقط از کشورهای عربی باشند.`,
        variant: "destructive",
      });
      return false;
    }
    
    // FLEXIBLE CHECK: Check if contains ANY Arabic country or city
    // This allows formats like: "دبی امارات", "مسقط عمان", "ریاض", "دبی", etc.
    const containsArabic = arabicCountries.some(country => 
      locationLower.includes(country.toLowerCase())
    );
    
    if (!containsArabic) {
      toast({
        title: "مکان نامعتبر",
        description: `${fieldName} باید شامل نام یک کشور یا شهر عربی باشد.\n\nمثال‌های صحیح:\n• دبی امارات\n• مسقط عمان\n• ریاض عربستان\n• دوحه قطر`,
        variant: "destructive",
        duration: 6000,
      });
      return false;
    }
    
    return true;
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.full_name && formData.national_id && formData.birth_date && formData.mobile);
      case 2:
        // Validate city/province location (flexible format - any separator)
        if (!formData.residence_address || !formData.city_province || !formData.destination_cities) {
          return false;
        }
        
        // STRICT VALIDATION: Only Arabic countries allowed, NO Iranian locations
        // Flexible format: accepts any separator (space, comma, dash, etc.)
        if (!validateArabicLocation(formData.city_province, "شهر و کشور محل سکونت")) {
          return false;
        }
        
        // Validate destination cities (split by comma, dash, space, or any separator)
        // More flexible splitting - handle both Persian and English commas
        const destinations = formData.destination_cities
          .split(/[،,\-\s\n]+/)
          .map(d => d.trim())
          .filter(d => d.length > 0);
        
        if (destinations.length === 0) {
          toast({
            title: "اطلاعات ناقص",
            description: "لطفا حداقل یک شهر مقصد وارد کنید",
            variant: "destructive",
          });
          return false;
        }
        
        for (const dest of destinations) {
          if (!validateArabicLocation(dest, "شهرهای مقصد")) {
            return false;
          }
        }
        
        return true;
      case 3:
        return !!(formData.bank_account_iban && formData.bank_name);
      case 4:
        // Validate WhatsApp number is required
        if (!formData.whatsapp_number) {
          toast({
            title: "شماره واتساپ الزامی",
            description: "شماره واتساپ برای ارتباط الزامی است",
            variant: "destructive",
          });
          return false;
        }
        return !!(formData.language_level);
      case 5:
        return !!(formData.agrees_to_use_approved_products && 
                 formData.agrees_to_violation_consequences && 
                 formData.agrees_to_submit_reports && 
                 formData.digital_signature);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } else {
      toast({
        title: "اطلاعات ناقص",
        description: "لطفا تمام فیلدهای الزامی را پر کنید",
        variant: "destructive",
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      toast({
        title: "اطلاعات ناقص",
        description: "لطفا تمام فیلدهای الزامی را پر کنید",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await apiService.registerVisitor(formData);
      
      toast({
        title: "ثبت‌نام موفق",
        description: "درخواست ثبت‌نام ویزیتور شما با موفقیت ارسال شد. پس از بررسی توسط تیم ما با شما تماس گرفته خواهد شد.",
      });
      
      navigate('/visitor-status');
    } catch (error: any) {
      toast({
        title: "خطا در ثبت‌نام",
        description: error.response?.data?.error || "خطا در ارسال اطلاعات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">اطلاعات شناسایی فردی</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">نام و نام خانوادگی کامل *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => updateFormData('full_name', e.target.value)}
                  placeholder="نام و نام خانوادگی خود را وارد کنید"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="national_id">شماره ملی (کد ملی) *</Label>
                <Input
                  id="national_id"
                  value={formData.national_id}
                  onChange={(e) => updateFormData('national_id', e.target.value)}
                  placeholder="کد ملی 10 رقمی"
                  maxLength={10}
                />
              </div>
              
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
                <Label htmlFor="birth_date">تاریخ تولد *</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => updateFormData('birth_date', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mobile">شماره موبایل (با پیش‌شماره) *</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => updateFormData('mobile', e.target.value)}
                  placeholder="+98901234567"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="whatsapp_number">شماره واتساپ *</Label>
                <Input
                  id="whatsapp_number"
                  value={formData.whatsapp_number}
                  onChange={(e) => updateFormData('whatsapp_number', e.target.value)}
                  placeholder="+971501234567 (مثال: شماره امارات)"
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">ایمیل (اختیاری)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="example@email.com (اختیاری)"
                />
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">اطلاعات محل سکونت و سفر</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="residence_address">آدرس محل سکونت *</Label>
                <Textarea
                  id="residence_address"
                  value={formData.residence_address}
                  onChange={(e) => updateFormData('residence_address', e.target.value)}
                  placeholder="آدرس کامل محل سکونت"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city_province">شهر و کشور محل سکونت *</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.city_province}
                    onValueChange={(value) => updateFormData('city_province', value)}
                  >
                    <SelectTrigger className="flex-1 text-right" dir="rtl">
                      <SelectValue placeholder="انتخاب شهر و کشور" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]" dir="rtl">
                      {countries.map((country) => (
                        <div key={country.code}>
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted">
                            {country.name}
                          </div>
                          {country.cities.map((city) => {
                            const fullValue = `${city} ${country.name}`;
                            return (
                              <SelectItem key={fullValue} value={fullValue} className="text-right">
                                {fullValue}
                              </SelectItem>
                            );
                          })}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="city_province_manual"
                    value={formData.city_province}
                    onChange={(e) => updateFormData('city_province', e.target.value)}
                    placeholder="یا تایپ کنید..."
                    className="flex-1 text-right"
                    dir="rtl"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  می‌توانید از لیست انتخاب کنید یا به صورت دستی تایپ کنید (مثال: دبی امارات)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="destination_cities">شهرهای مقصد برای ویزیت *</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Select
                      onValueChange={(value) => {
                        const current = formData.destination_cities;
                        const newValue = current 
                          ? `${current}, ${value}` 
                          : value;
                        updateFormData('destination_cities', newValue);
                      }}
                    >
                      <SelectTrigger className="flex-1 text-right" dir="rtl">
                        <SelectValue placeholder="افزودن شهر از لیست" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]" dir="rtl">
                        {countries.map((country) => (
                          <div key={country.code}>
                            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted">
                              {country.name}
                            </div>
                            {country.cities.map((city) => {
                              const fullValue = `${city} ${country.name}`;
                              return (
                                <SelectItem key={fullValue} value={fullValue} className="text-right">
                                  {fullValue}
                                </SelectItem>
                              );
                            })}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => updateFormData('destination_cities', '')}
                      className="shrink-0"
                    >
                      پاک کردن
                    </Button>
                  </div>
                  <Textarea
                    id="destination_cities"
                    value={formData.destination_cities}
                    onChange={(e) => updateFormData('destination_cities', e.target.value)}
                    placeholder="شهرهای انتخاب شده یا تایپ کنید (مثال: دبی امارات، مسقط عمان)"
                    rows={3}
                    className="text-right"
                    dir="rtl"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  می‌توانید از لیست انتخاب کنید یا به صورت دستی تایپ کنید. شهرها را با کاما جدا کنید
                </p>
              </div>
              
              <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_local_contact"
                    checked={formData.has_local_contact}
                    onCheckedChange={(checked) => updateFormData('has_local_contact', checked)}
                  />
                  <Label htmlFor="has_local_contact">
                    آیا در کشور مقصد آشنایی/اقامت/آشنای محلی دارید؟
                  </Label>
              </div>
              
                {formData.has_local_contact && (
                  <div className="space-y-2">
                    <Label htmlFor="local_contact_details">توضیح دهید</Label>
                  <Textarea
                      id="local_contact_details"
                      value={formData.local_contact_details}
                      onChange={(e) => updateFormData('local_contact_details', e.target.value)}
                      placeholder="توضیح کامل درباره آشنایان/اقامت در کشور مقصد"
                    rows={3}
                  />
                </div>
              )}
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">اطلاعات بانکی و پرداختی</h3>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                این اطلاعات برای تسویه حساب‌ها و پرداخت کمیسیون‌های شما استفاده می‌شود.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bank_account_iban">شماره حساب بین‌المللی یا شماره شبا *</Label>
                <Input
                  id="bank_account_iban"
                  value={formData.bank_account_iban}
                  onChange={(e) => updateFormData('bank_account_iban', e.target.value)}
                  placeholder="IR123456789012345678901234"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bank_name">نام بانک *</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => updateFormData('bank_name', e.target.value)}
                  placeholder="نام بانک"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="account_holder_name">نام صاحب حساب (در صورت متفاوت بودن)</Label>
                <Input
                  id="account_holder_name"
                  value={formData.account_holder_name}
                  onChange={(e) => updateFormData('account_holder_name', e.target.value)}
                  placeholder="نام صاحب حساب"
                />
              </div>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">سوابق کاری و توانمندی‌ها</h3>
            </div>
            
            <div className="space-y-6">
            <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_marketing_experience"
                    checked={formData.has_marketing_experience}
                    onCheckedChange={(checked) => updateFormData('has_marketing_experience', checked)}
                  />
                  <Label htmlFor="has_marketing_experience">
                    آیا تجربه بازاریابی یا فروش دارید؟
                  </Label>
              </div>
              
              {formData.has_marketing_experience && (
                  <div className="space-y-2">
                    <Label htmlFor="marketing_experience_desc">توضیح دهید</Label>
                  <Textarea
                      id="marketing_experience_desc"
                      value={formData.marketing_experience_desc}
                      onChange={(e) => updateFormData('marketing_experience_desc', e.target.value)}
                      placeholder="توضیح کامل تجربیات بازاریابی و فروش"
                      rows={4}
                  />
                </div>
              )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="language_level">سطح زبان عربی یا انگلیسی *</Label>
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
                <Label htmlFor="special_skills">مهارت‌های خاص دیگر</Label>
                <Textarea
                  id="special_skills"
                  value={formData.special_skills}
                  onChange={(e) => updateFormData('special_skills', e.target.value)}
                  placeholder="ارتباطات، عکاسی، شبکه‌سازی و سایر مهارت‌ها"
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interested_products">
                  <Star className="inline w-4 h-4 ml-1" />
                  محصولات مورد علاقه یا مدنظر
                </Label>
                <Textarea
                  id="interested_products"
                  value={formData.interested_products}
                  onChange={(e) => updateFormData('interested_products', e.target.value)}
                  placeholder="محصولاتی که علاقه دارید یا می‌خواهید در آن‌ها فعالیت کنید (مثال: زعفران، خرما، پسته، فرش، صنایع دستی و...)"
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  محصولاتی که می‌خواهید در آن‌ها فعالیت کنید را وارد کنید. این اطلاعات به تأمین‌کنندگان کمک می‌کند تا با شما ارتباط برقرار کنند.
                </p>
              </div>
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">تعهدات و قوانین همکاری</h3>
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                لطفا تمام موارد زیر را با دقت مطالعه کرده و تایید نمایید.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                  id="agrees_to_use_approved_products"
                  checked={formData.agrees_to_use_approved_products}
                  onCheckedChange={(checked) => updateFormData('agrees_to_use_approved_products', checked)}
                />
                <Label htmlFor="agrees_to_use_approved_products" className="leading-relaxed">
                  آیا متعهد می‌شوید صرفاً از محصولات و اطلاعات تاییدشده توسط ASL MARKET استفاده کنید؟
                  </Label>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox
                  id="agrees_to_violation_consequences"
                  checked={formData.agrees_to_violation_consequences}
                  onCheckedChange={(checked) => updateFormData('agrees_to_violation_consequences', checked)}
                />
                <Label htmlFor="agrees_to_violation_consequences" className="leading-relaxed">
                  آیا می‌پذیرید که هرگونه تخلف (کپی، فروش شخصی، ارتباط مستقیم با مشتری بدون اطلاع ما) موجب قطع همکاری و پیگیری قانونی و اقدام به درخواست ضرر و‌ زیان خواهد شد؟
                  </Label>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox
                  id="agrees_to_submit_reports"
                  checked={formData.agrees_to_submit_reports}
                  onCheckedChange={(checked) => updateFormData('agrees_to_submit_reports', checked)}
                />
                <Label htmlFor="agrees_to_submit_reports" className="leading-relaxed">
                  آیا می‌پذیرید گزارش‌ روزانه یا هفتگی از اقدامات خود ارسال نمایید؟
                  </Label>
                </div>
              </div>
              
              <Separator />
            
            <div className="space-y-4">
              <h4 className="font-semibold">امضا و تایید متقاضی</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="digital_signature">امضا دیجیتال (نام کامل) *</Label>
                  <Input
                    id="digital_signature"
                    value={formData.digital_signature}
                    onChange={(e) => updateFormData('digital_signature', e.target.value)}
                    placeholder="نام کامل شما به عنوان امضا"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signature_date">تاریخ *</Label>
                    <Input
                      id="signature_date"
                      type="date"
                      value={formData.signature_date}
                    onChange={(e) => updateFormData('signature_date', e.target.value)}
                    />
                </div>
                </div>
              </div>
              
              <Alert>
              <Info className="h-4 w-4" />
                <AlertDescription>
                <strong>مدارک لازم برای ثبت‌نام:</strong><br />
                • عکس کارت ملی یا گذرنامه<br />
                • عکس پرسنلی<br />
                  • معرفی‌نامه یا رزومه (اختیاری ولی امتیاز مثبت دارد)
                </AlertDescription>
              </Alert>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <HeaderAuth />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
          <CardTitle className="text-center text-2xl">ثبت‌نام ویزیتور</CardTitle>
          <p className="text-center text-muted-foreground">
            لطفاً تمام بخش‌ها را با دقت و صداقت پر کنید. اطلاعات شما صرفاً برای اهداف کاری و قانونی در چارچوب پلتفرم ASL MARKET استفاده می‌شود.
          </p>
          
          {/* Important Notice Alert */}
          <Alert className="mt-4 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong className="block mb-2">⚠️ توجه مهم - شرایط ثبت‌نام ویزیتور:</strong>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>مکان سکونت:</strong> ویزیتورها باید ساکن کشورهای عربی باشند، نه ایران</li>
                <li><strong>شهرهای مقصد:</strong> باید خارج از ایران باشد (مثل: دبی امارات، مسقط عمان)</li>
                <li><strong>فرمت آدرس:</strong> حتماً "شهر کشور" بنویسید (مثال: مسقط عمان، ریاض عربستان)</li>
                <li><strong>شماره واتساپ:</strong> برای ارتباط الزامی است (مثال: +971501234567)</li>
                <li><strong>شهرهای ایرانی ممنوع:</strong> تهران، مشهد، اصفهان، شیراز و... قابل قبول نیست</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardHeader>
        
        <CardContent>
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                    i + 1 <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i + 1}
              </div>
              ))}
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(currentStep / 5) * 100}%` }}
                />
              </div>
            </div>
          
          {renderStepContent()}
            
          {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
              مرحله قبل
              </Button>
              
            {currentStep < 5 ? (
                  <Button onClick={nextStep}>
                مرحله بعد
                  </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    در حال ارسال...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    ثبت نهایی
                  </>
                )}
              </Button>
            )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}