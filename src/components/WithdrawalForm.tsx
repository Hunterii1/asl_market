import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { errorHandler } from "@/utils/errorHandler";
import { 
  CreditCard, 
  DollarSign, 
  Plus,
  Shield,
  Loader2
} from "lucide-react";

interface WithdrawalFormProps {
  onSuccess: () => void;
}

const countries = [
  { code: "AE", name: "امارات متحده عربی", flag: "🇦🇪", currency: "AED" },
  { code: "SA", name: "عربستان سعودی", flag: "🇸🇦", currency: "SAR" },
  { code: "KW", name: "کویت", flag: "🇰🇼", currency: "KWD" },
  { code: "QA", name: "قطر", flag: "🇶🇦", currency: "QAR" },
  { code: "BH", name: "بحرین", flag: "🇧🇭", currency: "BHD" },
  { code: "OM", name: "عمان", flag: "🇴🇲", currency: "OMR" }
];

export const WithdrawalForm: React.FC<WithdrawalFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: "",
    sourceCountry: "",
    currency: "",
    bankCardNumber: "",
    cardHolderName: "",
    shebaNumber: "",
    bankName: ""
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSelectChange = (field: string) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    const { amount, sourceCountry, currency, bankCardNumber, cardHolderName, shebaNumber, bankName } = formData;
    
    if (!amount || !sourceCountry || !currency || !bankCardNumber || !cardHolderName || !shebaNumber || !bankName) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "لطفا تمام فیلدها را پر کنید",
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await apiService.createWithdrawalRequest({
        amount: parseFloat(amount),
        currency,
        source_country: sourceCountry,
        bank_card_number: bankCardNumber,
        card_holder_name: cardHolderName,
        sheba_number: shebaNumber,
        bank_name: bankName,
      });

      toast({
        title: "موفقیت",
        description: response.message || "درخواست برداشت با موفقیت ثبت شد",
      });
      
      // Reset form
      setFormData({
        amount: "",
        sourceCountry: "",
        currency: "",
        bankCardNumber: "",
        cardHolderName: "",
        shebaNumber: "",
        bankName: ""
      });
      
      onSuccess();
    } catch (error) {
      errorHandler.handleApiError(error, "خطا در ثبت درخواست برداشت");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card/80 border-border rounded-3xl transition-colors duration-300">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Plus className="w-6 h-6 text-green-400" />
          درخواست دریافت پول
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amount and Currency */}
        <div>
          <h4 className="text-foreground font-medium mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            مبلغ و ارز
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              placeholder="مبلغ"
              value={formData.amount}
              onChange={handleInputChange('amount')}
              className="bg-muted border-border text-foreground rounded-2xl"
              type="number"
              min="1"
              step="0.01"
            />
            <Select value={formData.currency} onValueChange={handleSelectChange('currency')}>
              <SelectTrigger className="bg-muted border-border text-foreground rounded-2xl">
                <SelectValue placeholder="انتخاب ارز" />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                <SelectItem value="USD" className="text-foreground">دلار آمریکا (USD)</SelectItem>
                <SelectItem value="AED" className="text-foreground">درهم امارات (AED)</SelectItem>
                <SelectItem value="SAR" className="text-foreground">ریال سعودی (SAR)</SelectItem>
                <SelectItem value="KWD" className="text-foreground">دینار کویت (KWD)</SelectItem>
                <SelectItem value="QAR" className="text-foreground">ریال قطر (QAR)</SelectItem>
                <SelectItem value="BHD" className="text-foreground">دینار بحرین (BHD)</SelectItem>
                <SelectItem value="OMR" className="text-foreground">ریال عمان (OMR)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Source Country */}
        <div>
          <h4 className="text-foreground font-medium mb-3">کشور مبدا</h4>
          <Select value={formData.sourceCountry} onValueChange={handleSelectChange('sourceCountry')}>
            <SelectTrigger className="bg-muted border-border text-foreground rounded-2xl">
              <SelectValue placeholder="انتخاب کشور مبدا" />
            </SelectTrigger>
            <SelectContent className="bg-muted border-border">
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code} className="text-foreground">
                  {country.flag} {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bank Card Information */}
        <div>
          <h4 className="text-foreground font-medium mb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-400" />
            اطلاعات کارت بانکی ایرانی
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              placeholder="شماره کارت (۱۶ رقم)"
              value={formData.bankCardNumber}
              onChange={handleInputChange('bankCardNumber')}
              className="bg-muted border-border text-foreground rounded-2xl"
              maxLength={19}
            />
            <Input
              placeholder="نام صاحب کارت"
              value={formData.cardHolderName}
              onChange={handleInputChange('cardHolderName')}
              className="bg-muted border-border text-foreground rounded-2xl"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Input
              placeholder="شماره شبا (IR)"
              value={formData.shebaNumber}
              onChange={handleInputChange('shebaNumber')}
              className="bg-muted border-border text-foreground rounded-2xl"
            />
            <Input
              placeholder="نام بانک"
              value={formData.bankName}
              onChange={handleInputChange('bankName')}
              className="bg-muted border-border text-foreground rounded-2xl"
            />
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h5 className="text-blue-300 font-medium mb-2">نکات مهم:</h5>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• درخواست شما پس از بررسی کارشناس تایید می‌شود</li>
                <li>• شماره حساب مقصد پس از تایید ارسال می‌شود</li>
                <li>• پس از واریز، فیش را بارگذاری کنید</li>
                <li>• پول به حساب شما تا ۲۴ ساعت واریز می‌شود</li>
              </ul>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 rounded-2xl"
        >
          {loading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Plus className="w-4 h-4 ml-2" />}
          {loading ? "در حال ثبت..." : "ثبت درخواست"}
        </Button>
      </CardContent>
    </Card>
  );
};
