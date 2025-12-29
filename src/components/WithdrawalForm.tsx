import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { errorHandler } from "@/utils/errorHandler";
import { COUNTRIES } from "@/constants/countries";
import { 
  CreditCard, 
  DollarSign, 
  Plus,
  Shield,
  Loader2,
  Copy,
  ExternalLink,
  CheckCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WithdrawalFormProps {
  onSuccess: () => void;
}

const countries = COUNTRIES;

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
  const [showAccountDetails, setShowAccountDetails] = useState(false);

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
      
      // Show account details
      setShowAccountDetails(true);
      
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
                <SelectItem value="IQD" className="text-foreground">دینار عراق (IQD)</SelectItem>
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

        {/* Account Details - Shown after successful request */}
        {showAccountDetails && (
          <Alert className="border-green-500/50 bg-green-500/10 rounded-2xl">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="space-y-4">
              <div>
                <h5 className="text-green-700 dark:text-green-300 font-bold mb-3 text-lg">اطلاعات حساب برای واریز:</h5>
                
                {/* PayPal */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <h6 className="font-semibold text-foreground">پی پل (PayPal)</h6>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">لینک:</span>
                      <a 
                        href="https://paypal.me/Asllpay" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-sm flex items-center gap-1"
                      >
                        https://paypal.me/Asllpay
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText('https://paypal.me/Asllpay');
                          toast({
                            title: "کپی شد",
                            description: "لینک پی پل کپی شد",
                          });
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Visa Swift */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <h6 className="font-semibold text-foreground">ویزا سوئیفت (Visa Swift)</h6>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[100px]">Account Holder:</span>
                      <span className="text-foreground font-mono">Asll Market</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[100px]">Swift/BIC:</span>
                      <span className="text-foreground font-mono">TRWIUS35XXX</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText('TRWIUS35XXX');
                          toast({
                            title: "کپی شد",
                            description: "Swift/BIC کپی شد",
                          });
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Wise Account Details */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <h6 className="font-semibold text-foreground">حساب Wise (USD)</h6>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[100px]">Name:</span>
                      <span className="text-foreground font-mono">Asll Market</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[100px]">Account Number:</span>
                      <span className="text-foreground font-mono">338866869696326</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText('338866869696326');
                          toast({
                            title: "کپی شد",
                            description: "شماره حساب کپی شد",
                          });
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[100px]">Swift/BIC:</span>
                      <span className="text-foreground font-mono">TRWIUS35XXX</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText('TRWIUS35XXX');
                          toast({
                            title: "کپی شد",
                            description: "Swift/BIC کپی شد",
                          });
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-start gap-2 mt-2">
                      <span className="text-muted-foreground min-w-[100px]">Address:</span>
                      <span className="text-foreground text-xs">Wise US Inc, 108 W 13th St, Wilmington, DE, 19801, United States</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>نکته:</strong> برای ارسال از خارج از آمریکا از Swift transfer استفاده کنید.
                    </p>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Additional Information */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h5 className="text-blue-700 dark:text-blue-300 font-medium mb-2">نکات مهم:</h5>
              <ul className="text-blue-600 dark:text-blue-200 text-sm space-y-1">
                <li>• درخواست شما پس از بررسی کارشناس تایید می‌شود</li>
                <li>• شماره حساب مقصد در بالا نمایش داده شده است</li>
                <li>• پس از واریز، فیش را بارگذاری کنید</li>
                <li>• پول به حساب شما تا ۲۴ ساعت واریز می‌شود</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 rounded-2xl"
          >
            {loading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Plus className="w-4 h-4 ml-2" />}
            {loading ? "در حال ثبت..." : "ثبت درخواست"}
          </Button>
          {showAccountDetails && (
            <Button
              variant="outline"
              onClick={() => setShowAccountDetails(false)}
              className="w-full rounded-2xl"
            >
              بستن اطلاعات حساب
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
