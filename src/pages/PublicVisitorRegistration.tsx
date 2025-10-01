import { useState, useMemo } from "react";
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
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  Star,
  Globe,
  FileText,
  Briefcase,
  Languages,
  Award,
  Home,
  Plane,
  CreditCard,
  Clock
} from "lucide-react";

const PublicVisitorRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Identification Information
    full_name: "",
    national_id: "",
    passport_number: "",
    birth_date: "",
    mobile: "",
    whatsapp_number: "",
    email: "",

    // Residence and Travel Information
    residence_address: "",
    city_province: "",
    destination_cities: "",
    has_local_contact: false,
    local_contact_details: "",

    // Banking and Payment Information
    bank_account_iban: "",
    bank_name: "",
    account_holder_name: "",

    // Work Experience and Skills
    has_marketing_experience: false,
    marketing_experience_desc: "",
    language_level: "",
    special_skills: "",

    // Commitments and Agreements
    agrees_to_use_approved_products: false,
    agrees_to_violation_consequences: false,
    agrees_to_submit_reports: false,
    digital_signature: "",
    signature_date: ""
  });

  const countries = [
    { code: "AE", name: "امارات متحده عربی", cities: ["دبی", "ابوظبی", "شارجه", "عجمان"] },
    { code: "SA", name: "عربستان سعودی", cities: ["ریاض", "جده", "دمام", "مکه"] },
    { code: "KW", name: "کویت", cities: ["کویت سیتی", "الاحمدی", "حولی"] },
    { code: "QA", name: "قطر", cities: ["دوحه", "الریان", "الوکره"] },
    { code: "BH", name: "بحرین", cities: ["منامه", "المحرق", "مدینه حمد"] },
    { code: "OM", name: "عمان", cities: ["مسقط", "صلاله", "نزوا"] }
  ];

  const languageLevels = [
    { id: "excellent", name: "عالی" },
    { id: "good", name: "خوب" },
    { id: "weak", name: "ضعیف" },
    { id: "none", name: "بلد نیستم" }
  ];

  const banks = [
    "بانک ملی ایران", "بانک سپه", "بانک کشاورزی", "بانک مسکن", "بانک صادرات",
    "بانک تجارت", "بانک ملت", "بانک رفاه", "بانک پست بانک", "بانک دی",
    "بانک سینا", "بانک پارسیان", "بانک اقتصاد نوین", "بانک پاسارگاد", "بانک کارآفرین"
  ];

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/v1/public/visitor/register', {
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
    if (currentStep < 5) {
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
      {[1, 2, 3, 4, 5].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all duration-300 ${
            step <= currentStep 
              ? "bg-blue-500 text-white shadow-lg" 
              : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
          }`}>
            {step}
          </div>
          {step < 5 && (
            <div className={`w-6 sm:w-12 h-0.5 mx-1 sm:mx-2 transition-all duration-300 ${
              step < currentStep ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-600"
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const Step1 = useMemo(() => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Users className="w-16 h-16 mx-auto text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-foreground">اطلاعات شخصی</h2>
        <p className="text-muted-foreground">لطفاً اطلاعات شخصی و هویتی خود را وارد کنید</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="full_name">نام و نام خانوادگی *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => updateFormData('full_name', e.target.value)}
            placeholder="نام و نام خانوادگی خود را وارد کنید"
            required
            className="text-right"
            dir="rtl"
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="national_id">کد ملی *</Label>
          <Input
            id="national_id"
            value={formData.national_id}
            onChange={(e) => updateFormData('national_id', e.target.value)}
            placeholder="1234567890"
            required
            className="text-right"
            dir="ltr"
            maxLength={10}
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="passport_number">شماره پاسپورت</Label>
          <Input
            id="passport_number"
            value={formData.passport_number}
            onChange={(e) => updateFormData('passport_number', e.target.value)}
            placeholder="شماره پاسپورت خود را وارد کنید"
            className="text-right"
            dir="ltr"
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birth_date">تاریخ تولد *</Label>
          <Input
            id="birth_date"
            type="date"
            value={formData.birth_date}
            onChange={(e) => updateFormData('birth_date', e.target.value)}
            required
            className="text-right"
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobile">شماره موبایل *</Label>
          <Input
            id="mobile"
            value={formData.mobile}
            onChange={(e) => updateFormData('mobile', e.target.value)}
            placeholder="09123456789"
            required
            className="text-right"
            dir="ltr"
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp_number">شماره واتساپ</Label>
          <Input
            id="whatsapp_number"
            value={formData.whatsapp_number}
            onChange={(e) => updateFormData('whatsapp_number', e.target.value)}
            placeholder="09123456789"
            className="text-right"
            dir="ltr"
            autoComplete="off"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="email">ایمیل</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            placeholder="example@email.com"
            className="text-right"
            dir="ltr"
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  ), [formData.full_name, formData.national_id, formData.passport_number, formData.birth_date, formData.mobile, formData.whatsapp_number, formData.email]);

  const Step2 = useMemo(() => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <MapPin className="w-16 h-16 mx-auto text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-foreground">اطلاعات محل سکونت و سفر</h2>
        <p className="text-muted-foreground">اطلاعات مربوط به محل سکونت و شهرهای مقصد</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="residence_address">آدرس محل سکونت *</Label>
          <Textarea
            id="residence_address"
            value={formData.residence_address}
            onChange={(e) => updateFormData('residence_address', e.target.value)}
            placeholder="آدرس کامل محل سکونت خود را وارد کنید"
            required
            className="text-right"
            dir="rtl"
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
            required
            className="text-right"
            dir="rtl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="destination_cities">شهرهای مقصد *</Label>
          <Textarea
            id="destination_cities"
            value={formData.destination_cities}
            onChange={(e) => updateFormData('destination_cities', e.target.value)}
            placeholder="شهرهایی که قصد سفر به آن‌ها را دارید (مثال: دبی، ابوظبی، ریاض)"
            required
            className="text-right"
            dir="rtl"
            rows={2}
          />
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <Checkbox
            id="has_local_contact"
            checked={formData.has_local_contact}
            onCheckedChange={(checked) => updateFormData('has_local_contact', checked)}
          />
          <Label htmlFor="has_local_contact">آشنای محلی در کشورهای مقصد دارم</Label>
        </div>

        {formData.has_local_contact && (
          <div className="space-y-2">
            <Label htmlFor="local_contact_details">جزئیات آشنای محلی</Label>
            <Textarea
              id="local_contact_details"
              value={formData.local_contact_details}
              onChange={(e) => updateFormData('local_contact_details', e.target.value)}
              placeholder="اطلاعات مربوط به آشنایان محلی خود را وارد کنید"
              className="text-right"
              dir="rtl"
              rows={2}
            />
          </div>
        )}
      </div>
    </div>
  ), [formData.residence_address, formData.city_province, formData.destination_cities, formData.has_local_contact, formData.local_contact_details]);

  const Step3 = useMemo(() => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CreditCard className="w-16 h-16 mx-auto text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-foreground">اطلاعات بانکی</h2>
        <p className="text-muted-foreground">اطلاعات حساب بانکی برای دریافت پرداخت‌ها</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="bank_account_iban">شماره شبا *</Label>
          <Input
            id="bank_account_iban"
            value={formData.bank_account_iban}
            onChange={(e) => updateFormData('bank_account_iban', e.target.value)}
            placeholder="IR123456789012345678901234"
            required
            className="text-right"
            dir="ltr"
            maxLength={26}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank_name">نام بانک *</Label>
          <Select value={formData.bank_name} onValueChange={(value) => updateFormData('bank_name', value)}>
            <SelectTrigger className="text-right">
              <SelectValue placeholder="نام بانک خود را انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              {banks.map((bank) => (
                <SelectItem key={bank} value={bank} className="text-right">
                  {bank}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="account_holder_name">نام صاحب حساب</Label>
          <Input
            id="account_holder_name"
            value={formData.account_holder_name}
            onChange={(e) => updateFormData('account_holder_name', e.target.value)}
            placeholder="نام صاحب حساب (در صورت متفاوت بودن با نام شما)"
            className="text-right"
            dir="rtl"
          />
        </div>
      </div>
    </div>
  ), [formData.bank_account_iban, formData.bank_name, formData.account_holder_name]);

  const Step4 = useMemo(() => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Briefcase className="w-16 h-16 mx-auto text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-foreground">تجربه و مهارت‌ها</h2>
        <p className="text-muted-foreground">اطلاعات مربوط به تجربه کاری و مهارت‌های شما</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Checkbox
            id="has_marketing_experience"
            checked={formData.has_marketing_experience}
            onCheckedChange={(checked) => updateFormData('has_marketing_experience', checked)}
          />
          <Label htmlFor="has_marketing_experience">تجربه بازاریابی دارم</Label>
        </div>

        {formData.has_marketing_experience && (
          <div className="space-y-2">
            <Label htmlFor="marketing_experience_desc">توضیحات تجربه بازاریابی</Label>
            <Textarea
              id="marketing_experience_desc"
              value={formData.marketing_experience_desc}
              onChange={(e) => updateFormData('marketing_experience_desc', e.target.value)}
              placeholder="تجربه بازاریابی خود را شرح دهید"
              className="text-right"
              dir="rtl"
              rows={3}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="language_level">سطح زبان عربی *</Label>
          <Select value={formData.language_level} onValueChange={(value) => updateFormData('language_level', value)}>
            <SelectTrigger className="text-right">
              <SelectValue placeholder="سطح زبان عربی خود را انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              {languageLevels.map((level) => (
                <SelectItem key={level.id} value={level.id} className="text-right">
                  {level.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="special_skills">مهارت‌های ویژه</Label>
          <Textarea
            id="special_skills"
            value={formData.special_skills}
            onChange={(e) => updateFormData('special_skills', e.target.value)}
            placeholder="مهارت‌های ویژه خود را وارد کنید (مثال: فروش، مشاوره، ترجمه)"
            className="text-right"
            dir="rtl"
            rows={3}
          />
        </div>
      </div>
    </div>
  ), [formData.has_marketing_experience, formData.marketing_experience_desc, formData.language_level, formData.special_skills]);

  const Step5 = useMemo(() => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <FileText className="w-16 h-16 mx-auto text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-foreground">تعهدات و توافق‌نامه</h2>
        <p className="text-muted-foreground">لطفاً شرایط و تعهدات را مطالعه و تأیید کنید</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start space-x-2 space-x-reverse">
            <Checkbox
              id="agrees_to_use_approved_products"
              checked={formData.agrees_to_use_approved_products}
              onCheckedChange={(checked) => updateFormData('agrees_to_use_approved_products', checked)}
              className="mt-1"
            />
            <Label htmlFor="agrees_to_use_approved_products" className="text-sm">
              متعهد می‌شوم که فقط از محصولات تأیید شده توسط اصل مارکت استفاده کنم و هیچ محصول غیرمجاز یا تقلبی را ارائه ندهم.
            </Label>
          </div>

          <div className="flex items-start space-x-2 space-x-reverse">
            <Checkbox
              id="agrees_to_violation_consequences"
              checked={formData.agrees_to_violation_consequences}
              onCheckedChange={(checked) => updateFormData('agrees_to_violation_consequences', checked)}
              className="mt-1"
            />
            <Label htmlFor="agrees_to_violation_consequences" className="text-sm">
              متعهد می‌شوم که در صورت نقض قوانین و مقررات، عواقب آن را بپذیرم و مسئولیت کامل آن را بر عهده بگیرم.
            </Label>
          </div>

          <div className="flex items-start space-x-2 space-x-reverse">
            <Checkbox
              id="agrees_to_submit_reports"
              checked={formData.agrees_to_submit_reports}
              onCheckedChange={(checked) => updateFormData('agrees_to_submit_reports', checked)}
              className="mt-1"
            />
            <Label htmlFor="agrees_to_submit_reports" className="text-sm">
              متعهد می‌شوم که گزارش‌های منظم از فعالیت‌های خود ارائه دهم و با تیم اصل مارکت همکاری کنم.
            </Label>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="digital_signature">امضای دیجیتال *</Label>
            <Input
              id="digital_signature"
              value={formData.digital_signature}
              onChange={(e) => updateFormData('digital_signature', e.target.value)}
              placeholder="نام و نام خانوادگی خود را به عنوان امضا وارد کنید"
              required
              className="text-right"
              dir="rtl"
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
              className="text-right"
            />
          </div>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            با تأیید این فرم، شما تمام شرایط و مقررات اصل مارکت را پذیرفته و متعهد به رعایت آن‌ها می‌شوید.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  ), [formData.agrees_to_use_approved_products, formData.agrees_to_violation_consequences, formData.agrees_to_submit_reports, formData.digital_signature, formData.signature_date]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <HeaderAuth />
      <div className="container mx-auto px-2 sm:px-4 max-w-4xl py-4 sm:py-8">
        <StepIndicator />
        <Card className="shadow-2xl">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-3">
              <Users className="w-6 h-6 sm:w-8 sm:h-8" />
              ثبت‌نام ویزیتور
            </CardTitle>
            <p className="text-blue-100 mt-2 text-sm sm:text-base">
              در شبکه ویزیتورهای اصل مارکت عضو شوید
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-8">
            <form onSubmit={handleSubmit}>
              {currentStep === 1 && Step1}
              {currentStep === 2 && Step2}
              {currentStep === 3 && Step3}
              {currentStep === 4 && Step4}
              {currentStep === 5 && Step5}

              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  قبلی
                </Button>

                {currentStep < 5 ? (
                  <Button type="button" onClick={nextStep}>
                    بعدی
                    <ArrowRight className="w-4 h-4 mr-2" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={loading || !formData.agrees_to_use_approved_products || !formData.agrees_to_violation_consequences || !formData.agrees_to_submit_reports}
                  >
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
                onClick={() => window.location.href = `/public/registration-status?mobile=${formData.mobile}&type=visitor`} 
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

export default PublicVisitorRegistration;
