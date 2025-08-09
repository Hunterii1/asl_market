import { useState, useEffect, useCallback, memo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LicenseGate } from '@/components/LicenseGate';
import { Badge } from "@/components/ui/badge";
import { WithdrawalForm } from "@/components/WithdrawalForm";
import { toast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
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
  User,
  Loader2
} from "lucide-react";

const AslPay = () => {
  const [activeTab, setActiveTab] = useState("request");
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [stats, setStats] = useState(null);

  const countries = [
    { code: "AE", name: "امارات متحده عربی", flag: "🇦🇪", currency: "AED" },
    { code: "SA", name: "عربستان سعودی", flag: "🇸🇦", currency: "SAR" },
    { code: "KW", name: "کویت", flag: "🇰🇼", currency: "KWD" },
    { code: "QA", name: "قطر", flag: "🇶🇦", currency: "QAR" },
    { code: "BH", name: "بحرین", flag: "🇧🇭", currency: "BHD" },
    { code: "OM", name: "عمان", flag: "🇴🇲", currency: "OMR" }
  ];



  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "processing": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "approved": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "pending": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "rejected": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "تکمیل شده";
      case "processing": return "در حال پردازش";
      case "approved": return "تایید شده";
      case "pending": return "در انتظار بررسی";
      case "rejected": return "رد شده";
      default: return "نامشخص";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return CheckCircle;
      case "processing": return Clock;
      case "approved": return CheckCircle;
      case "pending": return AlertTriangle;
      case "rejected": return AlertTriangle;
      default: return Clock;
    }
  };

  useEffect(() => {
    loadWithdrawalRequests();
    loadStats();
  }, []);

  const loadWithdrawalRequests = async () => {
    try {
      const requests = await apiService.getUserWithdrawalRequests();
      setWithdrawalRequests(requests.requests || []);
    } catch (error) {
      console.error('Error loading withdrawal requests:', error);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await apiService.getWithdrawalStats();
      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFormSuccess = () => {
    loadWithdrawalRequests();
    loadStats();
  };

  const handleUploadReceipt = (requestId: number) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,.pdf';
    fileInput.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('receipt', file);

      try {
        await apiService.uploadWithdrawalReceipt(requestId, file);
        toast({
          title: "موفقیت",
          description: "فیش با موفقیت بارگذاری شد",
        });
        loadWithdrawalRequests(); // Reload to show updated status
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "خطا",
          description: "خطا در بارگذاری فیش",
          variant: "destructive",
        });
      }
    };
    fileInput.click();
  };



  const PaymentHistory = () => (
    <div className="space-y-6">
      {withdrawalRequests.map((request: any) => {
        const StatusIcon = getStatusIcon(request.status);
        const country = countries.find(c => c.code === request.source_country);
        
        return (
          <Card key={request.id} className="bg-card/80 border-border rounded-3xl transition-colors duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-foreground">#{request.id}</h4>
                    <Badge className={`${getStatusColor(request.status)} rounded-full`}>
                      <StatusIcon className="w-3 h-3 ml-1" />
                      {getStatusText(request.status)}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground text-sm">
                    ایجاد شده: {new Date(request.created_at).toLocaleDateString('fa-IR')}
                    {request.completed_at && (
                      <span className="mr-4">تکمیل شده: {new Date(request.completed_at).toLocaleDateString('fa-IR')}</span>
                    )}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-foreground">
                    {request.amount?.toLocaleString()} {request.currency}
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
                  
                  {request.destination_account && (
                    <div className="flex items-center gap-2 text-sm">
                      <Banknote className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">حساب مقصد:</span>
                      <span className="text-foreground font-mono">{request.destination_account}</span>
                    </div>
                  )}
                  
                  {request.bank_card_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">کارت شما:</span>
                      <span className="text-foreground font-mono">{request.bank_card_number}</span>
                    </div>
                  )}

                  {request.admin_notes && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">یادداشت:</span>
                      <span className="text-foreground">{request.admin_notes}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h5 className="text-foreground font-medium">عملیات</h5>
                  
                  <div className="flex flex-wrap gap-2">
                    {(request.status === "approved" || request.status === "processing") && request.destination_account && (
                      <Button 
                        size="sm" 
                        className="bg-blue-500 hover:bg-blue-600 rounded-2xl"
                        onClick={() => handleUploadReceipt(request.id)}
                      >
                        <Upload className="w-4 h-4 ml-2" />
                        بارگذاری فیش
                      </Button>
                    )}
                    
                    {request.receipt_path && (
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
                      ? "text-green-600 dark:text-green-400" 
                      : "text-muted-foreground"
                  }`}>
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">درخواست ثبت شد</span>
                  </div>
                  
                  <div className={`flex items-center gap-2 ${
                    ["approved", "processing", "completed"].includes(request.status) 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-muted-foreground"
                  }`}>
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">تایید کارشناس</span>
                  </div>
                  
                  <div className={`flex items-center gap-2 ${
                    request.status === "completed" 
                      ? "text-green-600 dark:text-green-400" 
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
    <LicenseGate>
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
              <p className="text-green-600 dark:text-green-300">سیستم دریافت پول بین‌المللی</p>
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
      {activeTab === "request" ? <WithdrawalForm onSuccess={handleFormSuccess} /> : <PaymentHistory />}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/80 border-border rounded-3xl transition-colors duration-300">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.total || 0}</div>
              <p className="text-sm text-muted-foreground">درخواست کل</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/80 border-border rounded-3xl transition-colors duration-300">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.completed || 0}</div>
              <p className="text-sm text-muted-foreground">تکمیل شده</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/80 border-border rounded-3xl transition-colors duration-300">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.pending || 0}</div>
              <p className="text-sm text-muted-foreground">در انتظار</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/80 border-border rounded-3xl transition-colors duration-300">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.processing || 0}</div>
              <p className="text-sm text-muted-foreground">در حال پردازش</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </LicenseGate>
  );
};

export default AslPay;