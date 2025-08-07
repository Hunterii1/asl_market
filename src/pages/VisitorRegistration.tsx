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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.full_name && formData.national_id && formData.birth_date && formData.mobile);
      case 2:
        return !!(formData.residence_address && formData.city_province && formData.destination_cities);
      case 3:
        return !!(formData.bank_account_iban && formData.bank_name);
      case 4:
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
                <Label htmlFor="whatsapp_number">شماره واتساپ</Label>
                <Input
                  id="whatsapp_number"
                  value={formData.whatsapp_number}
                  onChange={(e) => updateFormData('whatsapp_number', e.target.value)}
                  placeholder="+98901234567"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">ایمیل</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="example@email.com"
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
                <Label htmlFor="city_province">شهر/استان *</Label>
                <Input
                  id="city_province"
                  value={formData.city_province}
                  onChange={(e) => updateFormData('city_province', e.target.value)}
                  placeholder="شهر و استان محل سکونت"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="destination_cities">شهر یا شهرهای مقصد برای ویزیت *</Label>
                <Textarea
                  id="destination_cities"
                  value={formData.destination_cities}
                  onChange={(e) => updateFormData('destination_cities', e.target.value)}
                  placeholder="شهرهای مقصد برای ویزیت و بازاریابی"
                  rows={3}
                />
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