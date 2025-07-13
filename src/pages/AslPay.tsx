import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Upload,
  Download,
  Eye,
  Plus,
  Banknote,
  Shield,
  FileText,
  User
} from "lucide-react";

const AslPay = () => {
  const [activeTab, setActiveTab] = useState("request");
  const [amount, setAmount] = useState("");
  const [sourceCountry, setSourceCountry] = useState("");
  const [currency, setCurrency] = useState("");

  const countries = [
    { code: "AE", name: "امارات متحده عربی", flag: "🇦🇪", currency: "AED" },
    { code: "SA", name: "عربستان سعودی", flag: "🇸🇦", currency: "SAR" },
    { code: "KW", name: "کویت", flag: "🇰🇼", currency: "KWD" },
    { code: "QA", name: "قطر", flag: "🇶🇦", currency: "QAR" },
    { code: "BH", name: "بحرین", flag: "🇧🇭", currency: "BHD" },
    { code: "OM", name: "عمان", flag: "🇴🇲", currency: "OMR" }
  ];

  const paymentRequests = [
    {
      id: "PAY-001",
      amount: 2500,
      currency: "AED",
      sourceCountry: "AE",
      status: "completed",
      bankAccount: "IR123456789012345678901234",
      userBankCard: "6037-9977-****-1234",
      createdAt: "۱۴۰۳/۰۸/۱۵",
      completedAt: "۱۴۰۳/۰۸/۱۷",
      receipt: "receipt_001.pdf"
    },
    {
      id: "PAY-002",
      amount: 1800,
      currency: "SAR",
      sourceCountry: "SA",
      status: "processing",
      bankAccount: "IR987654321098765432109876",
      createdAt: "۱۴۰۳/۰۸/۲۰",
      receipt: null
    },
    {
      id: "PAY-003",
      amount: 950,
      currency: "USD",
      sourceCountry: "QA",
      status: "pending",
      createdAt: "۱۴۰۳/۰۸/۲۲",
      receipt: null
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "processing": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "pending": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "rejected": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "تکمیل شده";
      case "processing": return "در حال پردازش";
      case "pending": return "در انتظار بررسی";
      case "rejected": return "رد شده";
      default: return "نامشخص";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return CheckCircle;
      case "processing": return Clock;
      case "pending": return AlertTriangle;
      case "rejected": return AlertTriangle;
      default: return Clock;
    }
  };

  const handleSubmitRequest = () => {
    if (!amount || !sourceCountry || !currency) {
      alert("لطفا تمام فیلدها را پر کنید");
      return;
    }
    
    // Here you would typically send the request to your backend
    alert("درخواست شما با موفقیت ثبت شد و در حال بررسی است");
    
    // Reset form
    setAmount("");
    setSourceCountry("");
    setCurrency("");
  };

  const PaymentRequestForm = () => (
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-muted border-border text-foreground rounded-2xl"
              type="number"
            />
            <Select value={currency} onValueChange={setCurrency}>
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
          <Select value={sourceCountry} onValueChange={setSourceCountry}>
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
              className="bg-muted border-border text-foreground rounded-2xl"
              maxLength={19}
            />
            <Input
              placeholder="نام صاحب کارت"
              className="bg-muted border-border text-foreground rounded-2xl"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Input
              placeholder="شماره شبا (IR)"
              className="bg-muted border-border text-foreground rounded-2xl"
            />
            <Input
              placeholder="نام بانک"
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
          onClick={handleSubmitRequest}
          className="w-full bg-green-500 hover:bg-green-600 rounded-2xl"
        >
          <Plus className="w-4 h-4 ml-2" />
          ثبت درخواست
        </Button>
      </CardContent>
    </Card>
  );

  const PaymentHistory = () => (
    <div className="space-y-6">
      {paymentRequests.map((request) => {
        const StatusIcon = getStatusIcon(request.status);
        const country = countries.find(c => c.code === request.sourceCountry);
        
        return (
          <Card key={request.id} className="bg-card/80 border-border rounded-3xl transition-colors duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-foreground">{request.id}</h4>
                    <Badge className={`${getStatusColor(request.status)} rounded-full`}>
                      <StatusIcon className="w-3 h-3 ml-1" />
                      {getStatusText(request.status)}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground text-sm">
                    ایجاد شده: {request.createdAt}
                    {request.completedAt && (
                      <span className="mr-4">تکمیل شده: {request.completedAt}</span>
                    )}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-foreground">
                    {request.amount.toLocaleString()} {request.currency}
                  </div>
                  {country && (
                    <div className="text-muted-foreground text-sm">
                      {country.flag} {country.name}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h5 className="text-foreground font-medium">جزئیات درخواست</h5>
                  
                  {request.bankAccount && (
                    <div className="flex items-center gap-2 text-sm">
                      <Banknote className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">حساب مقصد:</span>
                      <span className="text-foreground font-mono">{request.bankAccount}</span>
                    </div>
                  )}
                  
                  {request.userBankCard && (
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">کارت شما:</span>
                      <span className="text-foreground font-mono">{request.userBankCard}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h5 className="text-foreground font-medium">عملیات</h5>
                  
                  <div className="flex flex-wrap gap-2">
                    {request.status === "processing" && request.bankAccount && (
                      <Button size="sm" className="bg-blue-500 hover:bg-blue-600 rounded-2xl">
                        <Upload className="w-4 h-4 ml-2" />
                        بارگذاری فیش
                      </Button>
                    )}
                    
                    {request.receipt && (
                      <Button size="sm" variant="outline" className="border-border text-muted-foreground hover:bg-muted rounded-2xl">
                        <Download className="w-4 h-4 ml-2" />
                        دانلود فیش
                      </Button>
                    )}
                    
                    <Button size="sm" variant="outline" className="border-border text-muted-foreground hover:bg-muted rounded-2xl">
                      <Eye className="w-4 h-4 ml-2" />
                      جزئیات
                    </Button>
                  </div>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 ${
                    ["pending", "processing", "completed"].includes(request.status) 
                      ? "text-green-400" 
                      : "text-muted-foreground"
                  }`}>
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">درخواست ثبت شد</span>
                  </div>
                  
                  <div className={`flex items-center gap-2 ${
                    ["processing", "completed"].includes(request.status) 
                      ? "text-green-400" 
                      : "text-muted-foreground"
                  }`}>
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">تایید کارشناس</span>
                  </div>
                  
                  <div className={`flex items-center gap-2 ${
                    request.status === "completed" 
                      ? "text-green-400" 
                      : "text-muted-foreground"
                  }`}>
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">واریز به حساب</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in transition-colors duration-300">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-900/20 to-green-800/20 border-green-700/50 rounded-3xl transition-colors duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-3xl flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">اصل پی</h2>
              <p className="text-green-300">سیستم دریافت پول بین‌المللی</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex gap-4">
        <Button
          variant={activeTab === "request" ? "default" : "outline"}
          onClick={() => setActiveTab("request")}
          className={`rounded-2xl ${
            activeTab === "request"
              ? "bg-green-500 hover:bg-green-600"
              : "border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          <Plus className="w-4 h-4 ml-2" />
          درخواست جدید
        </Button>
        <Button
          variant={activeTab === "history" ? "default" : "outline"}
          onClick={() => setActiveTab("history")}
          className={`rounded-2xl ${
            activeTab === "history"
              ? "bg-green-500 hover:bg-green-600"
              : "border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          <FileText className="w-4 h-4 ml-2" />
          تاریخچه درخواست‌ها
        </Button>
      </div>

      {/* Content */}
      {activeTab === "request" ? <PaymentRequestForm /> : <PaymentHistory />}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/80 border-border rounded-3xl transition-colors duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۱۲</div>
            <p className="text-sm text-muted-foreground">درخواست کل</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 border-border rounded-3xl transition-colors duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۸</div>
            <p className="text-sm text-muted-foreground">تکمیل شده</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 border-border rounded-3xl transition-colors duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">$۱۵,۲۴۰</div>
            <p className="text-sm text-muted-foreground">کل دریافتی</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 border-border rounded-3xl transition-colors duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۲۴ ساعت</div>
            <p className="text-sm text-muted-foreground">میانگین پردازش</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AslPay;